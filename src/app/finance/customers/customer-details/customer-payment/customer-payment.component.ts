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
import { PaymentMethod } from '../../../../finance/models/financial-transaction.model';
import { OilSale } from '../../../models/oil-sale.model';

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

  constructor(
    private deliveryService: UnifiedDeliveryService,
    private fb: FormBuilder,
    private _searchService: AdvancedSearchService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _dialogRef: MatDialogRef<CustomerPaymentComponent>
  ) {}

  ngAfterViewInit() {
    this.paymentForm
      .get('moneyPaymentMethod')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(100),
        tap((value) => {
          if (value === 'check') {
            this.paymentForm.get('checkNumber')?.setValidators([Validators.required]);
            this.paymentForm.get('bankAccount')?.clearValidators();
          } else if (value === 'bank_transfer') {
            this.paymentForm.get('checkNumber')?.clearValidators();
            this.paymentForm.get('bankAccount')?.setValidators([Validators.required]);
          } else {
            this.paymentForm.get('checkNumber')?.clearValidators();
            this.paymentForm.get('bankAccount')?.clearValidators();
          }
          this.paymentForm.get('checkNumber')?.updateValueAndValidity();
          this.paymentForm.get('bankAccount')?.updateValueAndValidity();
        })
      )
      .subscribe();
    this.paymentForm
      .get('paymentMethod')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(100),
        tap((value) => {
          const moneyPaymentMethod = this.paymentForm.get('moneyPaymentMethod')?.value;
          if (moneyPaymentMethod === 'check') {
            this.paymentForm.get('checkNumber')?.setValidators([Validators.required]);
            this.paymentForm.get('bankAccount')?.clearValidators();
          } else if (value === 'bank_transfer') {
            this.paymentForm.get('checkNumber')?.clearValidators();
            this.paymentForm.get('bankAccount')?.setValidators([Validators.required]);
          } else {
            this.paymentForm.get('checkNumber')?.clearValidators();
            this.paymentForm.get('bankAccount')?.clearValidators();
          }

          this.paymentForm.get('oilQuantity')?.updateValueAndValidity();
          this.paymentForm.get('')?.updateValueAndValidity();
          this.paymentForm.get('checkNumber')?.updateValueAndValidity();
          this.paymentForm.get('bankAccount')?.updateValueAndValidity();
        })
      )
      .subscribe();
    this.paymentForm
      .get('amount')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(300),
        tap((value) => {
          const { paymentMethod,   oilQuantity } = this.paymentForm.value;
          this.remainingAmount = this.totalAmount - Number(value || 0);
        })
      )
      .subscribe();
  }

  ngOnInit(): void {
    this.oilSaleTransaction = this.data?.row;
    this.totalAmount = this.data?.row?.totalAmount;
    this.paymentForm = this.fb.group({
      paymentMethod: ['cash'],
      moneyPaymentMethod: ['cash'],
      amount: [null],
      checkNumber: [''],
      bankAccount: [null],
      oilQuantity: [null],

    });
    this.loadBankAccounts();
    console.log(this.data.row);
    this.purshase();
  }

  loadBankAccounts(): void {
    const searchData: SearchData = {
      page: 0,
      searchData: {
        operation: SearchOperation.AND,
        search: {
          isDeleted: {
            equalValue: false
          }
        }
      }
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

  purshase() {
    this.paymentForm.patchValue({
      amount: Number(this?.totalAmount)
    });
  }

  closePaymentForm() {
    this._dialogRef.close();
  }


  processPayment() {
    console.log(this.paymentForm.value);
  }

}
