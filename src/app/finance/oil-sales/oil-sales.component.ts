import { Component, ViewChild } from '@angular/core';

import { CommonModule } from '@angular/common';

import { OilSale } from '../models/oil-sale.model';

import { DashboardConfig } from '../../shared/modules/oosm-dashboard/models/dashboard-config';

import { OIL_SALES_DASHBOARD_CONFIG } from './oil-sales-dashboard.config';

import { OosmDashboard } from '../../shared/modules/oosm-dashboard/oosm-dashboard';

import { OilSaleActionsService } from '../service/oil-sale-actions.service';

@Component({
  selector: 'app-oil-sales',

  standalone: true,

  templateUrl: './oil-sales.component.html',

  imports: [CommonModule, OosmDashboard]
})
export class OilSalesComponent {
  dashboardConfig: DashboardConfig = OIL_SALES_DASHBOARD_CONFIG;

  @ViewChild('dashboard') dashboard!: OosmDashboard;

  constructor(private oilSaleActions: OilSaleActionsService) {}

  handleAction(event: { action: string; row: OilSale }): void {
    this.oilSaleActions.handleAction(event.action, event.row, () => this.dashboard?.refrechData());
  }
}
