import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { SharedModule } from '../../shared/shared.module';
import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';
import {MAINTENANCE_DASHBOARD_CONFIG} from "../maintenance-dashboard.config";
import {MaintenanceWorkOrder} from "../models/maintenance-work-order.model";


@Component({
  selector: 'app-maintenance-list',
  standalone: true,
  imports: [CommonModule, SharedModule, OsmDashboard, TranslateModule, MatButtonModule, MatIconModule],
  templateUrl: './maintenance-list.component.html',
  styleUrl: './maintenance-list.component.scss'
})
export class MaintenanceListComponent {
  readonly dashboardConfig = MAINTENANCE_DASHBOARD_CONFIG;

  constructor(private router: Router) {}

  onRowAction(event: { row: MaintenanceWorkOrder; action: string }): void {
    const id = event.row?.id;
    if (!id) {
      return;
    }

    switch (event.action) {
      case 'READ':
        this.router.navigate(['/maintenance', id, 'view']);
        break;
      case 'UPDATE':
        this.router.navigate(['/maintenance', id, 'edit']);
        break;
    }
  }
}
