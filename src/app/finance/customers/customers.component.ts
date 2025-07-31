import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Customer } from '../models/Customer';
import { CustomerService } from '../service/customer.service';
import { Action, DashboardConfig } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { CUSTOMERS_DASHBOARD_CONFIG } from './customers-dashboard.config';
import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';
import { Router } from '@angular/router';
import { SharedModule } from '../../demo/shared/shared.module';

@Component({
  selector: 'app-customers',
  standalone: true,
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss'],
  imports: [
    OsmDashboard,SharedModule
  ]
})
export class CustomersComponent implements OnInit {
  dashboardConfig: DashboardConfig = CUSTOMERS_DASHBOARD_CONFIG;

  constructor(
    private snackBar: MatSnackBar,
    private customerService: CustomerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Component initialization
  }

  handleAction(event: { action: string; row: Customer }): void {
    switch (event.action.toUpperCase()) {
      case 'READ':
        this.router.navigate(['/finance/customers', event.row.id, 'view']);
        break;

      case 'EDIT':
        this.router.navigate(['/finance/customers', event.row.id, 'edit']);
        break;

      case 'DELETE':
        this.deleteCustomer(event.row);
        break;
    }
  }

  private deleteCustomer(customer: Customer): void {
    if (confirm('Are you sure you want to delete this customer?')) {
      this.customerService.deleteCustomer(customer.id!).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Customer deleted successfully', 'Close', { duration: 3000 });
            // The dashboard will automatically refresh
          } else {
            this.snackBar.open(response.message || 'Failed to delete customer', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error deleting customer:', error);
          this.snackBar.open('Error deleting customer', 'Close', { duration: 3000 });
        }
      });
    }
  }
}
