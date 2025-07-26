import { Component, DestroyRef, inject, Inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UnifiedDeliveryService } from '../../../../shared/services/delivery.service';
import { UnifiedDelivery } from '../../../../shared/models/UnifiedDelivery';
import { BankAccount } from '../../../../finance/models/BankAccount';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastService } from '../../../../shared/services/toast.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCheckbox } from '@angular/material/checkbox';
import { OilCredit } from '../../../../finance/models/OilCredit';
import { QualityControlResultDto } from '../../../../shared/models/QualityControlResultDto';
import { FinancialTransaction, PaymentMethod, TransactionStatus } from '../../../../finance/models/financial-transaction';
import { OsmDashboard } from '../../../../shared/modules/osm-dashboard/osm-dashboard';
import { AdvancedSearchService } from '../../../../shared/services/advanced-serach.service';
import { SearchData } from '../../../../shared/models/advanced-search/searchData';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';

export interface PaymentHistoryItem {
  id: string;
  lotNumber: string;
  deliveryDate: Date;
  deliveryNumber: string;
  lotOliveNumber: string | null;
  poidsNet: number;
  price: number;
  oilQuantity: number;
  paidAmount: number;
  unpaidAmount: number;
  status: 'paid' | 'unpaid' | 'partial';
  reference: string;
  deliveryType?: string; // Added for oil deliveries
}

@Component({
  selector: 'app-supplier-payment-history',
  standalone: true,
  imports: [
    CommonModule,
    MatIcon,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDividerModule,
    MatChipsModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    MatCheckbox,
    OsmDashboard
  ],
  templateUrl: './supplier-payment-history.component.html',
  styleUrls: ['./supplier-payment-history.component.scss']
})
export class SupplierPaymentHistoryComponent implements OnInit {
  supplierId: string;
  supplierName: string = '';
  historyType: 'oil_credit' | 'paid' | 'unpaid' = 'oil_credit';
  loading = false;
  error: string | null = null;
  payments: PaymentHistoryItem[] = [];
  displayedColumns: string[] = ['deliveryNumber', 'lotNumber', 'deliveryDate', 'price', 'paidAmount', 'unpaidAmount', 'status', 'actions'];

  totalDeliveries = 0;
  totalPaid = 0;
  totalUnpaid = 0;
  totalOliveWeight = 0;
  // Payment functionality
  selectedPayment: PaymentHistoryItem | null = {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    lotNumber: 'LOT‑20250725‑01',
    deliveryDate: new Date('2025-07-25T10:30:00'),
    deliveryNumber: 'DEL‑20250725‑A',
    lotOliveNumber: 'OL‑20250725‑XYZ',
    poidsNet: 1250.5,
    price: 3750.0,
    oilQuantity: 150.0,
    paidAmount: 1250.0,
    unpaidAmount: 2500.0,
    status: 'partial',
    reference: 'REF‑LOT‑20250725‑01',
    deliveryType: 'OLIVE'
  };
  paymentForm: FormGroup;
  oilPricePerLiter = 25; // Default oil price per liter in TND
  oilEquivalent = 0;
  remainingAmount = 0;
  showPaymentForm = false;
  selectedDelivery: PaymentHistoryItem | null = null;
  bankAccounts: BankAccount[] = [];
  loadingBankAccounts = false;
  selectedPaymentMethod: 'cash' | 'oil' | 'both' = 'cash';
  moneyPaymentMethod: 'cash' | 'check' | 'bank_transfer' = 'cash';
  paymentsDataSource = new MatTableDataSource<PaymentHistoryItem>([]);

  // Remove old paymentMethodMoney/paymentMethodOil logic from UI control (keep for form logic if needed)
  oilQcResults: QualityControlResultDto[] = [];
  // Add property to store related oil delivery
  relatedOilDelivery: UnifiedDelivery | null = null;
  oilPaymentAvailable = true;

  readonly destroyRef = inject(DestroyRef);

