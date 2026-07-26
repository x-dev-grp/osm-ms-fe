import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { SharedModule } from '../../shared/shared.module';
import { DashboardShellComponent } from '../../shared/components/dashboard/dashboard-shell.component';
import { DashboardExportPayload } from '../../shared/components/dashboard/dashboard-export.models';
import { HrDashboardStats, HrOpsService } from '../services/hr-ops.service';

interface HrNavItem {
  route: string;
  icon: string;
  titleKey: string;
  subtitleKey: string;
  themeKey: string;
}

interface HrKpiCard {
  labelKey: string;
  value: string | number;
  icon: string;
}

@Component({
  selector: 'app-hr-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SharedModule, TranslateModule, MatButtonModule, MatCardModule, MatIconModule, DashboardShellComponent],
  templateUrl: './hr-dashboard.component.html',
  styleUrl: './hr-dashboard.component.scss'
})
export class HrDashboardComponent implements OnInit {
  private readonly translate = inject(TranslateService);
  private readonly ops = inject(HrOpsService);
  private readonly destroyRef = inject(DestroyRef);

  loading = false;
  stats: HrDashboardStats | null = null;

  ngOnInit(): void {
    this.refreshStats();
  }

  refreshStats(): void {
    this.loading = true;
    this.ops
      .getDashboardStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.stats = response?.data ?? null;
        },
        error: () => {
          this.loading = false;
          this.stats = null;
        }
      });
  }

  get kpiCards(): HrKpiCard[] {
    const s = this.stats;
    return [
      { labelKey: 'HR.DASHBOARD.KPI.TOTAL_EMPLOYEES', value: s?.totalEmployees ?? '—', icon: 'groups' },
      { labelKey: 'HR.DASHBOARD.KPI.ACTIVE_EMPLOYEES', value: s?.activeEmployees ?? '—', icon: 'how_to_reg' },
      { labelKey: 'HR.DASHBOARD.KPI.ON_LEAVE', value: s?.onLeave ?? '—', icon: 'beach_access' },
      { labelKey: 'HR.DASHBOARD.KPI.PENDING_LEAVES', value: s?.pendingLeaveRequests ?? '—', icon: 'event_busy' },
      { labelKey: 'HR.DASHBOARD.KPI.COMPLIANCE_SCORE', value: s?.complianceScore ?? '—', icon: 'verified_user' },
      { labelKey: 'HR.DASHBOARD.KPI.CONTRACTS_EXPIRING', value: s?.contractsExpiringSoon ?? '—', icon: 'description' }
    ];
  }

  get exportPayload(): DashboardExportPayload {
    return {
      fileName: 'hr-dashboard',
      title: this.translate.instant('HR.DASHBOARD.TITLE'),
      sheets: [
        {
          name: this.translate.instant('HR.DASHBOARD.TITLE'),
          columns: [
            { key: 'module', label: 'Module' },
            { key: 'description', label: 'Description' },
            { key: 'route', label: 'Route' }
          ],
          rows: this.navItems.map((item) => ({
            module: this.translate.instant(item.titleKey),
            description: this.translate.instant(item.subtitleKey),
            route: item.route
          }))
        }
      ]
    };
  }

  readonly navItems: HrNavItem[] = [
    { route: '/hr/employees', icon: 'groups', titleKey: 'HR.QUICK_NAV.EMPLOYEES', subtitleKey: 'HR.PAGE.EMPLOYEES.SUBTITLE', themeKey: 'employees' },
    { route: '/hr/departments', icon: 'account_tree', titleKey: 'HR.QUICK_NAV.DEPARTMENTS', subtitleKey: 'HR.PAGE.DEPARTMENTS.SUBTITLE', themeKey: 'departments' },
    { route: '/hr/contracts', icon: 'description', titleKey: 'HR.QUICK_NAV.CONTRACTS', subtitleKey: 'HR.PAGE.CONTRACTS.SUBTITLE', themeKey: 'contracts' },
    { route: '/hr/timesheets', icon: 'pending_actions', titleKey: 'HR.QUICK_NAV.TIMESHEETS', subtitleKey: 'HR.PAGE.TIMESHEETS.SUBTITLE', themeKey: 'timesheets' },
    { route: '/hr/leave-requests', icon: 'event_busy', titleKey: 'HR.QUICK_NAV.LEAVE', subtitleKey: 'HR.PAGE.LEAVE.SUBTITLE', themeKey: 'leave' },
    { route: '/hr/payroll-periods', icon: 'calendar_month', titleKey: 'HR.QUICK_NAV.PAYROLL', subtitleKey: 'HR.PAGE.PAYROLL.SUBTITLE', themeKey: 'payroll' },
    { route: '/hr/settings', icon: 'settings', titleKey: 'HR.QUICK_NAV.SETTINGS', subtitleKey: 'HR.PAGE.SETTINGS.SUBTITLE', themeKey: 'settings' },
    { route: '/hr/compliance', icon: 'verified_user', titleKey: 'HR.QUICK_NAV.COMPLIANCE', subtitleKey: 'HR.PAGE.COMPLIANCE.SUBTITLE', themeKey: 'compliance' },
    { route: '/hr/agent', icon: 'smart_toy', titleKey: 'HR.QUICK_NAV.AGENT', subtitleKey: 'HR.PAGE.AGENT.SUBTITLE', themeKey: 'agent' }
  ];
}
