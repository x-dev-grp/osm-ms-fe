import { AfterViewInit, Component, DestroyRef, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
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
import { TranslateModule } from '@ngx-translate/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCheckbox } from '@angular/material/checkbox';
import { OsmDashboard } from '../../../../shared/modules/osm-dashboard/osm-dashboard';
import { AdvancedSearchService } from '../../../../shared/services/advanced-serach.service';
import { SearchData } from '../../../../shared/models/advanced-search/searchData';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, EMPTY, of, tap } from 'rxjs';
import { SearchOperation } from 'src/app/shared/models/advanced-search/searchOperation';
import { catchError } from 'rxjs/operators';
import { Currency, PaymentMethod } from '../../../../finance/models/financial-transaction.model';
import { OilSale } from '../../../models/oil-sale.model';
import { FinancialTransactionService } from '../../../service/financial-transaction.service';
import { OilSaleService } from '../../../service/oil-sale.service';
import { TransactionState } from '../../../../shared/models/OilTransaction';
import { SupplierType } from '../../../../shared/models/supplier-type';

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
  templateUrl: './customer-payment.component.html',
  styleUrls: ['./customer-payment.component.scss']
})
export class CustomerPaymentComponent implements OnInit, AfterViewInit {
  paymentForm: FormGroup;
  remainingAmount = 0;
  bankAccounts: BankAccount[] = [];
  readonly destroyRef = inject(DestroyRef);
  relatedOilDelivery: UnifiedDelivery | null = null;
  relatedOilTransaction: any;
  transactionNotCompletedError: boolean = false;
  totalAmount: number = 0;
  protected oilSaleTransaction: OilSale | null = null;
  private unpaidAmount: number;

  constructor(
    private deliveryService: UnifiedDeliveryService,
    private fb: FormBuilder,
    private oilSaleService: OilSaleService,
    private _searchService: AdvancedSearchService,
    private financialService: FinancialTransactionService,
    @Inject(MAT_DIALOG_DATA) public data: { row: OilSale },
    private _dialogRef: MatDialogRef<CustomerPaymentComponent>
  ) {}

  ngAfterViewInit() {
    this.paymentForm
      .get('moneyPaymentMethod')!
      .valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(100),
        tap((method: PaymentMethod) => {
          const chk = this.paymentForm.get('checkNumber')!;
          const acct = this.paymentForm.get('bankAccount')!;

          if (method === PaymentMethod.CHEQUE) {
            chk.setValidators([Validators.required]);
            acct.clearValidators();
          } else if (method === PaymentMethod.TRANSFER) {
            acct.setValidators([Validators.required]);
            chk.clearValidators();
          } else {
            chk.clearValidators();
            acct.clearValidators();
          }
          chk.updateValueAndValidity();
          acct.updateValueAndValidity();
        })
      )
      .subscribe();

    // recalc remaining amount
    this.paymentForm
      .get('amount')!
      .valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(200),
        tap((amt: number) => {
          this.remainingAmount = this.data.row.unpaiedAmount - Number(amt || 0);
        })
      )
      .subscribe();
  }

  ngOnInit(): void {
    this.oilSaleTransaction = this.data?.row;
    this.totalAmount = this.data?.row?.totalAmount;
    this.paymentForm = this.fb.group({
      paymentMethod: ['cash', Validators.required],
      moneyPaymentMethod: ['cash', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01), Validators.max(this.data.row.unpaiedAmount)]],
      checkNumber: [''],
      bankAccount: [null]
    });
    this.loadBankAccounts();
    console.log(this.data.row);
    this.paymentForm.patchValue({ amount: Number(this?.data.row.unpaiedAmount) });
    this.fetchRelatedOiltransaction();
  }
  async fetchRelatedOiltransaction() {
    const searchData: SearchData = {
      page: 0,
      searchData: {
        operation: SearchOperation.AND,
        search: {
          isDeleted: {
            equalValue: false
          },
          oilSaleId: {
            equalValue: this.oilSaleTransaction?.id
          }
        }
      }
    };
    return this._searchService
      .search(searchData, 'production/oil_transaction')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((res: any) => {
          if (res?.data && res?.data?.length) {
            const oilTransaction = res?.data[0];
            if (oilTransaction?.transactionState != TransactionState.COMPLETED) {
              this.transactionNotCompletedError = true;
              this.paymentForm.disable();
              return;
            }
          }
        }),
        catchError((err, cauth) => {
          this._dialogRef.close();
          return of(EMPTY);
        })
      )
      .subscribe();
  }

  loadBankAccounts(): void {
    const searchData: SearchData = {
      page: 0,
      searchData: { operation: SearchOperation.AND, search: { isDeleted: { equalValue: false } } }
    };
    this._searchService
      .search(searchData, 'finance/banks')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((res) => {
          this.bankAccounts = res?.data;
        })
      )
      .subscribe();
  }

  closePaymentForm() {
    this._dialogRef.close();
  }
  processPayment() {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }
    this.transactionNotCompletedError = false;

    const rawMethod: string = this.paymentForm.get('moneyPaymentMethod')?.value;
    let mappedMethod: PaymentMethod;
    switch (rawMethod) {
      case 'check':
        mappedMethod = PaymentMethod.CHEQUE;
        break;
      case 'bank_transfer':
        mappedMethod = PaymentMethod.TRANSFER;
        break;
      case 'cash':
      default:
        mappedMethod = PaymentMethod.CASH;
    }

    const { amount, checkNumber } = this.paymentForm.value;
    const bankAccount = this.paymentForm.get('bankAccount')?.value || null; // FULL OBJECT

    // Important: keep these as full DTOs
    const customerDto = this.data?.row?.customer ?? null; // FULL CustomerDto
    const supplierDto = null as any as SupplierType | null; // or your selected supplier dto

    const payload = {
      idOperation: this.data.row.id, // UUID
      amount: Number(amount), // Double on backend
      currency: Currency.TND, // enum
      paymentMethod: mappedMethod, // enum
      checkNumber: mappedMethod === PaymentMethod.CHEQUE ? checkNumber || null : null,
      bankAccount, // FULL BankAccountDto
      customer: customerDto, // FULL CustomerDto
      supplier: supplierDto // FULL SupplierDto or null
    };

    this.oilSaleService
      .processPayment(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => this._dialogRef.close(true)),
        catchError((err) => {
          this.transactionNotCompletedError = true;
          console.error('Payment error:', err?.error || err);
          return EMPTY;
        })
      )
      .subscribe();
  }
}
