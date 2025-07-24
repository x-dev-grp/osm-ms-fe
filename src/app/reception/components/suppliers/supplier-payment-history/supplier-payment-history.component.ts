import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
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
import { BankAccountService } from '../../../../finance/service/bankAccount.service';
import { BankAccount } from '../../../../finance/models/BankAccount';
import { ApiResponse } from '../../../../shared/models/api-response';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastService } from '../../../../shared/services/toast.service';
import { MatDialog } from '@angular/material/dialog';
import { MatCheckbox, MatCheckboxChange } from '@angular/material/checkbox';
import { OilCredit } from '../../../../finance/models/OilCredit';
import { OilCreditService } from '../../../../finance/service/oil-credit.service';
import { QualityControlResultService } from '../../../../shared/services/quality-control-result.service';
import { QualityControlResultDto } from '../../../../shared/models/QualityControlResultDto';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { FinancialTransaction, PaymentMethod, TransactionStatus } from '../../../../finance/models/financial-transaction';
import { OsmDashboard } from '../../../../shared/modules/osm-dashboard/osm-dashboard';
import { OIL_CREDIT_DASHBOARD } from './oil-credit-dashboard.config';
import { AttributeType, DashboardConfig, FieldType } from '../../../../shared/modules/osm-dashboard/models/dashboard-config';
import { SearchOperation } from '../../../../shared/models/advanced-search/searchOperation';
import { deliveryType } from '../../../../shared/models/deleveryType';
import { PAIMENT_DASHBOARD } from './paiment-dashboard.config';

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
  styleUrls: ['./supplier-payment-history.component.scss'],
  animations: [
    trigger('slideInOut', [
      state(
        'void',
        style({
          transform: 'translateX(100%)',
          opacity: 0
        })
      ),
      state(
        '*',
        style({
          transform: 'translateX(0)',
          opacity: 1
        })
      ),
      transition(':enter', [animate('350ms cubic-bezier(0.4,0,0.2,1)')]),
      transition(':leave', [
        animate(
          '250ms cubic-bezier(0.4,0,0.2,1)',
          style({
            transform: 'translateX(100%)',
            opacity: 0
          })
        )
      ])
    ])
  ]
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
  selectedPayment: PaymentHistoryItem | null = null;
  paymentForm: FormGroup | null = null;
  oilPricePerLiter = 25; // Default oil price per liter in TND
  oilEquivalent = 0;
  remainingAmount = 0;
  showPaymentForm = false;
  selectedDelivery: PaymentHistoryItem | null = null;
  bankAccounts: BankAccount[] = [];
  loadingBankAccounts = false;
  selectedPaymentMethod: 'cash' | 'oil' | 'both' = 'cash';
  moneyPaymentMethod: 'cash' | 'check' | 'bank_transfer' = 'cash';

  @ViewChild('paymentPaginator') paymentPaginator!: MatPaginator;
  @ViewChild('paymentSort') paymentSort!: MatSort;
  @ViewChild('oilCreditPaginator') oilCreditPaginator!: MatPaginator;
  @ViewChild('oilCreditSort') oilCreditSort!: MatSort;
  paymentsDataSource = new MatTableDataSource<PaymentHistoryItem>([]);

  OIL_CREDIT_DASHBOARD: DashboardConfig = OIL_CREDIT_DASHBOARD;
  PAIMENT_DASHBOARD: DashboardConfig = PAIMENT_DASHBOARD;

  // Remove old paymentMethodMoney/paymentMethodOil logic from UI control (keep for form logic if needed)
  oilQcResults: QualityControlResultDto[] = [];
  // Add property to store related oil delivery
  relatedOilDelivery: UnifiedDelivery | null = null;
  oilPaymentAvailable = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private deliveryService: UnifiedDeliveryService,
    private bankAccountService: BankAccountService,
    private fb: FormBuilder,
    private translateService: TranslateService,
    private toastService: ToastService,

  ) {
    this.paymentForm = this.fb.group({
      amount: [0, [Validators.required, Validators.min(0.01)]],
      checkNumber: [''],
      bankAccountId: [''],
      oilQuantity: [0, [Validators.required, Validators.min(0.01)]],
      oilPricePerKg: [this.oilPricePerLiter, [Validators.required, Validators.min(0.01)]],
      moneyPaymentMethod: ['cash']
    });
  }

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
    this.supplierId = <string>this.route.snapshot.paramMap.get('id');
    const typeParam = this.route.snapshot.queryParamMap.get('type');
    if (typeParam === 'paid' || typeParam === 'unpaid' || typeParam === 'oil_credit') {
      this.historyType = typeParam;
    } else {
      this.historyType = 'oil_credit';
    }

    if (!this.supplierId) {
      this.error = this.translateService.instant('SUPPLIER_PAYMENT.ERRORS.SUPPLIER_ID_NOT_FOUND');
      this.loading = false;
      return;
    }

    if (this.historyType === 'oil_credit') {
      this.loadOilCredits();
    } else  {
      this.loadPaymentHistory(typeParam!);
    }
    this.loadBankAccounts();
  }

  setHistoryType(type: 'oil_credit' | 'paid' | 'unpaid'): void {
    this.historyType = type;
    if (type === 'oil_credit') {
      this.loadOilCredits();
    } else {
      this.loadPaymentHistory(type!);
    }
  }

  loadOilCredits( ): void {
    this.OIL_CREDIT_DASHBOARD = {
      ...this.OIL_CREDIT_DASHBOARD,
      defaultSearchData: {
        ...this.OIL_CREDIT_DASHBOARD.defaultSearchData,
        searchData: {
          ...this.OIL_CREDIT_DASHBOARD.defaultSearchData?.searchData,
          search: {
            ...this.OIL_CREDIT_DASHBOARD.defaultSearchData?.searchData?.search,
            destinataire: {
              equalValue: this.supplierId
            }
          }
        }
      }
    };
  }

  loadPaymentHistory(isPaid:string): void {
    this.PAIMENT_DASHBOARD = {
      ...this.PAIMENT_DASHBOARD,
      defaultSearchData: {
        ...this.PAIMENT_DASHBOARD.defaultSearchData,
        searchData: {
          ...this.PAIMENT_DASHBOARD.defaultSearchData?.searchData,
          search: {
            ...this.PAIMENT_DASHBOARD.defaultSearchData?.searchData?.search,
            'supplier.id': {
              equalValue: this.supplierId!
            },
            'paid':{
              equalValue: isPaid=='paid'? true : false
            }
          }
        }
      }
    };
  }
  initiatePayment(payment: any): void {
    this.selectedPayment = payment;
    this.showPaymentForm = true;
    this.resetPaymentForm();
    this.calculateOilEquivalent();

    console.log(`[SupplierPayment] Initiating payment for delivery:`, {
      lotNumber: payment.lotNumber,
      deliveryType: payment.deliveryType,
      lotOliveNumber: payment.lotOliveNumber,
      unpaidAmount: payment.unpaidAmount
    });

    // If this is an olive delivery, fetch related oil delivery for payment
    if (payment.deliveryType === 'OLIVE' && payment.lotNumber) {
      console.log(`[SupplierPayment] Olive delivery detected, fetching related oil delivery`);
      this.fetchRelatedOilDeliveryForPayment(payment.lotNumber);
    }

    if (this.selectedPaymentMethod === 'oil' || this.selectedPaymentMethod === 'both') {
      this.getDeliveryByOliveLotNumber(payment.id);
    } else {
      this.oilQcResults = [];
    }}
  closePaymentForm(): void {
    this.selectedPayment = null;
    this.resetPaymentForm();
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

  /**
   * Loads bank accounts with comprehensive error handling and validation.
   * This method fetches bank accounts for payment processing.
   */
  loadBankAccounts(): void {
    console.log('[SupplierPayment] Loading bank accounts');

    this.loadingBankAccounts = true;
    this.error = null;

    this.bankAccountService.getAllBanksList().subscribe({
      next: (response: ApiResponse<BankAccount>) => {
        console.log('[SupplierPayment] Bank accounts response:', response);

        if (response.success && response.data) {
          this.bankAccounts = Array.isArray(response.data) ? response.data : [response.data];
          console.log(`[SupplierPayment] Loaded ${this.bankAccounts.length} bank accounts`);
        } else {
          this.bankAccounts = [];
          this.error = response.message || 'Aucun compte bancaire trouvé';
          console.warn('[SupplierPayment] No bank accounts found:', response.message);
        }
        this.loadingBankAccounts = false;
      },
      error: (error: unknown) => {
        console.error('[SupplierPayment] Error loading bank accounts:', error);
        this.error = this.getErrorMessageFromError(error);
        this.bankAccounts = [];
        this.loadingBankAccounts = false;
      }
    });
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
  handlePaymentAction(e: { row: UnifiedDelivery; action: string }) {
       const actionLabel = e.action ;

      switch (actionLabel) {
      case 'READ':
        this.router.navigate(['/finance/expenses', e.row.id, 'view']);
        break;

      case 'PRINT':
         break;

      case 'UPDATE':
        this.router.navigate(['/finance/expenses', e.row.id, 'edit']);
        break;

      case 'PAY':
        this.initiatePayment(e.row)
         break;
      }


  }
}
