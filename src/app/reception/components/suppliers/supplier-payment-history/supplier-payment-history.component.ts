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
import { OperationType } from '../../../../shared/models/operation-type.enum';
import { deliveryType } from '../../../../shared/models/deleveryType';
import { TransactionState } from '../../../../shared/models/OilTransaction';
import { Currency, PaymentMethod, TransactionDirection } from '../../../../finance/models/financial-transaction.model';
import { OilSaleService } from '../../../../finance/service/oil-sale.service';
export interface PaymentDialogResult {
  ok: boolean;                 // true si succès
  message: string;             // message à afficher
  payload?: any;               // (optionnel) données renvoyées
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
  protected derivedDirection: TransactionDirection;

  constructor(
    private deliveryService: UnifiedDeliveryService,
    private fb: FormBuilder,
    private _searchService: AdvancedSearchService,
    private oilSaleService: OilSaleService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _dialogRef: MatDialogRef<SupplierPaymentHistoryComponent>
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
          if (value === 'oil' || value === 'both') {
            this.paymentForm.get('oilQuantity')?.setValidators([Validators.required]);
            this.paymentForm.get('oilPrice')?.setValidators([Validators.required]);
            this.paymentForm.get('checkNumber')?.clearValidators();
            this.paymentForm.get('bankAccount')?.clearValidators();
          } else {
            this.paymentForm.get('oilQuantity')?.clearValidators();
            this.paymentForm.get('oilPrice')?.clearValidators();
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
          }
          this.paymentForm.get('oilQuantity')?.updateValueAndValidity();
          this.paymentForm.get('oilPrice')?.updateValueAndValidity();
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

            this.remainingAmount = this.unpaidAmount - Number(value || 0);

        })
      )
      .subscribe();
    // this.paymentForm
    //   .get('oilQuantity')
    //   ?.valueChanges.pipe(
    //     takeUntilDestroyed(this.destroyRef),
    //     debounceTime(300),
    //     tap((value) => {
    //       const { paymentMethod, oilPrice, oilQuantity } = this.paymentForm.value;
    //
    //       if (paymentMethod === PaymentMethod.OIL || paymentMethod === PaymentMethod.BOTH) {
    //         this.remainingAmount = this.unpaidAmount - (Number(oilPrice) * Number(oilQuantity || 0) + Number(value || 0));
    //       } else {
    //         this.remainingAmount = this.unpaidAmount - Number(value || 0);
    //       }
    //     })
    //   )
    //   .subscribe();
    // this.paymentForm
    //   .get('oilPrice')
    //   ?.valueChanges.pipe(
    //     takeUntilDestroyed(this.destroyRef),
    //     debounceTime(300),
    //     tap((value) => {
    //       const { paymentMethod, oilPrice, oilQuantity } = this.paymentForm.value;
    //
    //       if (paymentMethod === PaymentMethod.OIL || paymentMethod === PaymentMethod.BOTH) {
    //         this.remainingAmount = this.unpaidAmount - (Number(oilPrice) * Number(oilQuantity || 0) + Number(value || 0));
    //       } else {
    //         this.remainingAmount = this.unpaidAmount - Number(value || 0);
    //       }
    //     })
    //   )
    //   .subscribe();
  }

  ngOnInit(): void {
    this.selectedDelivery = this.data?.row;
    this.unpaidAmount = this.data?.row?.unpaidAmount;
    this.totalPrice = this.data?.row?.price;
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
            if (oilTransaction?.transactionState != TransactionState.COMPLETED) {
              this.transactionNotCompletedError = true;
              this.paymentForm.disable();

              return;
            }
            if (Number(oilTransaction?.totalPrice) == Number(this.unpaidAmount)) {
              this.paymentForm.patchValue({
                paymentMethod: PaymentMethod.OIL,
                oilQuantity: oilTransaction?.quantityKg,
                oilPrice: oilTransaction?.unitPrice
              });
              return;
            } else if (oilTransaction?.totalPrice < Number(this?.unpaidAmount)) {
              this.paymentForm.patchValue({
                paymentMethod: PaymentMethod.BOTH,
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
    this.derivedDirection = TransactionDirection.OUTBOUND;
    this.paymentForm.patchValue({
      amount: Number(this.data?.row?.unpaidAmount)
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
            if (oilReception?.price == this.data.row?.price) {
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
                amount: Number(this?.unpaidAmount)
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
    this._dialogRef.close({ ok: false, message: 'Opération annulée.' } as PaymentDialogResult);
  }

  processBase() {
    this.deliveryService
      .getDeliveryByOliveLotNumber(this.data.row.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((res: any) => {
          if (res?.data && res?.data.price) {
            const oilReception = res?.data;
            this.unpaidAmount = oilReception?.price;
            this.paymentForm.get('amount')?.setValue(this.unpaidAmount);
          } else {
            this.transactionNotCompletedError = true;
            this.paymentForm.disable();
          }
          //todo chnage the msgs based on the operation use html anf variable
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
    if (this.selectedDelivery?.deliveryType) {
      this.processDeliveryPaiment();
    } else {
      this.processOilSalePayment();
    }
  }

  async processOilSalePayment(): Promise<void> {
    if (this.paymentForm.invalid || this.transactionNotCompletedError || !this.selectedDelivery?.id) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const v = this.paymentForm.value as {
      moneyPaymentMethod: 'cash' | 'check' | 'bank_transfer';
      amount?: number;
      checkNumber?: string;
      bankAccount?: any;
    };

    // Map to enum values like in customer flow
    const mappedMethod =
      v.moneyPaymentMethod === 'cash'
        ? PaymentMethod.CASH
        : v.moneyPaymentMethod === 'check'
          ? PaymentMethod.CHEQUE
          : PaymentMethod.TRANSFER;

    // Build payload identical in shape to customer flow, but for supplier
    const payload = {
      idOperation: this.selectedDelivery.id, // delivery ID or oil sale ID for supplier
      amount: Number(v.amount || 0),
      currency: Currency.TND,
      paymentMethod: mappedMethod,
      checkNumber: mappedMethod === PaymentMethod.CHEQUE ? v.checkNumber || null : null,
      bankAccount: mappedMethod === PaymentMethod.TRANSFER ? v.bankAccount || null : null,
      supplier: this.selectedDelivery.supplier, // supplier instead of customer
      customer: null
    };

    try {
      this.oilSaleService
        .processPayment(payload)
        .pipe()
        .subscribe({
          next: (response) => {
            console.log(response);
            const result: PaymentDialogResult = {
              ok: true,
              message: 'Paiement enregistré avec succès.',
              payload: response
            };
            this._dialogRef.close(result);
          },
          error: (err) => {
            const result: PaymentDialogResult = {
              ok: false,
              message: this.formatError(err) // formate un message lisible
            };
            this._dialogRef.close(result);
          }
        });
      this.closePaymentForm();
    } catch (err) {
      this.transactionNotCompletedError = true;
    }
  }

  private processData() {
    // Check if the selected delivery type is OLIVE
    if (this.selectedDelivery?.deliveryType == deliveryType.OLIVE) {
      // Switch statement to handle different operation types
      switch (this.selectedDelivery?.operationType) {
        // If the operation type is SIMPLE_RECEPTION, call the processSimpleReception method
        case OperationType.SIMPLE_RECEPTION: {
          this.processSimpleReception();
          this.derivedDirection = TransactionDirection.INBOUND;
          break;
        }
        // If the operation type is OLIVE_PURCHASE, call the purshase method
        case OperationType.OLIVE_PURCHASE: {
          this.purshase();
          this.derivedDirection = TransactionDirection.OUTBOUND;

          break;
        }
        // If the operation type is EXCHANGE, call the processExchange method
        case OperationType.EXCHANGE: {
          this.derivedDirection = TransactionDirection.INBOUND;
          this.processExchange();
          break;
        }
        case OperationType.BASE: {
          this.derivedDirection = TransactionDirection.OUTBOUND;
          this.processBase();
          break;
        }
      }
    } else {
      // If the delivery type is not OLIVE, call the purshase method
      this.purshase();
    }
  }

  private async processDeliveryPaiment() {
    if (this.paymentForm.invalid || this.transactionNotCompletedError || !this.selectedDelivery?.id) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const v = this.paymentForm.value as {
      moneyPaymentMethod: 'cash' | 'check' | 'bank_transfer';
      amount?: number;
      checkNumber?: string;
      bankAccount?: any;
    };

    // Map to enum values like in customer flow
    const mappedMethod =
      v.moneyPaymentMethod === 'cash'
        ? PaymentMethod.CASH
        : v.moneyPaymentMethod === 'check'
          ? PaymentMethod.CHEQUE
          : PaymentMethod.TRANSFER;

    // Build payload identical in shape to customer flow, but for supplier
    const payload = {
      idOperation: this.selectedDelivery.id, // delivery ID or oil sale ID for supplier
      amount: Number(v.amount || 0),
      currency: Currency.TND,
      paymentMethod: mappedMethod,
      checkNumber: mappedMethod === PaymentMethod.CHEQUE ? v.checkNumber || null : null,
      bankAccount: mappedMethod === PaymentMethod.TRANSFER ? v.bankAccount || null : null,
      supplier: this.selectedDelivery.supplier, // supplier instead of customer
      customer: null
    };

    try {
       this.deliveryService.processPayment(payload).pipe().subscribe(
         {
           next:(response)=>{
             console.log(response)
             const result: PaymentDialogResult = {
               ok: true,
               message: 'Paiement enregistré avec succès.',
               payload: response
             };
             this._dialogRef.close(result);
           },
           error: (err) => {
             const result: PaymentDialogResult = {
               ok: false,
               message: this.formatError(err) // formate un message lisible
             };
             this._dialogRef.close(result);
           }
         }
       )
      this.closePaymentForm();
    } catch (err) {
      this.transactionNotCompletedError = true;
    }
  }
  private formatError(err: any): string {
    if (err?.error?.message) return err.error.message;
    return 'Une erreur est survenue lors de l’enregistrement du paiement.';
  }
  //protected readonly TransactionDirection = TransactionDirection;
  protected readonly TransactionDirection = TransactionDirection;
  totalPrice: number;
}
