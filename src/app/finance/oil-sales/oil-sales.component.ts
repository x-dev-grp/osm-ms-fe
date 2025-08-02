import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { OilSaleService } from '../service/oil-sale.service';
import { CustomerService } from '../service/customer.service';
import { OilSale, OilSaleStatus } from '../models/oil-sale.model';
import { Customer } from '../models/Customer';
import { Currency, PaymentMethod } from '../models/financial-transaction.model';
import { Action, DashboardConfig } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { OIL_SALES_DASHBOARD_CONFIG } from './oil-sales-dashboard.config';
import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';

@Component({
  selector: 'app-oil-sales',
  standalone: true,
  templateUrl: './oil-sales.component.html',
  imports: [
    CommonModule,
    OsmDashboard
  ]
})
export class OilSalesComponent implements OnInit {
  dashboardConfig: DashboardConfig = OIL_SALES_DASHBOARD_CONFIG;

  constructor(
    private oilSaleService: OilSaleService,
    private customerService: CustomerService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Component initialization
  }

  handleAction(event: { action: string; row: OilSale }): void {
    switch (event.action.toUpperCase()) {
      case 'READ':
        this.router.navigate(['/finance/oil-sales', event.row.id, 'view']);
        break;

      case 'UPDATE':
        this.router.navigate(['/finance/oil-sales', event.row.id, 'edit']);
        break;

      case 'CONFIRM':
        this.confirmOilSale(event.row);
        break;

      case 'CANCEL':
        this.cancelOilSale(event.row);
        break;

      case 'DELIVER':
        this.deliverOilSale(event.row);
        break;
    }
  }


  private confirmOilSale(oilSale: OilSale): void {
    if (oilSale.id) {
      this.oilSaleService.confirmOilSale(oilSale.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Oil sale confirmed successfully', 'Close', { duration: 3000 });
          } else {
            this.snackBar.open(response.message || 'Error confirming oil sale', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error confirming oil sale:', error);
          this.snackBar.open('Error confirming oil sale', 'Close', { duration: 3000 });
        }
      });
    }
  }

  private cancelOilSale(oilSale: OilSale): void {
    if (oilSale.id) {
      this.oilSaleService.cancelOilSale(oilSale.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Oil sale cancelled successfully', 'Close', { duration: 3000 });
          } else {
            this.snackBar.open(response.message || 'Error cancelling oil sale', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error cancelling oil sale:', error);
          this.snackBar.open('Error cancelling oil sale', 'Close', { duration: 3000 });
        }
      });
    }
  }

  private deliverOilSale(oilSale: OilSale): void {
    if (oilSale.id) {
      this.oilSaleService.deliverOilSale(oilSale.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Oil sale delivered successfully', 'Close', { duration: 3000 });
          } else {
            this.snackBar.open(response.message || 'Error delivering oil sale', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error delivering oil sale:', error);
          this.snackBar.open('Error delivering oil sale', 'Close', { duration: 3000 });
        }
      });
    }
  }
}
