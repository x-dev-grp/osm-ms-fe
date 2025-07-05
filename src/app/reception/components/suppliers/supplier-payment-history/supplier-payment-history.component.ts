import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { SupplierTypeService } from '../../../../shared/services/supplier.service';
import { UnifiedDeliveryService } from '../../../../shared/services/delivery.service';
import { UnifiedDelivery } from '../../../../shared/models/UnifiedDelivery';
import { Location } from '@angular/common';
import { BankAccountService } from '../../../../finance/service/bankAccount.service';
import { BankAccount } from '../../../../finance/models/BankAccount';
import { FormGroup } from '@angular/forms';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiResponse } from '../../../../shared/models/api-response';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastService } from '../../../../shared/services/toast.service';

interface PaymentHistoryItem {
  id: string;
  lotNumber: string;
  deliveryDate: Date;
  deliveryNumber: string;
  poidsNet: number;
  price: number;
  paidAmount: number;
  unpaidAmount: number;
  status: 'paid' | 'unpaid' | 'partial';
  reference: string;
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
    MatSnackBarModule,TranslateModule
  ],
  templateUrl: './supplier-payment-history.component.html',
  styleUrls: ['./supplier-payment-history.component.scss']
})
export class SupplierPaymentHistoryComponent implements OnInit {
  supplierId: string = '';
  supplierName: string = '';
  historyType: 'paid' | 'unpaid' | 'all' = 'all';
  loading = true;
  error: string | null = null;
  payments: PaymentHistoryItem[] = [];
  displayedColumns: string[] = ['deliveryNumber', 'lotNumber', 'deliveryDate', 'poidsNet', 'price', 'paidAmount', 'unpaidAmount', 'status', 'actions'];

  // Summary statistics
  totalDeliveries = 0;
  totalPaid = 0;
  totalUnpaid = 0;
  totalOliveWeight = 0;

  // Payment functionality
  selectedPayment: PaymentHistoryItem | null = null;
  paymentForm: FormGroup;
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

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supplierService: SupplierTypeService,
    private deliveryService: UnifiedDeliveryService,
    private snackBar: MatSnackBar,
    private location: Location,
    private bankAccountService: BankAccountService,
    private fb: FormBuilder,
    private translateService: TranslateService,
    private toastService: ToastService
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
    this.historyType = this.route.snapshot.queryParams['type'] || 'all';

    if (!this.supplierId) {
      this.error = this.translateService.instant('SUPPLIER_PAYMENT.ERRORS.SUPPLIER_ID_NOT_FOUND');
      this.loading = false;
      return;
    }

