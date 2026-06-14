import { Component } from '@angular/core';
import { OsmDashboard } from 'src/app/shared/modules/osm-dashboard/osm-dashboard';
import { SharedModule } from 'src/app/shared/shared.module';
import { companyProfileDashboardConfig } from '../administration-dashboard/company-profile-dashboard.config';

@Component({
  selector: 'app-admin-companies',
  standalone: true,
  imports: [OsmDashboard, SharedModule],
  template: `<osm-dashboard [config]="companyProfileConfig"></osm-dashboard>`
})
export class AdminCompaniesComponent {
  companyProfileConfig = companyProfileDashboardConfig;
}
