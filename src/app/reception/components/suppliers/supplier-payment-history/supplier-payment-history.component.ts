import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
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
import { BankAccountService } from '../../../../finance/service/bankAccount.service';
import { BankAccount } from '../../../../finance/models/BankAccount';
import { ApiResponse } from '../../../../shared/models/api-response';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastService } from '../../../../shared/services/toast.service';
import { ControleQualiteComponent } from '../../controleQualite/controleQualite.component';
import { MatDialog } from '@angular/material/dialog';
import { MatCheckbox, MatCheckboxChange } from '@angular/material/checkbox';
import { OilCredit } from '../../../../finance/models/OilCredit';
import { OilCreditService } from '../../../../finance/service/oil-credit.service';

interface PaymentHistoryItem {
  id: string;
  lotNumber: string;
  deliveryDate: Date;
  deliveryNumber: string;
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
    MatCheckbox
  ],
  templateUrl: './supplier-payment-history.component.html',
  styleUrls: ['./supplier-payment-history.component.scss']
})
export class SupplierPaymentHistoryComponent implements OnInit {
  supplierId: string = '';
  supplierName: string = '';
  historyType: 'oil_credit' | 'paid' | 'unpaid' | 'all' = 'oil_credit';
  loading = true;
  error: string | null = null;
  payments: PaymentHistoryItem[] = [];
  displayedColumns: string[] = [
    'deliveryNumber',
    'deliveryType',
    'lotNumber',
    'deliveryDate',
    'poidsNet',
    'price',
    'paidAmount',
    'unpaidAmount',
    'status',
    'actions'
  ];
  displayedColumnsWithSelect: string[] = ['select', ...this.displayedColumns];

  // Selection logic for batch operations
  selectedPayments: PaymentHistoryItem[] = [];

  isSelected(payment: PaymentHistoryItem): boolean {
    return this.selectedPayments.includes(payment);
  }

  toggleSelection(payment: PaymentHistoryItem): void {
    if (this.isSelected(payment)) {
      this.selectedPayments = this.selectedPayments.filter((p) => p !== payment);
    } else {
      this.selectedPayments.push(payment);
    }
  }

  toggleSelectAll(event: MatCheckboxChange): void {
    if (event.checked) {
      this.selectedPayments = [...this.payments];
    } else {
      this.selectedPayments = [];
    }
  }

  isAllSelected(): boolean {
    return this.selectedPayments.length === this.payments.length && this.payments.length > 0;
  }

  isSomeSelected(): boolean {
    return this.selectedPayments.length > 0 && this.selectedPayments.length < this.payments.length;
  }

  batchPaymentMode = false;
  batchPaymentForm: FormGroup;

  openBatchPayment(): void {
    this.batchPaymentMode = true;
    const totalUnpaid = this.selectedPayments.reduce((sum, p) => sum + p.unpaidAmount, 0);
    this.batchPaymentForm = this.fb.group({
      amount: [totalUnpaid, [Validators.required, Validators.min(0.01)]],
      // Add more fields as needed (e.g., payment method)
    });
  }

  closeBatchPaymentForm(): void {
    this.batchPaymentMode = false;
  }

  processBatchPayment(): void {
    if (this.batchPaymentForm.valid) {
      // TODO: Send batchPaymentForm.value and selectedPayments to backend/service
      // After success:
      this.batchPaymentMode = false;
      this.selectedPayments = [];
      // Optionally reload data
    }
  }

  get batchLots(): string {
    return this.selectedPayments.map(p => p.lotNumber).join(', ');
  }

  get batchOilLots() {
    return this.selectedPayments.map(p => ({
      lotNumber: p.lotNumber,
      oilQuantity: p.oilQuantity || 0
    }));
  }

  selectedBatchOilLots: string[] = [];

  // Summary statistics
  totalDeliveries = 0;
  totalPaid = 0;
  totalUnpaid = 0;
  totalOliveWeight = 0;

  // Payment functionality
  selectedPayment: PaymentHistoryItem | null = null;
  paymentForm: FormGroup |null=null;
  oilPricePerLiter = 25; // Default oil price per liter in TND
  oilEquivalent = 0;
  remainingAmount = 0;
  showPaymentForm = false;
  selectedDelivery: PaymentHistoryItem | null = null;
  bankAccounts: BankAccount[] = [];
  loadingBankAccounts = false;

  // Payment form
  paymentMethod: 'money' | 'oil' = 'money';
  moneyPaymentMethod: 'cash' | 'check' | 'bank_transfer' = 'cash';

