// angular import
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// project import
import { SharedModule } from 'src/app/shared/shared.module';
import { EarningChartComponent } from '../../apex-chart/earning-chart/earning-chart.component';
import { RevenueChartComponent } from '../../apex-chart/revenue-chart/revenue-chart.component';
import { ProjectOverviewChartComponent } from '../../apex-chart/project-overview-chart/project-overview-chart.component';
import { TotalIncomeChartComponent } from '../../apex-chart/total-income-chart/total-income-chart.component';
import { CompanyProfileService } from 'src/app/shared/services/company-profile.service';
import { AuthenticationService } from 'src/app/auth/services/authentication.service';
import { Role } from 'src/app/theme/types/role';
import { CompanyProfile } from '../../../../shared/models/CompanyProfile';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-default',
  imports: [TranslateModule, 
    CommonModule,
    SharedModule,
    TotalIncomeChartComponent,
    ProjectOverviewChartComponent,
    EarningChartComponent,
    RevenueChartComponent
  ],
  templateUrl: './default.component.html',
  styleUrls: ['../dashboard.scss', './default.component.scss']
})
export class DefaultComponent implements OnInit {
  // public method
  project = [
    {
      title: 'Invoice Generator'
    },
    {
      title: 'Package Upgrades'
    },
    {
      title: 'Figma Auto Layout'
    },
    {
      title: 'Package Upgrades'
    }
  ];

  List_transaction = [
    {
      icon: 'AI',
      name: 'Apple Inc.',
      time: '#ABLE-PRO-T00232',
      amount: '$210,000',
      amount_position: 'ti ti-arrow-down-left',
      percentage: '10.6%',
      amount_type: 'text-warn-500'
    },
    {
      icon: 'SM',
      tooltip: '10,000 Tracks',
      name: 'Spotify Music',
      time: '#ABLE-PRO-T10232',
      amount: '- 10,000',
      amount_position: 'ti ti-arrow-up-right',
      percentage: '30.6%',
      amount_type: 'text-success-500'
    },
    {
      icon: 'MD',
      bg: 'text-primary-500 bg-primary-50',
      tooltip: '143 Posts',
      name: 'Medium',
      time: '06:30 pm',
      amount: '-26',
      amount_position: 'ti ti-arrows-left-right',
      percentage: '5%',
      amount_type: 'text-warning-500'
    },
    {
      icon: 'U',
      tooltip: '143 Posts',
      name: 'Uber',
      time: '08:40 pm',
      amount: '+210,000',
      amount_position: 'ti ti-arrow-up-right',
      percentage: '10.6%',
      amount_type: 'text-success-500'
    },
    {
      icon: 'OC',
      bg: 'text-warning-500 bg-warning-50',
      tooltip: '143 Posts',
      name: 'Ola Cabs',
      time: '07:40 pm',
      amount: '+210,000',
      amount_position: 'ti ti-arrow-up-right',
      percentage: '10.6%',
      amount_type: 'text-success-500'
    }
  ];
  private profile: CompanyProfile;

  constructor(
    private companyProfileService: CompanyProfileService,
    private authService: AuthenticationService
  ) {}

  ngOnInit(): void {
    this.fetchCompanyProfile();
  }

  private fetchCompanyProfile(): void {
    const currentUser = this.authService.currentUserValue;

    // Only fetch company profile for non-OsmAdmin users who have a tenantId
    if (currentUser && currentUser.role !== Role.OsmAdmin && currentUser.tenantId) {
      console.log('[DefaultComponent] Fetching company profile for tenantId:', currentUser.tenantId);

      this.companyProfileService.getProfile().subscribe({
        next:  p => { this.profile =  p;   },
        error: () => { console.log ('Unable to load profile');   }
      });
    } else {
      console.log('[DefaultComponent] Skipping company profile fetch - user is OsmAdmin or has no tenantId');
    }
  }
}