  constructor(
    private router: Router,
    private deliveryService: UnifiedDeliveryService,
    private fb: FormBuilder,
    private translateService: TranslateService,
    private toastService: ToastService,
    private _searchService: AdvancedSearchService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _dialogRef: MatDialogRef<SupplierPaymentHistoryComponent>
  ) {}

  /**
   * Handles payment method changes.
   * This method manages the UI state and data fetching based on the selected payment method.
   */
  onPaymentMethodChange(): void {
    console.log(`[SupplierPayment] Payment method changed to: ${this.selectedPaymentMethod}`);

    // Reset form based on new payment method
    this.resetPaymentFormForMethod(this.selectedPaymentMethod);

    // Show/hide forms and fetch QC results as needed
    if ((this.selectedPaymentMethod === 'oil' || this.selectedPaymentMethod === 'both') && this.selectedPayment) {
      console.log(`[SupplierPayment] Oil payment selected for delivery: ${this.selectedPayment.lotNumber}`);
      console.log(`[SupplierPayment] Selected payment details:`, {
        lotNumber: this.selectedPayment.lotNumber,
        lotOliveNumber: this.selectedPayment.lotOliveNumber,
        unpaidAmount: this.selectedPayment.unpaidAmount,
        deliveryType: this.selectedPayment.deliveryType
      });

      // Fetch related oil delivery for payment processing
      if (this.selectedPayment.lotNumber) {
        this.fetchRelatedOilDeliveryForPayment(this.selectedPayment.lotNumber);
      }

      // Fetch quality control results for oil payment
      this.getDeliveryByOliveLotNumber(this.selectedPayment.id);
    } else {
      console.log(`[SupplierPayment] Clearing quality control results for non-oil payment`);
      this.oilQcResults = [];
      this.relatedOilDelivery = null;
    }

    console.log(`[SupplierPayment] Payment method change completed: ${this.selectedPaymentMethod}`);
  }

  ngOnInit(): void {
    this.paymentForm = this.fb.group({
      paymentMethod: ['cash'],
      moneyPaymentMethod: ['cash'],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      checkNumber: [''],
      bankAccount: [''],
      oilQuantity: [0, [Validators.required, Validators.min(0.01)]],
      oilPrice: [0, [Validators.required, Validators.min(0.01)]]
    });
    this.loadBankAccounts();
    console.log(this.data.row);
    this.processData();
  }

  relatedOilReception() {
    this.deliveryService
      .getDeliveryByOliveLotNumber(this.data.row.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((res) => {
          this.relatedOilDelivery = res.data[0];
        })
      )
      .subscribe();
  }

  closePaymentForm(): void {
    this._dialogRef.close();
  }

  resetPaymentForm(): void {
    if (this.paymentForm) {
      this.paymentForm.reset({
        amount: 0,
        checkNumber: '',
        bankAccountId: '',
        oilQuantity: 0,
        oilPricePerKg: this.oilPricePerLiter,
        moneyPaymentMethod: 'cash'
      });
    }
    this.oilEquivalent = 0;
    this.remainingAmount = 0;
    this.selectedPaymentMethod = 'cash';
    this.moneyPaymentMethod = 'cash';
  }

  onMoneyPaymentMethodChange(): void {
    // Reset form controls based on payment method
    if (this.moneyPaymentMethod === 'cash') {
      this.paymentForm!.patchValue({
        checkNumber: '',
        bankAccountId: ''
      });
    }
    this.paymentForm!.get('checkNumber')?.updateValueAndValidity();
    this.paymentForm!.get('bankAccountId')?.updateValueAndValidity();
  }

  calculateOilEquivalent(): void {
    if (this.selectedPayment) {
      const currentOilPrice = this.paymentForm!.get('oilPricePerKg')?.value || this.oilPricePerLiter;
      this.oilEquivalent = this.selectedPayment.unpaidAmount / currentOilPrice;
    }
  }

