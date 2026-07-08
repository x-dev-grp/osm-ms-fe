import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { OosmDashboard } from 'src/app/shared/modules/oosm-dashboard/oosm-dashboard';
import { SharedModule } from 'src/app/shared/shared.module';
import { companyProfileDashboardConfig } from '../administration-dashboard/company-profile-dashboard.config';

@Component({
  selector: 'app-admin-companies',
  standalone: true,
  imports: [OosmDashboard, SharedModule],
  template: `
    <oosm-dashboard [config]="companyProfileConfig" (applyAction)="handleAction($event)"></oosm-dashboard>
  `
})
export class AdminCompaniesComponent {
  private readonly router = inject(Router);
  companyProfileConfig = companyProfileDashboardConfig;

  handleAction(event: { row: { id?: string }; action: string }): void {
    const tenantId = event.row?.id;
    if (!tenantId) {
      return;
    }

    if (event.action === 'READ') {
      void this.router.navigate(['/administration/companies', tenantId, 'view']);
      return;
    }

    if (event.action === 'ACTIVATE_MODULES') {
      void this.router.navigate(['/administration/companies', tenantId, 'view'], {
        queryParams: { focus: 'modules' }
      });
    }
  }
}
