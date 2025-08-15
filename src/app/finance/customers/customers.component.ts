import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Customer } from '../models/Customer';
import { CustomerService } from '../service/customer.service';
import { Action, DashboardConfig } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { CUSTOMERS_DASHBOARD_CONFIG } from './customers-dashboard.config';
import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';
import { Router } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

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

/*******************    💫 Codegeex Suggestion    *******************/
  /**
   * Constructor for the class.
   * @param snackBar - Instance of MatSnackBar for displaying snack bar messages.
   * @param customerService - Instance of CustomerService for handling customer-related operations.
   * @param router - Instance of Router for navigation purposes.
   */
  constructor(
    private snackBar: MatSnackBar,
    private customerService: CustomerService,
    private router: Router
  ) {}
/****************  1344f9c59c534f0b9de0563c492a38e3  ****************/

  ngOnInit(): void {
    // Component initialization
  }

  handleAction(event: { action: string; row: Customer }): void {
    switch (event.action.toUpperCase()) {
      case 'READ':
       // this.router.navigate(['/finance/customers', event.row.id, 'view']);
        this.router.navigate([`/finance/customers/${event.row.id}/details`]);
        break;

      case 'UPDATE':
        this.router.navigate(['/finance/customers', event.row.id, 'edit']);
        break;
    }
  }
}
