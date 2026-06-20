import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BankAccountService } from '../../service/bankAccount.service';
import { FinancialTransactionService } from '../../service/financial-transaction.service';
import { BankAccount } from '../../models/BankAccount';
import { FinancialTransaction } from '../../models/financial-transaction.model';
import { ApiResponse } from '../../../shared/models/api-response';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { SharedModule } from '../../../shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-view-bank-account',
  templateUrl: './view-bank-account.component.html',
  imports: [
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatCardModule,
    MatExpansionModule,
    ReactiveFormsModule,
    MatSortModule,
    MatPaginatorModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    SharedModule,
    TranslateModule
  ],
  standalone: true,
  styleUrls: ['./view-bank-account.component.scss']
})
export class ViewBankAccountComponent implements OnInit {
  bankAccount: BankAccount | null;
  transactions: FinancialTransaction[];
  loading = false;

  constructor(
    private bankAccountService: BankAccountService,
    private bankhiostory: FinancialTransactionService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadBankAccount();
  }

  private loadBankAccount(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.toast.error('AUTO.INVALID_BANK_ACCOUNT_ID');
      this.router.navigate(['/finance/banks']);
      return;
    }

    this.loading = true;
    this.bankAccountService.getBankAccount(id).subscribe({
      next: (response: ApiResponse<BankAccount>) => {
        if (response.success) {
          this.bankAccount = Array.isArray(response.data) ? response.data[0] : response.data;
        } else {
          this.toast.error('AUTO.BANK_ACCOUNT_NOT_FOUND');
          this.router.navigate(['/finance/banks']);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading bank account:', error);
        this.toast.error('AUTO.ERROR_LOADING_BANK_ACCOUNT_DETAILS');
        this.router.navigate(['/finance/banks']);
        this.loading = false;
      }
    });
    // Make sure you have: import { FinancialTransaction } from '...';
    // and this.transactions: FinancialTransaction[] = [];

    this.bankhiostory.getTransactionsByBankId(id).subscribe({
      next: (response: ApiResponse<FinancialTransaction>) => {
        if (response.success && Array.isArray(response.data)) {
          this.transactions = response.data;
          console.log(this.transactions);
        } else {
          this.transactions = [];
          this.toast.info('AUTO.NO_TRANSACTIONS_FOUND_FOR_THIS_BANK');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading bank transactions:', error);
        this.toast.error('AUTO.ERROR_LOADING_BANK_TRANSACTIONS');
        this.loading = false;
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/finance/banks']);
  }

  onEdit(): void {
    if (this.bankAccount) {
      this.router.navigate(['/finance/banks/edit', this.bankAccount.id]);
    }
  }

  onPrint(): void {
    // Implement print functionality
    window.print();
  }
}
