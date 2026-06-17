import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { CardComponent } from '../../../theme/components/card/card.component';
import {
  FinancialTransaction,
  parseTransactionAmount,
  TransactionDirection
} from '../../models/financial-transaction.model';
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
    MatChipsModule,
    MatProgressSpinnerModule,
    TranslateModule,
    CardComponent
  ],
  styleUrls: ['./transaction-view.component.scss']
})
export class TransactionViewComponent implements OnInit {
  readonly TransactionDirection = TransactionDirection;

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
          this.transaction = response.data;
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
    if (!this.transaction?.id) {
      return;
    }

    this.router.navigate(['/finance/transactions/new'], {
      queryParams: {
        duplicate: 'true',
        transactionType: this.transaction.transactionType,
        direction: this.transaction.direction,
        amount: this.amountValue,
        currency: this.transaction.currency,
        paymentMethod: this.transaction.paymentMethod,
        description: this.transaction.description,
        lotNumber: this.transaction.lotNumber
      }
    });
  }

  get amountValue(): number {
    return parseTransactionAmount(this.transaction?.amount);
  }

  getStatusClass(): string {
    if (!this.transaction) {
      return '';
    }
    return this.transaction.approved ? 'status-approved' : 'status-pending';
  }

  getStatusLabel(): string {
    if (!this.transaction) {
      return '';
    }
    return this.transaction.approved ? 'TRANSACTIONS.STATUS.APPROVED' : 'TRANSACTIONS.STATUS.PENDING';
  }

  getAmountClass(): string {
    if (!this.transaction) {
      return '';
    }
    return this.transaction.direction === TransactionDirection.INBOUND ? 'amount-positive' : 'amount-negative';
  }

  getSupplierLabel(): string {
    const supplier = this.transaction?.supplier ?? this.transaction?.supplierId;
    if (supplier) {
      const fullName = [supplier.name, supplier.lastname].filter(Boolean).join(' ').trim();
      if (fullName) {
        return fullName;
      }
      if (supplier.id) {
        return supplier.id;
      }
    }
    return this.transaction?.vendorName || '—';
  }

  getBankAccountLabel(): string {
    const account = this.transaction?.bankAccount;
    if (!account) {
      return '—';
    }
    const parts = [account.bankName, account.rib || account.iban].filter(Boolean);
    return parts.join(' · ') || '—';
  }

  hasReferences(): boolean {
    return !!(
      this.transaction?.lotNumber ||
      this.transaction?.invoiceReference ||
      this.transaction?.receiptReference ||
      this.transaction?.externalTransactionId
    );
  }

  hasParties(): boolean {
    const label = this.getSupplierLabel();
    return !!label && label !== '—';
  }

  hasPaymentDetails(): boolean {
    return !!(
      this.transaction?.checkNumber ||
      this.transaction?.bankAccount ||
      this.transaction?.paidAmount != null ||
      this.transaction?.unpaidAmount != null
    );
  }

  hasApprovalInfo(): boolean {
    return !!(this.transaction?.approvedBy || this.transaction?.approvalDate || this.transaction?.approved != null);
  }

  hasAuditInfo(): boolean {
    return !!(this.transaction?.createdBy || this.transaction?.createdDate || this.transaction?.lastModifiedDate);
  }

  private showError(message: string): void {
    this.toast.error(message);
  }
}
