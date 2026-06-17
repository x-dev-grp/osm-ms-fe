import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { Client } from '../../../models/client.model';
import { OsmDashboard } from '../../../../shared/modules/osm-dashboard/osm-dashboard';
import { DashboardConfig } from '../../../../shared/modules/osm-dashboard/models/dashboard-config';
import { CLIENT_DASHBOARD_CONFIG } from './client-dashboard.config';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [TranslateModule, OsmDashboard],
  templateUrl: './client-list.component.html',
  styleUrls: ['./client-list.component.scss']
})
export class ClientListComponent {
  dashboardConfig: DashboardConfig = CLIENT_DASHBOARD_CONFIG;

  constructor(protected readonly router: Router) {}

  handleAction(event: { row: Client; action: string }): void {
    switch (event.action) {
      case 'READ':
        void this.router.navigate(['/stock/clients', event.row.id]);
        break;
      case 'UPDATE':
        void this.router.navigate(['/stock/clients', event.row.id, 'editer']);
        break;
    }
  }
}
