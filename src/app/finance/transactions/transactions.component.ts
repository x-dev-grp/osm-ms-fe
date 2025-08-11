import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { FinancialTransaction } from '../models/financial-transaction.model';
import { FinancialTransactionService } from '../service/financial-transaction.service';
import { TRANSACTIONS_DASHBOARD_CONFIG } from './transactions-dashboard.config';
import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';
import { SharedModule } from '../../demo/shared/shared.module';
import { Action, DashboardConfig } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { ACTION_ICONS } from 'src/app/shared/modules/osm-dashboard/models/actions';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    SharedModule,
    OsmDashboard
  ],
  styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent implements OnInit, OnDestroy {
  dashboardConfig: DashboardConfig = TRANSACTIONS_DASHBOARD_CONFIG;
  loading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private transactionService: FinancialTransactionService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
   }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }



  /** Gère les actions depuis le tableau */
  handleAction(event: { row: FinancialTransaction; action: string }): void {
    const actionLabel = event.action?.toUpperCase();

    switch (actionLabel) {
      case 'READ':
        this.router.navigate(['/finance/transactions', event.row.id, 'view']);
        break;

      case 'PRINT':
        this.print(event.row.id!);
        break;

      case 'UPDATE':
        this.router.navigate(['/finance/transactions', event.row.id, 'edit']);
        break;


      case 'APPROVE':
        this.approve(event.row.id!);
        break;

      case 'REJECT':
        this.reject(event.row.id!);
        break;

      case 'DUPLICATE':
        this.duplicate(event.row.id!);
        break;


    }
  }

  /** Refresh dashboard data */


  /** Ouvre dans un nouvel onglet la vue et imprime */
  print(id: string): void {
    const tree = this.router.createUrlTree(['/finance/transactions', id, 'view'], { queryParams: { print: true } });
    const url = window.location.origin + this.router.serializeUrl(tree);
    window.open(url, '_blank');
  }



  /** Approuve une transaction */
  approve(id: string): void {
    if (!confirm('Êtes-vous sûr de vouloir approuver cette transaction ?')) {
      return;
    }

    this.loading = true;
    const currentUser = localStorage.getItem('currentUser') || 'System';

    this.transactionService.approveTransaction(id, currentUser)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.showSuccess('TRANSACTIONS.MESSAGES.APPROVE_SUCCESS');
           } else {
            this.showError(response.message || 'TRANSACTIONS.MESSAGES.APPROVE_ERROR');
          }
          this.loading = false;
        },
        error: () => {
          this.showError('TRANSACTIONS.MESSAGES.APPROVE_ERROR');
          this.loading = false;
        }
      });
  }

  /** Rejette une transaction */
  reject(id: string): void {
    const reason = prompt('Veuillez indiquer la raison du rejet :');
    if (!reason) {
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir rejeter cette transaction ?')) {
      return;
    }

    this.loading = true;
    const currentUser = localStorage.getItem('currentUser') || 'System';

    this.transactionService.rejectTransaction(id, currentUser, reason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.showSuccess('TRANSACTIONS.MESSAGES.REJECT_SUCCESS');

          } else {
            this.showError(response.message || 'TRANSACTIONS.MESSAGES.REJECT_ERROR');
          }
          this.loading = false;
        },
        error: () => {
          this.showError('TRANSACTIONS.MESSAGES.REJECT_ERROR');
          this.loading = false;
        }
      });
  }

  /** Duplicate a transaction */
  duplicate(id: string): void {
    if (!confirm('Voulez-vous dupliquer cette transaction ?')) {
      return;
    }

    this.loading = true;
    this.transactionService.getTransactionById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const transaction = response.data[0];
            // Navigate to add form with pre-filled data
            this.router.navigate(['/finance/transactions/new'], {
              queryParams: {
                duplicate: 'true',
                transactionType: transaction.transactionType,
                direction: transaction.direction,
                amount: transaction.amount,
                currency: transaction.currency,
                paymentMethod: transaction.paymentMethod,
                description: transaction.description,
                lotNumber: transaction.lotNumber
              }
            });
          }
          this.loading = false;
        },
        error: () => {
          this.showError('TRANSACTIONS.MESSAGES.LOAD_ERROR');
          this.loading = false;
        }
      });
  }

  /** Export single transaction */


  /** Bulk operations */
  bulkApprove(ids: string[]): void {
    if (!confirm(`Êtes-vous sûr de vouloir approuver ${ids.length} transaction(s) ?`)) {
      return;
    }

    this.loading = true;
    const currentUser = localStorage.getItem('currentUser') || 'System';
    let completed = 0;
    let errors = 0;

    ids.forEach(id => {
      this.transactionService.approveTransaction(id, currentUser)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            completed++;
            if (!response.success) {
              errors++;
            }

            if (completed === ids.length) {
              if (errors === 0) {
                this.showSuccess(`${ids.length} transaction(s) approuvée(s) avec succès`);
              } else {
                this.showError(`${errors} transaction(s) n'ont pas pu être approuvées`);
              }

              this.loading = false;
            }
          },
          error: () => {
            completed++;
            errors++;
            if (completed === ids.length) {
              this.showError(`${errors} transaction(s) n'ont pas pu être approuvées`);

              this.loading = false;
            }
          }
        });
    });
  }



  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}
