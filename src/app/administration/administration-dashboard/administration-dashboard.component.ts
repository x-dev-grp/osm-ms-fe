import { Component } from '@angular/core';
import { OsmDashboard } from 'src/app/shared/modules/osm-dashboard/osm-dashboard';
import { companyProfileDashboardConfig } from './company-profile-dashboard.config';

@Component({
  selector: 'app-administration-dashboard',
  standalone: true,
  imports: [OsmDashboard],
  templateUrl: './administration-dashboard.component.html',
  styleUrls: ['./administration-dashboard.component.scss']
})
export class AdministrationDashboardComponent {
  companyProfileConfig = companyProfileDashboardConfig;
}
