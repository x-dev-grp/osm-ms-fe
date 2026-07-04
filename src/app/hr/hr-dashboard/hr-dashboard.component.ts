import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { SharedModule } from '../../shared/shared.module';

interface HrNavItem {
  route: string;
  icon: string;
  titleKey: string;
  subtitleKey: string;
  themeKey: string;
}

@Component({
  selector: 'app-hr-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SharedModule, TranslateModule, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './hr-dashboard.component.html',
  styleUrl: './hr-dashboard.component.scss'
})
export class HrDashboardComponent {
  readonly navItems: HrNavItem[] = [
    { route: '/hr/employees', icon: 'groups', titleKey: 'HR.QUICK_NAV.EMPLOYEES', subtitleKey: 'HR.PAGE.EMPLOYEES.SUBTITLE', themeKey: 'employees' },
    { route: '/hr/postes', icon: 'badge', titleKey: 'HR.QUICK_NAV.POSITIONS', subtitleKey: 'HR.PAGE.POSITIONS.SUBTITLE', themeKey: 'postes' },
    { route: '/hr/contracts', icon: 'description', titleKey: 'HR.QUICK_NAV.CONTRACTS', subtitleKey: 'HR.PAGE.CONTRACTS.SUBTITLE', themeKey: 'contracts' },
    { route: '/hr/pointages', icon: 'schedule', titleKey: 'HR.QUICK_NAV.POINTAGE', subtitleKey: 'HR.PAGE.POINTAGE.SUBTITLE', themeKey: 'pointages' },
    { route: '/hr/leave-requests', icon: 'event_busy', titleKey: 'HR.QUICK_NAV.LEAVE', subtitleKey: 'HR.PAGE.LEAVE.SUBTITLE', themeKey: 'leave' },
    { route: '/hr/payroll-periods', icon: 'calendar_month', titleKey: 'HR.QUICK_NAV.PAYROLL', subtitleKey: 'HR.PAGE.PAYROLL.SUBTITLE', themeKey: 'payroll' },
    { route: '/hr/payslips', icon: 'receipt_long', titleKey: 'HR.PAYSLIPS.LIST_TITLE', subtitleKey: 'HR.PAGE.PAYROLL_FORM.SUBTITLE', themeKey: 'payslips' }
  ];
}
