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
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
export class SupplierPaymentHistoryComponent implements OnInit, AfterViewInit {
  paymentForm: FormGroup;
  remainingAmount = 0;
  selectedDelivery: UnifiedDelivery | null = null;
  bankAccounts: BankAccount[] = [];
  readonly destroyRef = inject(DestroyRef);

  relatedOilDelivery: UnifiedDelivery | null = null;
  relatedOilTransaction: any;
  transactionNotCompletedError: boolean = false;
  unpaidAmount: number = 0;

  constructor(
    private deliveryService: UnifiedDeliveryService,
    private fb: FormBuilder,
    private _searchService: AdvancedSearchService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _dialogRef: MatDialogRef<SupplierPaymentHistoryComponent>
  ) {}

  ngAfterViewInit() {
    this.paymentForm
      .get('amount')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(300),
        tap((value) => {
          const { paymentMethod, oilPrice, oilQuantity } = this.paymentForm.value;

          if (paymentMethod === 'oil' || paymentMethod === 'both') {
            this.remainingAmount = this.unpaidAmount - (Number(oilPrice) * Number(oilQuantity || 0) + Number(value || 0));
          } else {
            this.remainingAmount = this.unpaidAmount - Number(value || 0);
          }
        })
      )
      .subscribe();
  }

  ngOnInit(): void {
    this.selectedDelivery = this.data?.row;
    this.unpaidAmount = this.data?.row?.unpaidAmount;
    this.paymentForm = this.fb.group({
      paymentMethod: ['cash'],
      moneyPaymentMethod: ['cash'],
      amount: [null],
      checkNumber: [''],
      bankAccount: [null],
      oilQuantity: [null],
      oilPrice: [null]
    });
    this.loadBankAccounts();
    console.log(this.data.row);
    this.processData();
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

  async processExchange() {
    const searchData: SearchData = {
      page: 0,
      searchData: {
        operation: SearchOperation.AND,
        search: {
          isDeleted: {
            equalValue: false
          },
          'reception.id': {
            equalValue: this.selectedDelivery?.id
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
            if (oilTransaction?.transactionState != 'COMPLETED') {
              this.transactionNotCompletedError = true;
              return;
            }
            if (Number(oilTransaction?.totalPrice) == Number(this.unpaidAmount)) {
              this.paymentForm.patchValue({
                paymentMethod: 'oil',
                oilQuantity: oilTransaction?.quantityKg,
                oilPrice: oilTransaction?.unitPrice
              });
              return;
            } else if (oilTransaction?.totalPrice < Number(this?.unpaidAmount)) {
              this.paymentForm.patchValue({
                paymentMethod: 'both',
                oilQuantity: oilTransaction?.quantityKg,
                oilPrice: oilTransaction?.unitPrice,
                amount: Number(this?.unpaidAmount) - Number(oilTransaction?.totalPrice)
              });
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

  purshase() {
    this.paymentForm.patchValue({
      amount: Number(this?.unpaidAmount)
    });
  }

  processSimpleReception() {
    this.deliveryService
      .getDeliveryByOliveLotNumber(this.data.row.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((res: any) => {
          if (res?.data) {
            const oilReception = res?.data;
            if (oilReception?.price == this?.unpaidAmount) {
              this.paymentForm.patchValue({
                paymentMethod: 'oil',
                oilQuantity: oilReception?.oilQuantity,
                oilPrice: oilReception?.unitPrice
              });
              return;
            } else {
              this.paymentForm.patchValue({
                paymentMethod: 'both',
                oilQuantity: oilReception?.oilQuantity,
                oilPrice: oilReception?.unitPrice,
                amount: Number(this?.unpaidAmount) - Number(oilReception?.price)
              });
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
    this.purshase();
  }

  closePaymentForm() {
    this._dialogRef.close();
  }

  processBase() {
    this.deliveryService
      .getDeliveryByOliveLotNumber(this.data.row.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((res: any) => {
          if (res?.data) {
            const oilReception = res?.data;
            this.unpaidAmount = oilReception?.price;
            this.paymentForm.get('amount')?.setValue(this.unpaidAmount);
          }
        }),
        catchError((err, cauth) => {
          this._dialogRef.close();
          return of(EMPTY);
        })
      )
      .subscribe();
  }

  processPayment() {
    console.log(this.paymentForm.value);
  }

  private processData() {
    // Check if the selected delivery type is OLIVE
    if (this.selectedDelivery?.deliveryType == 'OLIVE') {
      // Switch statement to handle different operation types
      switch (this.selectedDelivery?.operationType) {
        // If the operation type is SIMPLE_RECEPTION, call the processSimpleReception method
        case 'SIMPLE_RECEPTION': {
          this.processSimpleReception();
          break;
        }
        // If the operation type is OLIVE_PURCHASE, call the purshase method
        case 'OLIVE_PURCHASE': {
          this.purshase();
          break;
        }
        // If the operation type is EXCHANGE, call the processExchange method
        case 'EXCHANGE': {
          this.processExchange();
          break;
        }
        case 'BASE': {
          this.processBase();
          break;
        }
      }
    } else {
      // If the delivery type is not OLIVE, call the purshase method
      this.purshase();
    }
  }
}
