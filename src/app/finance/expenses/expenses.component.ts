// 4) Combined Component: expenses.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ToastService } from '../../shared/services/toast.service';
import { Router } from '@angular/router';
import { Expense } from '../models/expense.model';
import { ExpenseService } from '../service/expense.service';
import { EXPENSES_DASHBOARD_CONFIG } from './expenses-dashboard.config';
import { OosmDashboard } from '../../shared/modules/oosm-dashboard/oosm-dashboard';
import { SharedModule } from '../../shared/shared.module';
import { DashboardConfig } from '../../shared/modules/oosm-dashboard/models/dashboard-config';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    SharedModule,
    OosmDashboard
  ],
  styleUrls: ['./expenses.component.scss']
})
export class ExpensesComponent implements OnInit {
  dashboardConfig: DashboardConfig = EXPENSES_DASHBOARD_CONFIG;

  constructor(
    private expenseService: ExpenseService,
    private router: Router,
    private toast: ToastService
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


    }
  }

  /** Ouvre dans un nouvel onglet la vue et imprime */
  print(id: string): void {
    const tree = this.router.createUrlTree(['/finance/expenses', id, 'view'], { queryParams: { print: true } });
    const url = window.location.origin + this.router.serializeUrl(tree);
    window.open(url, '_blank');
  }




  private showError(message: string): void {
    this.toast.error(message);
  }
}
