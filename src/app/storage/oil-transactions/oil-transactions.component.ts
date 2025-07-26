import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OIL_TRANSACTIONS_DASHBOARD_CONFIG } from './oil-transactions-dashboard.config';
import { Router } from '@angular/router';
import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';
import { SharedModule } from '../../demo/shared/shared.module';
import { DashboardConfig } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { OilTransaction, TransactionType } from '../../shared/models/OilTransaction';
import { OilTransactionService } from '../../shared/services/OilTransactionService';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { ApiResponse } from '../../shared/models/api-response';
import { StorageUnitDto } from '../../shared/models/StorageUnitDto';
import { StorageUnitDtoService } from '../../shared/services/storage.service';
import { ExchangeValidationDialogComponent } from './exchange-validation-dialog/exchange-validation-dialog.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-oil-transactions',
  standalone: true,
  templateUrl: './oil-transactions.component.html',
  styleUrls: ['./oil-transactions.component.scss'],
  imports: [CommonModule, MatTableModule, MatIconModule, SharedModule, TranslateModule, OsmDashboard]
})
export class OilTransactionsComponent implements OnInit {
  dashboardConfig: DashboardConfig = OIL_TRANSACTIONS_DASHBOARD_CONFIG;
  oilTransactions: OilTransaction[] = [];
  storageUnits: StorageUnitDto[] = [];
  dataSource: MatTableDataSource<OilTransaction> = new MatTableDataSource(this.oilTransactions);
  @ViewChild('dashboard') dashboard!: OsmDashboard;
  private destroy$ = new Subject<void>();

  constructor(
    private snackBar: MatSnackBar,
    private oilTransactionService: OilTransactionService,
    private storageUnitService: StorageUnitDtoService,
    private translate: TranslateService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOilTransactions();
    this.loadStorageUnits();
  }

  handleAction(event: { action: string; row: OilTransaction }): void {
    switch (event.action.toUpperCase()) {
      case 'READ':
        this.router.navigate(['/storage/oil-transactions', event.row.id, 'view']);
        break;

      case 'UPDATE':
        this.router.navigate(['/storage/oil-transactions', event.row.id, 'edit']);
        break;
      case 'VALIDATE':
        switch (event.row.transactionType) {
          case TransactionType.EXCHANGE:
            this.openExchangeValidationDialog(event.row, false);
            break;
          case TransactionType.RECEPTION_IN:
            this.openExchangeValidationDialog(event.row, true);
            break;
          default:
            this.router.navigate(['/storage/oil-transactions', event.row.id, 'validate']);
        }

        break;

      case 'DELETE':
        this.deleteTransaction(event.row);
        break;
    }
  }

  private openExchangeValidationDialog(tx: OilTransaction, isIn: boolean): void {
    const ref = this.dialog.open(ExchangeValidationDialogComponent, {
      width: 'auto',
      data: {
        storageUnits: this.storageUnits,
        oilQ: tx.quantityKg,
        isIn: isIn
      }
    });

    ref
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((selectedStorage: StorageUnitDto | undefined) => {
        if (!selectedStorage) {
          // User cancelled the dialog
          return;
        }

        let transactionRequest: OilTransaction;

        if (isIn) {
          //if the transaction addes oil to the storaeg unit we do
          transactionRequest = {
            id: tx.id!,
            transactionType: tx.transactionType,
            transactionState: tx.transactionState,
            storageUnitDestination: selectedStorage, // selected as destination
            storageUnitSource: tx.storageUnitSource!, // existing as source
            qualityGrade: tx.qualityGrade,
            quantityKg: tx.quantityKg,
            unitPrice: tx.unitPrice ?? 0,
            totalPrice: tx.totalPrice
          };
        } else {
          // if the transaction  is out we use this
          transactionRequest = {
            id: tx.id!,
            transactionType: tx.transactionType,
            transactionState: tx.transactionState,
            storageUnitDestination: tx.storageUnitDestination!, // existing as destination
            storageUnitSource: selectedStorage, // selected as source
            qualityGrade: tx.qualityGrade,
            quantityKg: tx.quantityKg,
            unitPrice: tx.unitPrice ?? 0,
            totalPrice: tx.totalPrice
          };
        }

        this.oilTransactionService
          .approveOilTransaction(transactionRequest)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              if (response.success) {
                this.showSuccess('OIL_TRANSACTIONS.FORM.MESSAGES.SUCCESS.APPROVE');
                this.dashboard.refrechData();
                this.router.navigate(['/storage/oil-transactions']);
              } else {
                this.showError('OIL_TRANSACTIONS.FORM.MESSAGES.ERROR.APPROVE');
              }
            },
            error: () => {
              this.showError('OIL_TRANSACTIONS.FORM.MESSAGES.ERROR.APPROVE');
            }
          });
      });
  }

  private deleteTransaction(transaction: OilTransaction): void {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette transaction d'huile ?")) {
      this.oilTransactionService.deleteOilTransaction(transaction.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open("Transaction d'huile supprimée avec succès", 'Fermer', { duration: 3000 });
            // Refresh the list
            this.loadOilTransactions();
          } else {
            this.snackBar.open(response.message || "Échec de la suppression de la transaction d'huile", 'Fermer', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error deleting oil transaction:', error);
          this.snackBar.open("Erreur lors de la suppression de la transaction d'huile", 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  private showSuccess(messageKey: string): void {
    this.snackBar.open(this.translate.instant(messageKey), undefined, { duration: 3000 });
  }

  private loadOilTransactions(): void {
    this.oilTransactionService.getAllOilTransactionsList().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.oilTransactions = response.data;
          this.dataSource.data = this.oilTransactions;
        }
      },
      error: (error) => {
        console.error('Error loading oil transactions:', error);
        this.snackBar.open("Erreur lors du chargement des transactions d'huile", 'Fermer', { duration: 3000 });
      }
    });
  }

  private loadStorageUnits(): void {
    this.storageUnitService
      .getAllStorageUnit()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ApiResponse<StorageUnitDto>) => {
          this.storageUnits = response.data.sort((a, b) => a.name.localeCompare(b.name));
        },
        error: (error: unknown) => {
          console.error('Error loading storage units:', error);
          this.snackBar.open('OIL_TRANSACTIONS.FORM.MESSAGES.ERROR.LOAD_STORAGE_UNITS');
        }
      });
  }

  private showError(messageKey: string): void {
    this.snackBar.open(this.translate.instant(messageKey), this.translate.instant('STANDARD.BTNS.CANCEL'), { duration: 3000 });
  }
}