  calculatePayment(): void {
    if (this.selectedPayment) {
      const paymentAmount = this.paymentForm!.get('amount')?.value || 0;
      this.remainingAmount = Math.max(0, this.selectedPayment.unpaidAmount - paymentAmount);

      // Recalculate oil equivalent for mixed payments
      if (this.selectedPaymentMethod === 'both') {
        this.calculateOilEquivalent();
      }
    }
  }

  calculateOilPayment(): void {
    if (this.selectedPayment) {
      const oilQuantity = this.paymentForm!.get('oilQuantity')?.value || 0;
      const oilPricePerKg = this.paymentForm!.get('oilPricePerKg')?.value || this.oilPricePerLiter;
      const oilValue = oilQuantity * oilPricePerKg;

      if (this.selectedPaymentMethod === 'both') {
        // For mixed payment, calculate remaining after both cash and oil
        const cashAmount = this.paymentForm!.get('amount')?.value || 0;
        this.remainingAmount = Math.max(0, this.selectedPayment.unpaidAmount - cashAmount - oilValue);
      } else {
        // For oil-only payment
        this.remainingAmount = Math.max(0, this.selectedPayment.unpaidAmount - oilValue);
      }
    }
  }

  /**
   * Calculates the total payment value for mixed payments
   * @returns Total payment value
   */
  calculateTotalPaymentValue(): number {
    if (!this.selectedPayment || !this.paymentForm) return 0;

    const cashAmount = this.paymentForm.get('amount')?.value || 0;
    const oilQuantity = this.paymentForm.get('oilQuantity')?.value || 0;
    const oilPricePerKg = this.paymentForm.get('oilPricePerKg')?.value || 0;
    const oilValue = oilQuantity * oilPricePerKg;

    return cashAmount + oilValue;
  }

  /**
   * Gets the remaining amount after cash payment for mixed payments
   * @returns Remaining amount after cash
   */
  getRemainingAfterCash(): number {
    if (!this.selectedPayment || !this.paymentForm) return 0;

    const cashAmount = this.paymentForm.get('amount')?.value || 0;
    return Math.max(0, this.selectedPayment.unpaidAmount - cashAmount);
  }

  /**
   * Validates if the oil quantity is within the remaining amount after cash
   * @returns True if valid
   */
  isOilQuantityValid(): boolean {
    if (this.selectedPaymentMethod !== 'both') return true;

    const oilQuantity = this.paymentForm!.get('oilQuantity')?.value || 0;
    const oilPricePerKg = this.paymentForm!.get('oilPricePerKg')?.value || 0;
    const oilValue = oilQuantity * oilPricePerKg;
    const remainingAfterCash = this.getRemainingAfterCash();

    return oilValue <= remainingAfterCash;
  }

  /**
   * Handles input changes for mixed payment calculations
   */
  onMixedPaymentInputChange(): void {
    if (this.selectedPaymentMethod === 'both') {
      this.calculatePayment();
      this.calculateOilPayment();
    }
  }

