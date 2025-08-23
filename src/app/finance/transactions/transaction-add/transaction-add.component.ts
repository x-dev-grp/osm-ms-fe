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
    MatProgressSpinnerModule
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
      amount: ['', [Validators.required, Validators.min(0)]],
      currency: [Currency.TND],
      paymentMethod: ['', Validators.required],
      description: [''],
      lotNumber: [''],
      invoiceReference: [''],
      receiptReference: [''],
      transactionDate: [new Date().toISOString().split('T')[0], Validators.required]
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
      transactionDate: new Date().toISOString().split('T')[0] // Always use current date for duplicates
    });
  }

  private loadTransaction(id: string): void {
    this.loading = true;
    this.transactionService.getTransactionById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
        let  res=response.data[0]
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
            transactionDate: res.transactionDate?.split('T')[0]
          });
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showError('Erreur lors du chargement de la transaction');
      }
    });
  }

  onSubmit(): void {
    if (this.transactionForm.valid) {
      this.loading = true;
      const formValue = this.transactionForm.value;

      if (this.isEditMode && this.transactionId) {
        // Update existing transaction
        this.transactionService.updateTransaction({
          id: this.transactionId,
          ...formValue
        }).subscribe({
          next: (response) => {
            if (response.success) {
              this.showSuccess('Transaction mise à jour avec succès');
              this.router.navigate(['/finance/transactions']);
            } else {
              this.showError(response.message || 'Erreur lors de la mise à jour');
            }
            this.loading = false;
          },
          error: () => {
            this.showError('Erreur lors de la mise à jour');
            this.loading = false;
          }
        });
      } else {
        // Create new transaction
        this.transactionService.createTransaction(formValue).subscribe({
          next: (response) => {
            if (response.success) {
              const message = this.isDuplicateMode ?
                'Transaction dupliquée avec succès' :
                'Transaction créée avec succès';
              this.showSuccess(message);
              this.router.navigate(['/finance/transactions']);
            } else {
              this.showError(response.message || 'Erreur lors de la création');
            }
            this.loading = false;
          },
          error: () => {
            this.showError('Erreur lors de la création');
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

  getTitle(): string {
    if (this.isDuplicateMode) {
      return 'Dupliquer une Transaction';
    }
    return this.isEditMode ? 'Modifier une Transaction' : 'Nouvelle Transaction';
  }

  getSubmitButtonText(): string {
    if (this.isDuplicateMode) {
      return 'Dupliquer';
    }
    return this.isEditMode ? 'Mettre à jour' : 'Créer';
  }
}
