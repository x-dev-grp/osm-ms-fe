import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { ExpeditionDto } from '../../../models/expedition.model';
import { OosmDashboard } from '../../../../shared/modules/oosm-dashboard/oosm-dashboard';
import { DashboardConfig } from '../../../../shared/modules/oosm-dashboard/models/dashboard-config';
import { EXPEDITION_DASHBOARD_CONFIG } from './expedition-dashboard.config';

@Component({
  selector: 'app-expedition-list',
  standalone: true,
  imports: [TranslateModule, OosmDashboard],
  templateUrl: './expedition-list.component.html',
  styleUrls: ['./expedition-list.component.scss']
})
export class ExpeditionListComponent {
  dashboardConfig: DashboardConfig = EXPEDITION_DASHBOARD_CONFIG;

  constructor(private readonly router: Router) {}

  handleAction(event: { row: ExpeditionDto; action: string }): void {
    switch (event.action) {
      case 'READ':
        this.onViewDetails(event.row);
        break;
      case 'TRACEABILITY':
        this.onViewTraceability(event.row);
        break;
    }
  }

  private onViewDetails(row: ExpeditionDto): void {
    void this.router.navigate(['/projets/detail', row.projetId, 'expedition'], {
      queryParams: { expeditionId: row.id }
    });
  }

  private onViewTraceability(row: ExpeditionDto): void {
    void this.router.navigate(['/projets/detail', row.projetId, 'expedition'], {
      queryParams: { expeditionId: row.id, traceability: '1' }
    });
  }
}