  // Update isPaymentFormValid and related logic to use 'cash', 'oil', or 'both'
  isPaymentFormValid(): boolean {
    if (!this.selectedPaymentMethod || !this.selectedPayment || !this.paymentForm) {
      return false;
    }

    if (this.selectedPaymentMethod === 'cash') {
      const amount = this.paymentForm.get('amount')?.value || 0;
      if (amount <= 0 || amount > this.selectedPayment.unpaidAmount) {
        return false;
      }

      // Validate check/bank transfer specific fields
      if (this.moneyPaymentMethod === 'check') {
        const checkNumber = this.paymentForm.get('checkNumber')?.value;
        if (!checkNumber || checkNumber.trim() === '') {
          return false;
        }
      }

      if (this.moneyPaymentMethod === 'bank_transfer') {
        const bankAccountId = this.paymentForm.get('bankAccountId')?.value;
        if (!bankAccountId) {
          return false;
        }
      }

      return true;
    } else if (this.selectedPaymentMethod === 'oil') {
      const oilQuantity = this.paymentForm.get('oilQuantity')?.value || 0;
      const oilPricePerKg = this.paymentForm.get('oilPricePerKg')?.value || 0;
      if (oilQuantity <= 0 || oilPricePerKg <= 0) {
        return false;
      }

      const oilValue = oilQuantity * oilPricePerKg;
      if (oilValue > this.selectedPayment.unpaidAmount) {
        return false;
      }

      return true;
    } else if (this.selectedPaymentMethod === 'both') {
      const cashAmount = this.paymentForm.get('amount')?.value || 0;
      const oilQuantity = this.paymentForm.get('oilQuantity')?.value || 0;
      const oilPricePerKg = this.paymentForm.get('oilPricePerKg')?.value || 0;

      if (cashAmount <= 0 && oilQuantity <= 0) {
        return false;
      }

      const oilValue = oilQuantity * oilPricePerKg;
      const totalValue = cashAmount + oilValue;

      if (totalValue > this.selectedPayment.unpaidAmount) {
        return false;
      }

      // Validate cash payment method if cash amount > 0
      if (cashAmount > 0) {
        if (this.moneyPaymentMethod === 'check') {
          const checkNumber = this.paymentForm.get('checkNumber')?.value;
          if (!checkNumber || checkNumber.trim() === '') {
            return false;
          }
        }

        if (this.moneyPaymentMethod === 'bank_transfer') {
          const bankAccountId = this.paymentForm.get('bankAccountId')?.value;
          if (!bankAccountId) {
            return false;
          }
        }
      }

      return true;
    }
    return false;
  }

  /**
   * Processes the payment with comprehensive validation and error handling.
   * This method handles different payment methods (cash, oil, both) and validates all data before processing.
   */
  processPayment(): void {
    console.log(`[SupplierPayment] Processing payment for delivery: ${this.selectedPayment?.lotNumber}`);

    // Comprehensive validation
    if (!this.selectedPayment) {
      console.error('[SupplierPayment] No payment selected for processing');
      this.toastService.error('Aucun paiement sélectionné');
      return;
    }

    if (!this.paymentForm) {
      console.error('[SupplierPayment] Payment form is not initialized');
      this.toastService.error('Formulaire de paiement non initialisé');
      return;
    }

    if (!this.isPaymentFormValid()) {
      console.error('[SupplierPayment] Payment form validation failed');
      this.toastService.error('Formulaire de paiement invalide. Veuillez vérifier les champs.');
      return;
    }

    if (!this.selectedPaymentMethod) {
      console.error('[SupplierPayment] No payment method selected');
      this.toastService.error('Méthode de paiement non sélectionnée');
      return;
    }

    try {
      // Validate payment data based on method
      const validationResult = this.validatePaymentData();
      if (!validationResult.isValid) {
        console.error('[SupplierPayment] Payment validation failed:', validationResult.error);
        this.toastService.error(validationResult.error || 'Erreur de validation');
        return;
      }

      // Build payment data object
      const paymentData = this.buildPaymentData();
      console.log('[SupplierPayment] Payment data:', paymentData);

      // --- Custom: Log FinancialTransaction for cash and mixed payments ---
      if ((this.selectedPaymentMethod === 'cash' || this.selectedPaymentMethod === 'both') && this.selectedPayment) {
        const relatedEntityId = Number(this.selectedPayment.id);
        // Cash part
        const cashAmount = this.paymentForm?.get('amount')?.value || 0;
        if (cashAmount > 0) {
          const cashTransaction: FinancialTransaction = {
            amount: cashAmount,
            currency: 'TND',
            paymentMethod: PaymentMethod.CASH,
            status: TransactionStatus.VALIDATED,
            relatedEntityId: isNaN(relatedEntityId) ? undefined : relatedEntityId
          };
          console.log('[SupplierPayment] Created FinancialTransaction (cash part):', cashTransaction);
        }
        // Oil part (for mixed)
        if (this.selectedPaymentMethod === 'both') {
          const oilQuantity = this.paymentForm?.get('oilQuantity')?.value || 0;
          const oilPricePerKg = this.paymentForm?.get('oilPricePerKg')?.value || this.oilPricePerLiter;
          if (oilQuantity > 0) {
            const oilTransaction: FinancialTransaction = {
              amount: oilQuantity * oilPricePerKg,
              currency: 'TND',
              paymentMethod: PaymentMethod.TRANSFER, // or a custom enum for oil?
              status: TransactionStatus.VALIDATED,
              relatedEntityId: isNaN(relatedEntityId) ? undefined : relatedEntityId,
              reference: 'OIL_PAYMENT'
            };
            console.log('[SupplierPayment] Created FinancialTransaction (oil part):', oilTransaction);
          }
        }
        console.log('[SupplierPayment] Paid amount:', this.selectedPayment.paidAmount, 'Unpaid amount:', this.selectedPayment.unpaidAmount);
      }
      // --- End Custom ---
    } catch (error) {
      console.error('[SupplierPayment] Unexpected error during payment processing:', error);
      this.toastService.error('Erreur inattendue lors du traitement du paiement');
    }
  }

