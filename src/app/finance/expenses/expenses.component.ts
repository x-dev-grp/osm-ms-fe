// 4) Combined Component: expenses.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Expense } from '../models/expense.model';
import { ExpenseService } from '../service/expense.service';
import { EXPENSES_DASHBOARD_CONFIG } from './expenses-dashboard.config';
import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';
import { SharedModule } from '../../demo/shared/shared.module';
import { Action, DashboardConfig } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { ACTION_ICONS } from 'src/app/shared/modules/osm-dashboard/models/actions';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    SharedModule,
    OsmDashboard
  ],
  styleUrls: ['./expenses.component.scss']
})
export class ExpensesComponent implements OnInit {
  dashboardConfig: DashboardConfig = EXPENSES_DASHBOARD_CONFIG;

  constructor(
    private expenseService: ExpenseService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Component initialization if needed
  }

  /** Gère les actions depuis le tableau */
  handleAction(event: {  row: Expense;action: string }): void {
    const actionLabel = event.action?.toUpperCase();

    switch (actionLabel) {
      case 'READ':
        this.router.navigate(['/finance/expenses', event.row.id, 'view']);
        break;

      case 'PRINT':
        this.print(event.row.id!);
        break;

      case 'UPDATE':
        this.router.navigate(['/finance/expenses', event.row.id, 'edit']);
        break;

      case 'DELETE':
        this.delete(event.row.id!);
        break;
    }
  }

  /** Ouvre dans un nouvel onglet la vue et imprime */
  print(id: string): void {
    const tree = this.router.createUrlTree(['/finance/expenses', id, 'view'], { queryParams: { print: true } });
    const url = window.location.origin + this.router.serializeUrl(tree);
    window.open(url, '_blank');
  }

  /** Supprime une dépense avec confirmation */
  delete(id: string): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
      return;
    }
    this.expenseService.deleteExpense(id).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.showSuccess('Dépense supprimée avec succès');
          // Refresh the dashboard
          window.location.reload();
        } else {
          this.showError(response.message || 'Erreur lors de la suppression');
        }
      },
      error: () => this.showError('Erreur lors de la suppression')
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