    this.loadPaymentHistory();
    this.loadBankAccounts();
  }

  onBack(): void {
    if (this.supplierId) {
      this.router.navigate(['/reception/fournisseur/details', this.supplierId]);
    } else {
      this.router.navigate(['/reception/fournisseur']);
    }
  }

  loadPaymentHistory(): void {
    this.loading = true;
    this.error = null;

    let deliveryObservable;

    switch (this.historyType) {
      case 'paid':
        deliveryObservable = this.deliveryService.getPaidDeliveriesBySupplier(this.supplierId);
        break;
      case 'unpaid':
        deliveryObservable = this.deliveryService.getUnpaidDeliveriesBySupplier(this.supplierId);
        break;
      default:
        deliveryObservable = this.deliveryService.getDeliveriesBySupplier(this.supplierId);
        break;
    }

    deliveryObservable.subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.payments = this.convertDeliveriesToPaymentHistory(response.data);
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
    return deliveries.map(delivery => {
      const paidAmount = delivery.paidAmount || 0;
      const price = delivery.price || 0;
      const unpaidAmount = delivery.unpaidAmount || (price - paidAmount);

      let status: 'paid' | 'unpaid' | 'partial' = 'unpaid';
      if (paidAmount >= price) {
        status = 'paid';
      } else if (paidAmount > 0) {
        status = 'partial';
      }

      return {
        id: delivery.id,
        lotNumber: delivery.lotNumber,
        deliveryDate: new Date(delivery.deliveryDate),
        deliveryNumber: delivery.deliveryNumber,
        poidsNet: delivery.poidsNet || 0,
        price: price,
        paidAmount: paidAmount,
        unpaidAmount: unpaidAmount,
        status: status,
        reference: `LOT-${delivery.lotNumber}`
      };
    });
  }

  private calculateSummaryStatistics(): void {
    this.totalDeliveries = this.payments.length;
    this.totalPaid = this.payments.reduce((sum, payment) => sum + payment.paidAmount, 0);
    this.totalUnpaid = this.payments.reduce((sum, payment) => sum + payment.unpaidAmount, 0);
    this.totalOliveWeight = this.payments.reduce((sum, payment) => sum + payment.poidsNet, 0);
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
    this.paymentForm.reset();
    this.oilEquivalent = 0;
    this.remainingAmount = 0;
  }

  onPaymentMethodChange(): void {
    if (this.paymentMethod === 'oil') {
      this.calculateOilEquivalent();
      this.paymentForm.patchValue({
        oilQuantity: 0,
        amount: 0,
        oilPricePerKg: this.oilPricePerLiter
      });
    } else if (this.paymentMethod === 'money') {
      this.paymentForm.patchValue({
        amount: this.selectedPayment?.unpaidAmount || 0,
        oilQuantity: 0
      });
      this.calculatePayment();
    }
  }

  onMoneyPaymentMethodChange(): void {
    // Reset form controls based on payment method
    if (this.moneyPaymentMethod === 'cash') {
      this.paymentForm.patchValue({
        checkNumber: '',
        bankAccountId: ''
      });
    } else if (this.moneyPaymentMethod === 'check') {
      this.paymentForm.patchValue({
        bankAccountId: ''
      });
      this.paymentForm.get('checkNumber')?.setValidators([Validators.required]);
    } else if (this.moneyPaymentMethod === 'bank_transfer') {
      this.paymentForm.patchValue({
        checkNumber: ''
      });
      this.paymentForm.get('bankAccountId')?.setValidators([Validators.required]);
    }

    this.paymentForm.get('checkNumber')?.updateValueAndValidity();
    this.paymentForm.get('bankAccountId')?.updateValueAndValidity();
  }

  onOilPriceChange(): void {
    // Recalculate oil equivalent when price changes
    this.calculateOilEquivalent();
    // Recalculate payment if oil quantity is already set
    if (this.paymentForm.get('oilQuantity')?.value > 0) {
      this.calculateOilPayment();
    }
  }

  calculateOilEquivalent(): void {
    if (this.selectedPayment) {
      const currentOilPrice = this.paymentForm.get('oilPricePerKg')?.value || this.oilPricePerLiter;
      this.oilEquivalent = this.selectedPayment.unpaidAmount / currentOilPrice;
    }
  }

  calculatePayment(): void {
    if (this.selectedPayment) {
      const paymentAmount = this.paymentForm.get('amount')?.value || 0;
      this.remainingAmount = Math.max(0, this.selectedPayment.unpaidAmount - paymentAmount);
    }
  }

  calculateOilPayment(): void {
    if (this.selectedPayment) {
      const oilQuantity = this.paymentForm.get('oilQuantity')?.value || 0;
      const oilPricePerKg = this.paymentForm.get('oilPricePerKg')?.value || this.oilPricePerLiter;
      const oilValue = oilQuantity * oilPricePerKg;
      this.remainingAmount = Math.max(0, this.selectedPayment.unpaidAmount - oilValue);
    }
  }

  isPaymentFormValid(): boolean {
    if (!this.paymentMethod || !this.selectedPayment) {
      return false;
    }

    if (this.paymentMethod === 'money') {
      const amount = this.paymentForm.get('amount')?.value || 0;
      if (amount <= 0 || amount > this.selectedPayment.unpaidAmount) {
        return false;
      }

      // Check specific payment method requirements
      if (this.moneyPaymentMethod === 'check') {
        const checkNumber = this.paymentForm.get('checkNumber')?.value;
        return !!checkNumber && checkNumber.trim() !== '';
      } else if (this.moneyPaymentMethod === 'bank_transfer') {
        const bankAccountId = this.paymentForm.get('bankAccountId')?.value;
        return !!bankAccountId;
      }

      return true; // Cash payment only needs amount
    } else if (this.paymentMethod === 'oil') {
      const oilQuantity = this.paymentForm.get('oilQuantity')?.value || 0;
      const oilPricePerKg = this.paymentForm.get('oilPricePerKg')?.value || 0;
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
      amount: this.paymentForm.get('amount')?.value || 0,
      oilQuantity: this.paymentForm.get('oilQuantity')?.value || 0,
      oilPricePerKg: this.paymentForm.get('oilPricePerKg')?.value || this.oilPricePerLiter,
      checkNumber: this.paymentForm.get('checkNumber')?.value || '',
      bankAccountId: this.paymentForm.get('bankAccountId')?.value || '',
      remainingAmount: this.remainingAmount
    };

    console.log('Processing payment:', paymentData);

    // TODO: Call payment service to process the payment
    this.toastService.success(
      this.translateService.instant('SUPPLIER_PAYMENT.PAYMENT_SUCCESS')
    );

    this.closePaymentForm();
    this.loadPaymentHistory(); // Refresh the data
  }

  viewPaymentDetails(payment: PaymentHistoryItem): void {
    this.toastService.info(
      this.translateService.instant('SUPPLIER_PAYMENT.LOT_DETAILS', { lotNumber: payment.lotNumber })
    );
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
}