  viewPaymentDetails(payment: PaymentHistoryItem): void {
    this.toastService.info(this.translateService.instant('SUPPLIER_PAYMENT.LOT_DETAILS', { lotNumber: payment.lotNumber }));
  }

  loadBankAccounts(): void {
    this._searchService
      .search(new SearchData(), 'finance/banks')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((res) => {
          this.bankAccounts = res?.data;
        })
      )
      .subscribe();
  }

  getSelectedDeliveryType(): string | null {
    if (!this.selectedPayment) return null;
    // If the PaymentHistoryItem does not have deliveryType, you may need to store it in the mapping
    // For now, try to get it from the selectedPayment if available
    return (this.selectedPayment as unknown as { deliveryType?: string }).deliveryType || null;
  }

  /**
   * Fetches delivery information by olive lot number for quality control results.
   * This method is called when payment method is 'oil' or 'both' to get related delivery data.
   *
   * @param id The olive lot number to fetch delivery information for
   */
  getDeliveryByOliveLotNumber(id: string | null): void {
    console.log(`[SupplierPayment] Fetching delivery by olive lot number: ${id}`);

    if (!id) {
      console.warn(`[SupplierPayment] No olive lot number provided for delivery fetch`);
      this.oilQcResults = [];
      return;
    }

    try {
      this.deliveryService.getDeliveryByOliveLotNumber(id).subscribe({
        next: (res) => {
          console.log(`[SupplierPayment] Delivery fetch response:`, res);

          if (res.success && Array.isArray(res.data)) {
            console.log(`[SupplierPayment] Found ${res.data.length} delivery records for olive lot: ${id}`);

            // Process the delivery data
            res.data.forEach((delivery, index) => {
              console.log(`[SupplierPayment] Delivery ${index + 1}:`, {
                lotNumber: delivery.lotNumber,
                deliveryType: delivery.deliveryType,
                status: delivery.status,
                oilQuantity: delivery.oilQuantity,
                unitPrice: delivery.unitPrice
              });
            });

            // TODO: Process quality control results from delivery data
            // For now, just log the data
            console.log(`[SupplierPayment] Quality control results processing not yet implemented`);
          } else {
            console.warn(`[SupplierPayment] No delivery data found for olive lot: ${id}`);
            this.oilQcResults = [];
          }
        },
        error: (error) => {
          console.error(`[SupplierPayment] Error fetching delivery for olive lot ${id}:`, error);
          this.oilQcResults = [];
          // Optionally show user-friendly error message
          this.toastService.error('Erreur lors de la récupération des données de livraison');
        }
      });
    } catch (error) {
      console.error(`[SupplierPayment] Unexpected error in getDeliveryByOliveLotNumber:`, error);
      this.oilQcResults = [];
    }
  }

  /**
   * Fetch related oil delivery for payment processing
   */
  fetchRelatedOilDeliveryForPayment(oliveLotNumber: string): void {
    this.oilPaymentAvailable = true;
    this.deliveryService.getRelatedOilDelivery(oliveLotNumber, this.supplierId!).subscribe({
      next: (delivery) => {
        this.relatedOilDelivery = delivery;
        this.oilPaymentAvailable = !!delivery;
      },
      error: () => {
        this.relatedOilDelivery = null;
        this.oilPaymentAvailable = false;
        this.toastService.info("Aucune huile de paiement trouvée pour cette livraison d'olives");
        // Optionally reset payment method to 'cash' if oil is not available
        if (this.selectedPaymentMethod !== 'cash') {
          this.selectedPaymentMethod = 'cash';
        }
      }
    });
  }

  handleCreditAction(e: { row: OilCredit; action: string }) {
    const actionLabel = e.action?.toUpperCase();

    switch (actionLabel) {
      case 'READ':
        this.router.navigate(['/finance/expenses', e.row.id, 'view']);
        break;

      case 'PRINT':
        break;

      case 'UPDATE':
        this.router.navigate(['/finance/expenses', e.row.id, 'edit']);
        break;

      case 'DELETE':
        break;
    }
  }

  private processData() {
    if (this.data?.row.deliveryType == 'OLIVE') {
      this.relatedOilReception();
      switch (this.data?.row?.operationType) {
        case 'SIMPLE_RECEPTION': {
          this.paymentForm.get('amount')?.setValue(this.data?.row?.unpaidAmount);
        }
      }
    } else {
    }
  }

  /**
   * Resets the payment form based on the selected payment method
   * @param method The selected payment method
   */
  private resetPaymentFormForMethod(method: 'cash' | 'oil' | 'both'): void {
    if (!this.paymentForm) return;

    if (method === 'cash') {
      this.paymentForm.patchValue({
        amount: this.selectedPayment?.unpaidAmount || 0,
        oilQuantity: 0,
        oilPricePerKg: this.oilPricePerLiter,
        checkNumber: '',
        bankAccountId: ''
      });
      this.calculatePayment();
    } else if (method === 'oil') {
      this.paymentForm.patchValue({
        amount: 0,
        oilQuantity: 0,
        oilPricePerKg: this.oilPricePerLiter,
        checkNumber: '',
        bankAccountId: ''
      });
      this.calculateOilEquivalent();
    } else if (method === 'both') {
      this.paymentForm.patchValue({
        amount: 0,
        oilQuantity: 0,
        oilPricePerKg: this.oilPricePerLiter,
        checkNumber: '',
        bankAccountId: ''
      });
      this.calculateOilEquivalent();
    }
  }

  private convertDeliveriesToPaymentHistory(deliveries: UnifiedDelivery[]): PaymentHistoryItem[] {
    return deliveries.map((delivery) => {
      const paidAmount = delivery.paidAmount || 0;
      const price = delivery.price || 0;
      const oilQuantity = delivery.oilQuantity || 0;
      const lotOliveNumber = delivery.lotOliveNumber || null;
      const unpaidAmount = delivery.unpaidAmount || price - paidAmount;
      const type = (delivery as UnifiedDelivery & { deliveryType?: string }).deliveryType || undefined;
      let status: 'paid' | 'unpaid' | 'partial' = 'unpaid';
      if (type === 'OIL') {
        status = 'paid';
      } else if (paidAmount >= price && price > 0) {
        status = 'paid';
      } else if (paidAmount > 0 && paidAmount < price) {
        status = 'partial';
      } else {
        status = 'unpaid';
      }
      return {
        id: delivery.id,
        lotNumber: delivery.lotNumber,
        deliveryDate: new Date(delivery.deliveryDate),
        deliveryNumber: delivery.deliveryNumber,
        poidsNet: delivery.poidsNet || 0,
        price: price,
        oilQuantity: oilQuantity,
        paidAmount: paidAmount,
        unpaidAmount: unpaidAmount,
        status: status,
        lotOliveNumber: lotOliveNumber,
        reference: `LOT-${delivery.lotNumber}`,
        deliveryType: type
      };
    });
  }

  // Filter payments based on history type
  private filterPaymentsByType(payments: PaymentHistoryItem[]): PaymentHistoryItem[] {
    switch (this.historyType) {
      case 'paid':
        return payments.filter((payment) => payment.status === 'paid');
      case 'unpaid':
        // Exclude OIL receptions from unpaid/partial
        return payments.filter(
          (payment) => (payment.status === 'unpaid' || payment.status === 'partial') && payment.deliveryType !== 'OIL'
        );
      default:
        return payments;
    }
  }

  private calculateSummaryStatistics(): void {
    const data = this.paymentsDataSource.data;
    this.totalDeliveries = data.length;
    this.totalPaid = data.reduce((sum, payment) => sum + payment.paidAmount, 0);
    this.totalUnpaid = data.reduce((sum, payment) => sum + payment.unpaidAmount, 0);
    this.totalOliveWeight = data.reduce((sum, payment) => sum + payment.poidsNet, 0);
  }

  // Get summary statistics for all deliveries (not just filtered ones)
  private getAllDeliveriesSummary(): {
    totalDeliveries: number;
    totalPaid: number;
    totalUnpaid: number;
    totalOliveWeight: number;
  } {
    // This would need to be called with all deliveries data
    // For now, we'll use the current payments array
    return {
      totalDeliveries: this.payments.length,
      totalPaid: this.payments.reduce((sum, payment) => sum + payment.paidAmount, 0),
      totalUnpaid: this.payments.reduce((sum, payment) => sum + payment.unpaidAmount, 0),
      totalOliveWeight: this.payments.reduce((sum, payment) => sum + payment.poidsNet, 0)
    };
  }

  /**
   * Validates payment data based on the selected payment method
   * @returns Validation result with error message if invalid
   */
  private validatePaymentData(): { isValid: boolean; error?: string } {
    if (!this.selectedPayment || !this.paymentForm) {
      return { isValid: false, error: 'Données de paiement manquantes' };
    }

    const unpaidAmount = this.selectedPayment.unpaidAmount;

    if (this.selectedPaymentMethod === 'cash') {
      const amount = this.paymentForm.get('amount')?.value || 0;

      if (amount <= 0) {
        return { isValid: false, error: 'Montant doit être supérieur à 0' };
      }

      if (amount > unpaidAmount) {
        return { isValid: false, error: 'Montant ne peut pas dépasser le montant impayé' };
      }

      // Validate check/bank transfer specific fields
      if (this.moneyPaymentMethod === 'check') {
        const checkNumber = this.paymentForm.get('checkNumber')?.value;
        if (!checkNumber || checkNumber.trim() === '') {
          return { isValid: false, error: 'Numéro de chèque requis' };
        }
      }

      if (this.moneyPaymentMethod === 'bank_transfer') {
        const bankAccountId = this.paymentForm.get('bankAccountId')?.value;
        if (!bankAccountId) {
          return { isValid: false, error: 'Compte bancaire requis' };
        }
      }
    } else if (this.selectedPaymentMethod === 'oil') {
      const oilQuantity = this.paymentForm.get('oilQuantity')?.value || 0;
      const oilPricePerKg = this.paymentForm.get('oilPricePerKg')?.value || 0;

      if (oilQuantity <= 0) {
        return { isValid: false, error: "Quantité d'huile doit être supérieure à 0" };
      }

      if (oilPricePerKg <= 0) {
        return { isValid: false, error: "Prix de l'huile doit être supérieur à 0" };
      }

      const oilValue = oilQuantity * oilPricePerKg;
      if (oilValue > unpaidAmount) {
        return { isValid: false, error: "Valeur de l'huile ne peut pas dépasser le montant impayé" };
      }
    } else if (this.selectedPaymentMethod === 'both') {
      // Validate both cash and oil components
      const cashAmount = this.paymentForm.get('amount')?.value || 0;
      const oilQuantity = this.paymentForm.get('oilQuantity')?.value || 0;
      const oilPricePerKg = this.paymentForm.get('oilPricePerKg')?.value || 0;

      if (cashAmount <= 0 && oilQuantity <= 0) {
        return { isValid: false, error: "Au moins un montant en espèces ou une quantité d'huile doit être fourni" };
      }

      const oilValue = oilQuantity * oilPricePerKg;
      const totalValue = cashAmount + oilValue;

      if (totalValue > unpaidAmount) {
        return { isValid: false, error: 'Valeur totale ne peut pas dépasser le montant impayé' };
      }

      // Validate cash payment method if cash amount > 0
      if (cashAmount > 0) {
        if (this.moneyPaymentMethod === 'check') {
          const checkNumber = this.paymentForm.get('checkNumber')?.value;
          if (!checkNumber || checkNumber.trim() === '') {
            return { isValid: false, error: 'Numéro de chèque requis' };
          }
        }

        if (this.moneyPaymentMethod === 'bank_transfer') {
          const bankAccountId = this.paymentForm.get('bankAccountId')?.value;
          if (!bankAccountId) {
            return { isValid: false, error: 'Compte bancaire requis' };
          }
        }
      }
    }

    return { isValid: true };
  }

  /**
   * Builds the payment data object based on the selected payment method
   * @returns Payment data object
   */
  private buildPaymentData(): Record<string, unknown> {
    if (!this.paymentForm || !this.selectedPayment) {
      throw new Error('Payment form or selected payment is not available');
    }

    const baseData = {
      deliveryId: this.selectedPayment.id,
      paymentMethod: this.selectedPaymentMethod,
      remainingAmount: this.remainingAmount,
      lotNumber: this.selectedPayment.lotNumber,
      supplierId: this.supplierId
    };

    if (this.selectedPaymentMethod === 'cash') {
      return {
        ...baseData,
        amount: this.paymentForm.get('amount')?.value || 0,
        moneyPaymentMethod: this.moneyPaymentMethod,
        checkNumber: this.paymentForm.get('checkNumber')?.value || '',
        bankAccountId: this.paymentForm.get('bankAccountId')?.value || '',
        oilQuantity: 0,
        oilPricePerKg: 0
      };
    } else if (this.selectedPaymentMethod === 'oil') {
      return {
        ...baseData,
        amount: 0,
        oilQuantity: this.paymentForm.get('oilQuantity')?.value || 0,
        oilPricePerKg: this.paymentForm.get('oilPricePerKg')?.value || this.oilPricePerLiter,
        checkNumber: '',
        bankAccountId: ''
      };
    } else {
      // both
      return {
        ...baseData,
        amount: this.paymentForm.get('amount')?.value || 0,
        oilQuantity: this.paymentForm.get('oilQuantity')?.value || 0,
        oilPricePerKg: this.paymentForm.get('oilPricePerKg')?.value || this.oilPricePerLiter,
        moneyPaymentMethod: this.moneyPaymentMethod,
        checkNumber: this.paymentForm.get('checkNumber')?.value || '',
        bankAccountId: this.paymentForm.get('bankAccountId')?.value || ''
      };
    }
  }

  /**
   * Extracts user-friendly error message from error object
   * @param error The error object
   * @returns User-friendly error message
   */
  private getErrorMessageFromError(error: unknown): string {
    const errorObj = error as { error?: { message?: string }; message?: string; status?: number };

    if (errorObj?.error?.message) {
      return errorObj.error.message;
    }
    if (errorObj?.message) {
      return errorObj.message;
    }
    if (errorObj?.status === 404) {
      return 'Comptes bancaires non trouvés';
    }
    if (errorObj?.status === 500) {
      return 'Erreur serveur lors du chargement des comptes bancaires';
    }
    return 'Erreur lors du chargement des comptes bancaires';
  }
}
