import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { CardComponent } from '../../../theme/components/card/card.component';
import { FinancialTransaction, TransactionType, TransactionDirection, Currency, PaymentMethod } from '../../models/financial-transaction.model';
import { FinancialTransactionService } from '../../service/financial-transaction.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-transaction-view',
  templateUrl: './transaction-view.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    TranslateModule,
    CardComponent
  ],
  styleUrls: ['./transaction-view.component.scss']
})
export class TransactionViewComponent implements OnInit {
  transaction?: FinancialTransaction;
  loading = true;
  error = false;
  isPrintMode = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private transactionService: FinancialTransactionService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    // Check if this is print mode
    this.isPrintMode = this.route.snapshot.queryParamMap.get('print') === 'true';

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTransaction(id);
    } else {
      this.error = true;
      this.loading = false;
    }
  }

  private loadTransaction(id: string): void {
    this.loading = true;
    this.error = false;

    this.transactionService.getTransactionById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.transaction = response.data[0];
        } else {
          this.error = true;
          this.showError('TRANSACTIONS.ERRORS.NOT_FOUND');
        }
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
        this.showError('TRANSACTIONS.ERRORS.LOAD_ERROR');
      }
    });
  }

  onEdit(): void {
    if (this.transaction?.id) {
      this.router.navigate(['/finance/transactions', this.transaction.id, 'edit']);
    }
  }

  onBack(): void {
    this.router.navigate(['/finance/transactions']);
  }

  onPrint(): void {
    window.print();
  }

  onDuplicate(): void {
    if (this.transaction?.id) {
      this.router.navigate(['/finance/transactions/new'], {
        queryParams: {
          duplicate: 'true',
          transactionType: this.transaction.transactionType,
          direction: this.transaction.direction,
          amount: this.transaction.amount,
          currency: this.transaction.currency,
          paymentMethod: this.transaction.paymentMethod,
          description: this.transaction.description,
          lotNumber: this.transaction.lotNumber
        }
      });
    }
  }

  getStatusClass(): string {
    if (!this.transaction) return '';
    return this.transaction.approved ? 'status-approved' : 'status-pending';
  }

  getStatusLabel(): string {
    if (!this.transaction) return '';
    return this.transaction.approved ? 'TRANSACTIONS.STATUS.APPROVED' : 'TRANSACTIONS.STATUS.PENDING';
  }

  getAmountClass(): string {
    if (!this.transaction) return '';
    return this.transaction.direction === TransactionDirection.INBOUND ? 'amount-positive' : 'amount-negative';
  }

  hasReferences(): boolean {
    return !!(this.transaction?.lotNumber ||
             this.transaction?.invoiceReference ||
             this.transaction?.receiptReference);
  }

  hasParties(): boolean {
    return !!( this.transaction?.supplierId);
  }

  hasApprovalInfo(): boolean {
    return !!(this.transaction?.approvedBy || this.transaction?.approvalDate);
  }

  private showError(message: string): void {
    this.toast.error(message );
  }
}
