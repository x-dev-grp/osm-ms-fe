import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OilTransaction, TransactionState, TransactionType } from '../../../shared/models/OilTransaction';
import { OilTransactionService } from '../../../shared/services/OilTransactionService';


@Component({
  selector: 'app-view-oil-transaction',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './view-oil-transaction.component.html',
  styleUrls: ['./view-oil-transaction.component.scss']
})
export class ViewOilTransactionComponent implements OnInit {
  oilTransaction: OilTransaction | null = null;
  loading = true;
  error = false;

  // Enum references for template
  TransactionType = TransactionType;
  TransactionState = TransactionState;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private oilTransactionService: OilTransactionService,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadOilTransaction();
  }

  private loadOilTransaction(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = true;
      this.loading = false;
      return;
    }

    this.oilTransactionService.getOilTransaction(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.oilTransaction = Array.isArray(response.data) ? response.data[0] : response.data;
        } else {
          this.error = true;
          this.snackBar.open(
            this.translate.instant('OIL_TRANSACTIONS.VIEW.MESSAGES.ERROR'),
            this.translate.instant('STANDARD.BTNS.CANCEL'),
            { duration: 3000 }
          );
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading oil transaction:', error);
        this.error = true;
        this.loading = false;
        this.snackBar.open(
          this.translate.instant('OIL_TRANSACTIONS.VIEW.MESSAGES.ERROR'),
          this.translate.instant('STANDARD.BTNS.CANCEL'),
          { duration: 3000 }
        );
      }
    });
  }

  onEdit(): void {
    if (this.oilTransaction) {
      this.router.navigate(['/storage/oil-transactions', this.oilTransaction.id, 'edit']);
    }
  }

  onBack(): void {
    this.router.navigate(['/storage/oil-transactions']);
  }

  onDelete(): void {
    if (this.oilTransaction && confirm(this.translate.instant('OIL_TRANSACTIONS.VIEW.MESSAGES.DELETE_CONFIRM'))) {
      this.oilTransactionService.deleteOilTransaction(this.oilTransaction.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open(
              this.translate.instant('OIL_TRANSACTIONS.VIEW.MESSAGES.DELETE_SUCCESS'),
              this.translate.instant('STANDARD.BTNS.CANCEL'),
              { duration: 3000 }
            );
            this.router.navigate(['/storage/oil-transactions']);
          } else {
            this.snackBar.open(
              this.translate.instant('OIL_TRANSACTIONS.VIEW.MESSAGES.DELETE_ERROR'),
              this.translate.instant('STANDARD.BTNS.CANCEL'),
              { duration: 3000 }
            );
          }
        },
        error: (error) => {
          console.error('Error deleting oil transaction:', error);
          this.snackBar.open(
            this.translate.instant('OIL_TRANSACTIONS.VIEW.MESSAGES.DELETE_ERROR'),
            this.translate.instant('STANDARD.BTNS.CANCEL'),
            { duration: 3000 }
          );
        }
      });
    }
  }

  // Helper method to get transaction type label
  getTransactionTypeLabel(type: TransactionType): string {
    return this.translate.instant(`OIL_TRANSACTIONS.DASHBOARD.TYPES.${type}`);
  }

  // Helper method to get transaction state label
  getTransactionStateLabel(state: TransactionState): string {
    return this.translate.instant(`OIL_TRANSACTIONS.DASHBOARD.STATUS.${state}`);
  }
}
