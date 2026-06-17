import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { OrdreFabrication } from '../../../models/of.model';
import { OsmDashboard } from '../../../../shared/modules/osm-dashboard/osm-dashboard';
import { DashboardConfig } from '../../../../shared/modules/osm-dashboard/models/dashboard-config';
import { OF_DASHBOARD_CONFIG } from './of-dashboard.config';

@Component({
  selector: 'app-of-list',
  standalone: true,
  imports: [TranslateModule, OsmDashboard],
  templateUrl: './of-list.component.html',
  styleUrls: ['./of-list.component.scss']
})
export class OFListComponent {
  @ViewChild('dashboard') dashboard!: OsmDashboard;

  dashboardConfig: DashboardConfig = OF_DASHBOARD_CONFIG;

  constructor(public readonly router: Router) {}

  handleAction(event: { row: OrdreFabrication; action: string }): void {
    const of = event.row;

    switch (event.action) {
      case 'READ':
        this.viewOF(of);
        break;
      case 'UPDATE':
        this.editOF(of);
        break;
      case 'PRODUCTION':
        this.goToProduction(of);
        break;
      case 'QUALITY':
        this.goToQualityControl(of);
        break;
    }
  }

  private viewOF(of: OrdreFabrication): void {
    if (of.id) {
      void this.router.navigate(['/of', of.id]);
    }
  }

  private editOF(of: OrdreFabrication): void {
    if (of.id) {
      void this.router.navigate(['/of/modifier', of.id]);
    }
  }

  private goToProduction(of: OrdreFabrication): void {
    void this.router.navigate(['/of/production'], {
      queryParams: { ofId: of.id, ofCode: of.code }
    });
  }

  private goToQualityControl(of: OrdreFabrication): void {
    void this.router.navigate(['/of/qualite/points'], {
      queryParams: { ofId: of.id, ofCode: of.code }
    });
  }
}
