import { Component } from '@angular/core';
import { OosmDashboard } from 'src/app/shared/modules/oosm-dashboard/oosm-dashboard';
import { SharedModule } from 'src/app/shared/shared.module';
import { companyProfileDashboardConfig } from '../administration-dashboard/company-profile-dashboard.config';

@Component({
  selector: 'app-admin-companies',
  standalone: true,
  imports: [OosmDashboard, SharedModule],
  template: `
    <oosm-dashboard [config]="companyProfileConfig"></oosm-dashboard>
  `
})
export class AdminCompaniesComponent {
  companyProfileConfig = companyProfileDashboardConfig;
}
