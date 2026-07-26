import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../../shared/shared.module';
import { DashboardShellComponent } from '../../shared/components/dashboard/dashboard-shell.component';

interface SettingsCard {
  route: string;
  icon: string;
  titleKey: string;
  subtitleKey: string;
}

@Component({
  selector: 'app-hr-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, SharedModule, TranslateModule, MatCardModule, MatIconModule, DashboardShellComponent],
  templateUrl: './hr-settings.component.html',
  styleUrl: './hr-settings.component.scss'
})
export class HrSettingsComponent {
  readonly cards: SettingsCard[] = [
    {
      route: '/hr/legal-rules',
      icon: 'gavel',
      titleKey: 'HR.PAGE.LEGAL_RULES.TITLE',
      subtitleKey: 'HR.PAGE.LEGAL_RULES.SUBTITLE'
    },
    {
      route: '/hr/social-security-configs',
      icon: 'health_and_safety',
      titleKey: 'HR.PAGE.SOCIAL_SECURITY.TITLE',
      subtitleKey: 'HR.PAGE.SOCIAL_SECURITY.SUBTITLE'
    },
    {
      route: '/hr/tax-configurations',
      icon: 'receipt',
      titleKey: 'HR.PAGE.TAX_CONFIG.TITLE',
      subtitleKey: 'HR.PAGE.TAX_CONFIG.SUBTITLE'
    },
    {
      route: '/hr/minimum-wage-rules',
      icon: 'trending_up',
      titleKey: 'HR.PAGE.MINIMUM_WAGE.TITLE',
      subtitleKey: 'HR.PAGE.MINIMUM_WAGE.SUBTITLE'
    },
    {
      route: '/hr/salary-components',
      icon: 'toll',
      titleKey: 'HR.PAGE.SALARY_COMPONENTS.TITLE',
      subtitleKey: 'HR.PAGE.SALARY_COMPONENTS.SUBTITLE'
    },
    {
      route: '/hr/company-legal-profile',
      icon: 'business',
      titleKey: 'HR.PAGE.COMPANY_LEGAL_PROFILE.TITLE',
      subtitleKey: 'HR.PAGE.COMPANY_LEGAL_PROFILE.SUBTITLE'
    }
  ];
}
