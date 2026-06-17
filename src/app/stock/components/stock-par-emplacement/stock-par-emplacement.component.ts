import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { Stock } from '../../models/stock.model';
import { OsmDashboard } from '../../../shared/modules/osm-dashboard/osm-dashboard';
import { DashboardConfig } from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import { STOCK_PAR_EMPLACEMENT_DASHBOARD_CONFIG } from './stock-par-emplacement-dashboard.config';

@Component({
  selector: 'app-stock-par-emplacement',
  standalone: true,
  imports: [TranslateModule, OsmDashboard],
  templateUrl: './stock-par-emplacement.component.html',
  styleUrls: ['./stock-par-emplacement.component.scss']
})
export class StockParEmplacementComponent {
  dashboardConfig: DashboardConfig = STOCK_PAR_EMPLACEMENT_DASHBOARD_CONFIG;

  constructor(private readonly router: Router) {}

  handleAction(event: { row: Stock; action: string }): void {
    if (event.action === 'READ_ARTICLE' && event.row.article?.id) {
      void this.router.navigate(['/stock/articles', event.row.article.id]);
    }
  }
}
