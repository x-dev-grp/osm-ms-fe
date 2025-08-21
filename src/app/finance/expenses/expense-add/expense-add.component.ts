import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
 import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { ExpenseService } from '../../service/expense.service';
import { Expense } from '../../models/expense.model';
import { PaymentMethod } from '../../models/financial-transaction.model';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-expense-add',
  templateUrl: './expense-add.component.html',
  styleUrls: ['./expense-add.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    SharedModule
  ]
})
export class ExpenseAddComponent implements OnInit {
  form: FormGroup;
  loading = false;
  editing = false;
  expenseId: string | null = null;
  paymentMethods = Object.values(PaymentMethod);
  statusOptions = ['Pending', 'Paid', 'Reimbursed'] as const;

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private toast: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.checkEditMode();
  }

  private initForm(): void {
    this.form = this.fb.group({
      invoiceRef: ['', Validators.required],
      purchaseNature: ['', Validators.required],
      object: [''],
      amount: [0, [Validators.required, Validators.min(0)]],
      vendor: [''],
      category: [''],
      paymentMethod: [this.paymentMethods[0], Validators.required],
      status: [this.statusOptions[0].toUpperCase(), Validators.required],
      notes: [''],
      receiptNumber: [''],
      createdBy: [''],
      approved: [false],
      approvalDate: [null]
    });
  }

  private checkEditMode(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.expenseId = id;
        this.editing = true;
        this.loadExpenseData(id);
      }
    });
  }

  private loadExpenseData(id: string): void {
    this.loading = true;
    this.expenseService.getExpense(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const expense = Array.isArray(response.data) ? response.data[0] : response.data;
          this.form.patchValue({
            invoiceRef: expense.invoiceRef || '',
            purchaseNature: expense.purchaseNature || '',
            object: expense.object || '',
            amount: expense.amount ?? 0,
            vendor: expense.vendor || '',
            category: expense.category || '',
            paymentMethod: expense.paymentMethod || this.paymentMethods[0],
            status: (expense.status || this.statusOptions[0]).toUpperCase(),
            notes: expense.notes || '',
            receiptNumber: expense.receiptNumber || '',
            createdBy: expense.createdBy || '',
            approved: !!expense.approved,
            approvalDate: expense.approvalDate ? new Date(expense.approvalDate) : null
          });
        }
        this.loading = false;
      },
      error: () => {
        this.toast.error('Erreur lors du chargement de la dépense' );
        this.loading = false;
        this.router.navigate(['/finance/expenses']);
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.toast.error('Veuillez remplir tous les champs obligatoires' );
      return;
    }

    const expense: Expense = {
      ...this.form.value,
      id: this.expenseId
    };

    const request$ = this.editing
      ? this.expenseService.updateExpense(expense)
      : this.expenseService.createExpense(expense);

    this.loading = true;
    request$.subscribe({
      next: (response) => {
        if (response.success) {
          this.toast.success(
           );
          this.router.navigate(['/finance/expenses']);
        } else {
          this.toast.error(response.message || 'Une erreur est survenue' );
        }
        this.loading = false;
      },
      error: () => {
        this.toast.error('Une erreur est survenue');
        this.loading = false;
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/finance/expenses']);
  }
}
