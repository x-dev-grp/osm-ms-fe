import { Component, OnInit } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
 import { MatIconModule } from '@angular/material/icon';
 import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
 import { OIL_TRANSACTIONS_DASHBOARD_CONFIG } from './oil-transactions-dashboard.config';
 import { Router } from '@angular/router';
import { OsmDashboard } from '../../../shared/modules/osm-dashboard/osm-dashboard';
import { SharedModule } from '../../../demo/shared/shared.module';
import { DashboardConfig } from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import { OilTransaction } from '../../../shared/models/OilTransaction';
import { OilTransactionService } from '../../../shared/services/OilTransactionService';

@Component({
  selector: 'app-oil-transactions',
  standalone: true,
  templateUrl: './oil-transactions.component.html',
  styleUrls: ['./oil-transactions.component.scss'],
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    SharedModule,
    OsmDashboard
  ]
})
export class OilTransactionsComponent implements OnInit {
  dashboardConfig: DashboardConfig = OIL_TRANSACTIONS_DASHBOARD_CONFIG;

  oilTransactions: OilTransaction[] = [];
  dataSource: MatTableDataSource<OilTransaction> = new MatTableDataSource(this.oilTransactions);

  constructor(
    private snackBar: MatSnackBar,
    private oilTransactionService: OilTransactionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOilTransactions();
  }

  handleAction(event: { action: string; row: OilTransaction }): void {
    switch (event.action.toUpperCase()) {
      case 'VIEW':
        this.router.navigate(['/settings/storage/oil-transactions', event.row.id, 'view']);
        break;

      case 'EDIT':
        this.router.navigate(['/settings/storage/oil-transactions', event.row.id, 'edit']);
        break;

      case 'DELETE':
        this.deleteTransaction(event.row);
        break;
    }
  }

  private deleteTransaction(transaction: OilTransaction): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette transaction d\'huile ?')) {
      this.oilTransactionService.deleteOilTransaction(transaction.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Transaction d\'huile supprimée avec succès', 'Fermer', { duration: 3000 });
            // Refresh the list
            this.loadOilTransactions();
          } else {
            this.snackBar.open(response.message || 'Échec de la suppression de la transaction d\'huile', 'Fermer', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error deleting oil transaction:', error);
          this.snackBar.open('Erreur lors de la suppression de la transaction d\'huile', 'Fermer', { duration: 3000 });
        }
      });
    }
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
        this.snackBar.open('Erreur lors du chargement des transactions d\'huile', 'Fermer', { duration: 3000 });
      }
    });
  }
}
