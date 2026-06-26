import { Component, inject, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { OosmDashboard } from '../../../../shared/modules/oosm-dashboard/oosm-dashboard';
import { DashboardConfig } from '../../../../shared/modules/oosm-dashboard/models/dashboard-config';
import { MOUVEMENT_DASHBOARD_CONFIG } from './mouvement-dashboard.config';
import { MouvementStock } from '../../../models/mouvement-stock.model';

@Component({
  selector: 'app-mouvement-list',
  standalone: true,
  imports: [TranslateModule, OosmDashboard],
  templateUrl: './mouvement-list.component.html',
  styleUrls: ['./mouvement-list.component.scss']
})
export class MouvementListComponent {
  dashboardConfig: DashboardConfig = MOUVEMENT_DASHBOARD_CONFIG;

  @ViewChild('dashboard') dashboard!: OosmDashboard;

  private readonly router = inject(Router);

  handleAction(event: { row: MouvementStock & { id?: string }; action: string }): void {
    const action = event.action?.toUpperCase();
    const id = event.row?.id;

    if (action === 'READ' && id) {
      void this.router.navigate(['/stock/mouvements', id]);
    }
  }
}