  // Mock properties for batch payment UI demo
  mockBatchPaymentMethod: 'money' | 'oil' = 'money';
  mockBatchMoneyMethod: 'cash' | 'check' | 'bank_transfer' = 'cash';

  onBatchPaymentMethodChange(event: any) {
    console.log('Batch payment method changed:', event.value);
    console.log('mockBatchPaymentMethod:', this.mockBatchPaymentMethod);
  }

  onBatchMoneyMethodChange(event: any) {
    console.log('Batch money method changed:', event.value);
    console.log('mockBatchMoneyMethod:', this.mockBatchMoneyMethod);
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  oilCredits: OilCredit[] = [];
  oilCreditColumns: string[] = ['id', 'emballage', 'quantity', 'unit', 'oil_type', 'creditState', 'createdDate'];

  // Oil credit statistics
  totalOilCredits = 0;
  totalOilCreditQuantityL = 0;
  totalOilCreditQuantityKG = 0;
  oilCreditStateCounts: { [key: string]: number } = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private deliveryService: UnifiedDeliveryService,
    private bankAccountService: BankAccountService,
    private fb: FormBuilder,
    private translateService: TranslateService,
    private toastService: ToastService,
    private dialog: MatDialog,
    private oilCreditService: OilCreditService
  ) {
    this.paymentForm = this.fb.group({
      amount: [0, [Validators.required, Validators.min(0.01)]],
      checkNumber: [''],
      bankAccountId: [''],
      oilQuantity: [0, [Validators.required, Validators.min(0.01)]],
      oilPricePerKg: [this.oilPricePerLiter, [Validators.required, Validators.min(0.01)]]
    });
  }

  ngOnInit(): void {
    this.supplierId = this.route.snapshot.paramMap.get('id') || '';
    this.supplierName = this.route.snapshot.paramMap.get('name') || '';
    this.historyType = 'oil_credit';

    if (!this.supplierId) {
      this.error = this.translateService.instant('SUPPLIER_PAYMENT.ERRORS.SUPPLIER_ID_NOT_FOUND');
      this.loading = false;
      return;
    }

    this.loadOilCredits();
    this.loadBankAccounts();
  }

  onBack(): void {
    if (this.supplierId) {
      this.router.navigate(['/reception/fournisseur/details', this.supplierId]);
    } else {
      this.router.navigate(['/reception/fournisseur']);
    }
  }

  setHistoryType(type: 'oil_credit' | 'paid' | 'unpaid' | 'all'): void {
    this.historyType = type;
    if (type === 'oil_credit') {
      this.loadOilCredits();
    } else {
      this.loadPaymentHistory();
    }
  }

