import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { CardComponent } from '../../../theme/components/card/card.component';
import { FinancialTransaction, TransactionType, TransactionDirection, Currency, PaymentMethod } from '../../models/financial-transaction.model';
import { FinancialTransactionService } from '../../service/financial-transaction.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-transaction-add',
  templateUrl: './transaction-add.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatProgressSpinnerModule,
    TranslateModule,
    CardComponent
  ],
  styleUrls: ['./transaction-add.component.scss']
})
export class TransactionAddComponent implements OnInit {
  transactionForm!: FormGroup;
  isEditMode = false;
  isDuplicateMode = false;
  transactionId?: string;
  loading = false;

  transactionTypes = Object.values(TransactionType);
  transactionDirections = Object.values(TransactionDirection);
  currencies = Object.values(Currency);
  paymentMethods = Object.values(PaymentMethod);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private transactionService: FinancialTransactionService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.initForm();

    // Check if this is a duplicate operation
    const isDuplicate = this.route.snapshot.queryParamMap.get('duplicate');
    if (isDuplicate === 'true') {
      this.isDuplicateMode = true;
      this.loadDuplicateData();
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.transactionId = id;
      this.loadTransaction(id);
    }
  }

  private initForm(): void {
    this.transactionForm = this.fb.group({
      transactionType: ['', Validators.required],
      direction: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      currency: [Currency.TND],
      paymentMethod: ['', Validators.required],
      description: [''],
      lotNumber: [''],
      receiptReference: [''],
      transactionDate: [new Date(), Validators.required]
    });
  }

  private loadDuplicateData(): void {
    // Load data from query parameters for duplication
    const queryParams = this.route.snapshot.queryParamMap;

    this.transactionForm.patchValue({
      transactionType: queryParams.get('transactionType') || '',
      direction: queryParams.get('direction') || '',
      amount: queryParams.get('amount') || '',
      currency: queryParams.get('currency') || Currency.TND,
      paymentMethod: queryParams.get('paymentMethod') || '',
      description: queryParams.get('description') || '',
      lotNumber: queryParams.get('lotNumber') || '',
      transactionDate: queryParams.get('transactionDate') ? new Date(queryParams.get('transactionDate')!) : new Date()
    });
  }

  private loadTransaction(id: string): void {
    this.loading = true;
    this.transactionService.getTransactionById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const res = response.data;
          this.transactionForm.patchValue({
            transactionType: res.transactionType,
            direction: res.direction,
            amount: res.amount,
            currency: res.currency,
            paymentMethod: res.paymentMethod,
            description: res.description,
            lotNumber: res.lotNumber,
            invoiceReference: res.invoiceReference,
            receiptReference: res.receiptReference,
            transactionDate: res.transactionDate ? new Date(res.transactionDate) : new Date()
          });
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showError('TRANSACTIONS.ERRORS.LOAD_ERROR');
      }
    });
  }

  onSubmit(): void {
    if (this.transactionForm.valid) {
      this.loading = true;
      const formValue = this.toPayload(this.transactionForm.value);

      if (this.isEditMode && this.transactionId) {
        // Update existing transaction
        this.transactionService.updateTransaction({
          id: this.transactionId,
          ...formValue
        }).subscribe({
          next: (response) => {
            if (response.success) {
              this.showSuccess('TRANSACTIONS.MESSAGES.UPDATE_SUCCESS');
              this.router.navigate(['/finance/transactions']);
            } else {
              this.showError(response.message || 'TRANSACTIONS.ERRORS.UPDATE_ERROR');
            }
            this.loading = false;
          },
          error: () => {
            this.showError('TRANSACTIONS.ERRORS.UPDATE_ERROR');
            this.loading = false;
          }
        });
      } else {
        // Create new transaction
        this.transactionService.createTransaction(formValue).subscribe({
          next: (response) => {
            if (response.success) {
              const message = this.isDuplicateMode ?
                'TRANSACTIONS.MESSAGES.DUPLICATE_SUCCESS' :
                'TRANSACTIONS.MESSAGES.CREATE_SUCCESS';
              this.showSuccess(message);
              this.router.navigate(['/finance/transactions']);
            } else {
              this.showError(response.message || 'TRANSACTIONS.ERRORS.CREATE_ERROR');
            }
            this.loading = false;
          },
          error: () => {
            this.showError('TRANSACTIONS.ERRORS.CREATE_ERROR');
            this.loading = false;
          }
        });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/finance/transactions']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.transactionForm.controls).forEach(key => {
      const control = this.transactionForm.get(key);
      control?.markAsTouched();
    });
  }

  private showSuccess(message: string): void {
    this.toast.success(message );
  }

  private showError(message: string): void {
    this.toast.error(message );
  }

  private toPayload(formValue: any): FinancialTransaction {
    return {
      ...formValue,
      transactionDate: this.toLocalDateTime(formValue.transactionDate)
    };
  }

  private toLocalDateTime(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    const pad = (part: number) => part.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  getTitle(): string {
    if (this.isDuplicateMode) {
      return 'TRANSACTIONS.ACTIONS.DUPLICATE';
    }
    return this.isEditMode ? 'TRANSACTIONS.ACTIONS.EDIT' : 'TRANSACTIONS.ACTIONS.ADD';
  }

  getSubmitButtonText(): string {
    if (this.isDuplicateMode) {
      return 'TRANSACTIONS.ACTIONS.DUPLICATE';
    }
    return this.isEditMode ? 'COMMON.UPDATE' : 'COMMON.SAVE';
  }
}