  loadOilCredits(): void {
    this.loading = true;
    this.error = null;
    this.oilCredits = [];
    this.oilCreditService.getAllOilCreditList().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.oilCredits = response.data.filter((credit: OilCredit) => credit.destinataire && credit.destinataire.id === this.supplierId);
          this.calculateOilCreditStatistics();
        } else {
          this.oilCredits = [];
          this.error = response.message || this.translateService.instant('SUPPLIER_PAYMENT.ERRORS.NO_DATA_FOUND');
          this.calculateOilCreditStatistics();
        }
        this.loading = false;
      },
      error: (error: unknown) => {
        console.error('Error loading oil credits:', error);
        this.error = this.translateService.instant('SUPPLIER_PAYMENT.ERRORS.LOAD_ERROR');
        this.oilCredits = [];
        this.calculateOilCreditStatistics();
        this.loading = false;
      }
    });
  }

  calculateOilCreditStatistics(): void {
    this.totalOilCredits = this.oilCredits.length;
    this.totalOilCreditQuantityL = this.oilCredits
      .filter(c => c.unit === 'L')
      .reduce((sum, c) => sum + (c.quantity || 0), 0);
    this.totalOilCreditQuantityKG = this.oilCredits
      .filter(c => c.unit === 'KG')
      .reduce((sum, c) => sum + (c.quantity || 0), 0);
    this.oilCreditStateCounts = {};
    for (const c of this.oilCredits) {
      const state = c.creditState || 'UNKNOWN';
      this.oilCreditStateCounts[state] = (this.oilCreditStateCounts[state] || 0) + 1;
    }
  }

  getHistoryTypeTitle(): string {
    switch (this.historyType) {
      case 'paid':
        return 'SUPPLIER_PAYMENT.PAID_DELIVERIES';
      case 'unpaid':
        return 'SUPPLIER_PAYMENT.UNPAID_DELIVERIES';
      default:
        return 'SUPPLIER_PAYMENT.ALL_DELIVERIES';
    }
  }

  loadPaymentHistory(): void {
    this.loading = true;
    this.error = null;

    // Always load all deliveries and filter client-side for better control
    this.deliveryService.getDeliveriesBySupplier(this.supplierId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const allPayments = this.convertDeliveriesToPaymentHistory(response.data);
          this.payments = this.filterPaymentsByType(allPayments);
          this.calculateSummaryStatistics();
        } else {
          this.payments = [];
          this.error = response.message || this.translateService.instant('SUPPLIER_PAYMENT.ERRORS.NO_DATA_FOUND');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading payment history:', error);
        this.error = this.translateService.instant('SUPPLIER_PAYMENT.ERRORS.LOAD_ERROR');
        this.loading = false;
      }
    });
  }

  private convertDeliveriesToPaymentHistory(deliveries: UnifiedDelivery[]): PaymentHistoryItem[] {
    return deliveries.map((delivery) => {
      const paidAmount = delivery.paidAmount || 0;
      const price = delivery.price || 0;
      const oilQuantity = delivery.oilQuantity || 0;
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
    this.totalDeliveries = this.payments.length;
    this.totalPaid = this.payments.reduce((sum, payment) => sum + payment.paidAmount, 0);
    this.totalUnpaid = this.payments.reduce((sum, payment) => sum + payment.unpaidAmount, 0);
    this.totalOliveWeight = this.payments.reduce((sum, payment) => sum + payment.poidsNet, 0);
  }

  // Get summary statistics for all deliveries (not just filtered ones)
  private getAllDeliveriesSummary(): { totalDeliveries: number; totalPaid: number; totalUnpaid: number; totalOliveWeight: number } {
    // This would need to be called with all deliveries data
    // For now, we'll use the current payments array
    return {
      totalDeliveries: this.payments.length,
      totalPaid: this.payments.reduce((sum, payment) => sum + payment.paidAmount, 0),
      totalUnpaid: this.payments.reduce((sum, payment) => sum + payment.unpaidAmount, 0),
      totalOliveWeight: this.payments.reduce((sum, payment) => sum + payment.poidsNet, 0)
    };
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'paid':
        return 'success';
      case 'partial':
        return 'warning';
      case 'unpaid':
        return 'error';
      default:
        return 'default';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'paid':
        return this.translateService.instant('SUPPLIER_PAYMENT.STATUS_PAID');
      case 'partial':
        return this.translateService.instant('SUPPLIER_PAYMENT.STATUS_PARTIAL');
      case 'unpaid':
        return this.translateService.instant('SUPPLIER_PAYMENT.STATUS_UNPAID');
      default:
        return this.translateService.instant('SUPPLIER_PAYMENT.STATUS_UNKNOWN');
    }
  }

  // Payment functionality methods
  initiatePayment(payment: PaymentHistoryItem): void {
    this.selectedPayment = payment;
    this.resetPaymentForm();
    this.calculateOilEquivalent();
  }

  closePaymentForm(): void {
    this.selectedPayment = null;
    this.resetPaymentForm();
  }

  resetPaymentForm(): void {
    this.paymentForm!.reset();
    this.oilEquivalent = 0;
    this.remainingAmount = 0;
  }

  onPaymentMethodChange(): void {
    if (this.paymentMethod === 'oil') {
      this.calculateOilEquivalent();
      this.paymentForm!.patchValue({
        oilQuantity: 0,
        amount: 0,
        oilPricePerKg: this.oilPricePerLiter
      });
    } else if (this.paymentMethod === 'money') {
      this.paymentForm!.patchValue({
        amount: this.selectedPayment?.unpaidAmount || 0,
        oilQuantity: 0
      });
      this.calculatePayment();
    }
  }

  onMoneyPaymentMethodChange(): void {
    // Reset form controls based on payment method
    if (this.moneyPaymentMethod === 'cash') {
      this.paymentForm!.patchValue({
        checkNumber: '',
        bankAccountId: ''
      });
    } else if (this.moneyPaymentMethod === 'check') {
      this.paymentForm!.patchValue({
        bankAccountId: ''
      });
      this.paymentForm!.get('checkNumber')?.setValidators([Validators.required]);
    } else if (this.moneyPaymentMethod === 'bank_transfer') {
      this.paymentForm!.patchValue({
        checkNumber: ''
      });
      this.paymentForm!.get('bankAccountId')?.setValidators([Validators.required]);
    }

    this.paymentForm!.get('checkNumber')?.updateValueAndValidity();
    this.paymentForm!.get('bankAccountId')?.updateValueAndValidity();
  }

  onOilPriceChange(): void {
    // Recalculate oil equivalent when price changes
    this.calculateOilEquivalent();
    // Recalculate payment if oil quantity is already set
    if (this.paymentForm!.get('oilQuantity')?.value > 0) {
      this.calculateOilPayment();
    }
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
    }
  }

  calculateOilPayment(): void {
    if (this.selectedPayment) {
      const oilQuantity = this.paymentForm!.get('oilQuantity')?.value || 0;
      const oilPricePerKg = this.paymentForm!.get('oilPricePerKg')?.value || this.oilPricePerLiter;
      const oilValue = oilQuantity * oilPricePerKg;
      this.remainingAmount = Math.max(0, this.selectedPayment.unpaidAmount - oilValue);
    }
  }

  isPaymentFormValid(): boolean {
    if (!this.paymentMethod || !this.selectedPayment) {
      return false;
    }

    if (this.paymentMethod === 'money') {
      const amount = this.paymentForm!.get('amount')?.value || 0;
      if (amount <= 0 || amount > this.selectedPayment.unpaidAmount) {
        return false;
      }

      // Check specific payment method requirements
      if (this.moneyPaymentMethod === 'check') {
        const checkNumber = this.paymentForm!.get('checkNumber')?.value;
        return !!checkNumber && checkNumber.trim() !== '';
      } else if (this.moneyPaymentMethod === 'bank_transfer') {
        const bankAccountId = this.paymentForm!.get('bankAccountId')?.value;
        return !!bankAccountId;
      }

      return true; // Cash payment only needs amount
    } else if (this.paymentMethod === 'oil') {
      const oilQuantity = this.paymentForm!.get('oilQuantity')?.value || 0;
      const oilPricePerKg = this.paymentForm!.get('oilPricePerKg')?.value || 0;
      return oilQuantity > 0 && oilQuantity <= this.oilEquivalent && oilPricePerKg > 0;
    }

    return false;
  }

  processPayment(): void {
    if (!this.isPaymentFormValid() || !this.selectedPayment) {
      return;
    }

    const paymentData = {
      deliveryId: this.selectedPayment.id,
      paymentMethod: this.paymentMethod,
      moneyPaymentMethod: this.moneyPaymentMethod,
      amount: this.paymentForm!.get('amount')?.value || 0,
      oilQuantity: this.paymentForm!.get('oilQuantity')?.value || 0,
      oilPricePerKg: this.paymentForm!.get('oilPricePerKg')?.value || this.oilPricePerLiter,
      checkNumber: this.paymentForm!.get('checkNumber')?.value || '',
      bankAccountId: this.paymentForm!.get('bankAccountId')?.value || '',
      remainingAmount: this.remainingAmount
    };

    console.log('Processing payment:', paymentData);

    // TODO: Call payment service to process the payment
    this.toastService.success(this.translateService.instant('SUPPLIER_PAYMENT.PAYMENT_SUCCESS'));

    this.closePaymentForm();
    this.loadPaymentHistory(); // Refresh the data
  }

  viewPaymentDetails(payment: PaymentHistoryItem): void {
    this.toastService.info(this.translateService.instant('SUPPLIER_PAYMENT.LOT_DETAILS', { lotNumber: payment.lotNumber }));
  }

  loadBankAccounts(): void {
    this.loadingBankAccounts = true;
    this.bankAccountService.getAllBanksList().subscribe({
      next: (response: ApiResponse<BankAccount>) => {
        if (response.success && response.data) {
          this.bankAccounts = Array.isArray(response.data) ? response.data : [response.data];
        } else {
          this.bankAccounts = [];
          this.error = response.message || 'Aucun compte bancaire trouvé';
        }
        this.loadingBankAccounts = false;
      },
      error: (error: unknown) => {
        console.error('Error loading bank accounts:', error);
        this.error = 'Erreur lors du chargement des comptes bancaires';
        this.loadingBankAccounts = false;
      }
    });
  }

  openQualityControlDialog(deliveryId: string | null): void {
    if (!deliveryId) return;
    this.dialog.open(ControleQualiteComponent, {
      width: '900px',
      data: { deliveryId },
      autoFocus: false,
      disableClose: false
    });
  }

  getSelectedDeliveryType(): string | null {
    if (!this.selectedPayment) return null;
    // If the PaymentHistoryItem does not have deliveryType, you may need to store it in the mapping
    // For now, try to get it from the selectedPayment if available
    return (this.selectedPayment as unknown as { deliveryType?: string }).deliveryType || null;
  }
}
