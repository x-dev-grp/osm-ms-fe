import { Component, DestroyRef, inject, OnInit } from '@angular/core';

import { CommonModule, DatePipe } from '@angular/common';

import { RouterLink } from '@angular/router';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatButtonModule } from '@angular/material/button';

import { MatIconModule } from '@angular/material/icon';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { SharedModule } from 'src/app/shared/shared.module';

import { AdminDashboardService } from '../services/admin-dashboard.service';

import { AdminDashboardStats } from '../models/admin-dashboard-stats.model';

import { AdminSettingsService } from '../admin-settings/services/admin-settings.service';
import { DashboardShellComponent } from '../../shared/components/dashboard/dashboard-shell.component';
import { createKpiSheet, DashboardExportPayload } from '../../shared/components/dashboard/dashboard-export.models';

@Component({
  selector: 'app-administration-dashboard',

  standalone: true,

  imports: [CommonModule, SharedModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule, TranslateModule, DatePipe, DashboardShellComponent],

  templateUrl: './administration-dashboard.component.html',

  styleUrls: ['./administration-dashboard.component.scss']
})
export class AdministrationDashboardComponent implements OnInit {
  private readonly adminDashboardService = inject(AdminDashboardService);
  private readonly adminSettingsService = inject(AdminSettingsService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  stats: AdminDashboardStats | null = null;

  loading = false;

  loadError = false;

  swaggerEnabled = false;

  lastUpdated: Date | null = null;

  maxRoleCount = 0;

  ngOnInit(): void {
    this.adminSettingsService
      .getStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (status) => {
          this.swaggerEnabled = status.features?.['swagger']?.enabled ?? false;
        }
      });

    this.refresh();
  }

  refresh(): void {
    this.loading = true;

    this.loadError = false;

    this.adminDashboardService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;

        this.maxRoleCount = Math.max(...(stats.usersByRole?.map((r) => r.count) ?? [0]), 1);

        this.lastUpdated = new Date();

        this.loading = false;
      },

      error: () => {
        this.loading = false;

        this.loadError = true;
      }
    });
  }

  get exportPayload(): DashboardExportPayload | null {
    if (!this.stats) {
      return null;
    }

    return {
      fileName: 'admin-dashboard',
      title: this.translate.instant('ADMIN_DASHBOARD.TITLE'),
      sheets: [
        createKpiSheet('KPIs', [
          { label: this.translate.instant('ADMIN_DASHBOARD.HERO.TENANTS'), value: this.stats.totalTenants },
          { label: this.translate.instant('ADMIN_DASHBOARD.HERO.ACTIVE'), value: this.stats.activeTenants },
          { label: this.translate.instant('ADMIN_DASHBOARD.HERO.USERS'), value: this.stats.totalUsers },
          { label: this.translate.instant('ADMIN_DASHBOARD.KPIS.NEW_USERS_30D'), value: this.stats.newUsersLast30Days },
          { label: 'Locked users', value: this.stats.lockedUsers },
          { label: 'Users without tenant', value: this.stats.usersWithoutTenant }
        ]),
        {
          name: 'Users by role',
          columns: [
            { key: 'role', label: 'Role' },
            { key: 'count', label: 'Count' }
          ],
          rows: (this.stats.usersByRole ?? []).map((role) => ({
            role: role.roleName,
            count: role.count
          }))
        },
        {
          name: 'Top tenants',
          columns: [
            { key: 'tenant', label: 'Tenant' },
            { key: 'users', label: 'Users' },
            { key: 'active', label: 'Active' }
          ],
          rows: (this.stats.topTenantsByUsers ?? []).map((tenant) => ({
            tenant: tenant.tenantName,
            users: tenant.userCount,
            active: tenant.active ? 'Yes' : 'No'
          }))
        },
        {
          name: 'Recent users',
          columns: [
            { key: 'username', label: 'Username' },
            { key: 'email', label: 'Email' },
            { key: 'role', label: 'Role' },
            { key: 'tenant', label: 'Tenant' },
            { key: 'locked', label: 'Locked' }
          ],
          rows: (this.stats.recentUsers ?? []).map((user) => ({
            username: user.username,
            email: user.email,
            role: user.roleName,
            tenant: user.tenantName,
            locked: user.locked ? 'Yes' : 'No'
          }))
        }
      ].filter((sheet) => sheet.rows.length > 0)
    };
  }

  roleBarWidth(count: number): number {
    if (!this.maxRoleCount) {
      return 0;
    }

    return Math.round((count / this.maxRoleCount) * 100);
  }

  rolePercent(count: number): number {
    if (!this.stats?.totalUsers) {
      return 0;
    }

    return Math.round((count / this.stats.totalUsers) * 100);
  }

  tenantActivePercent(): number {
    if (!this.stats?.totalTenants) {
      return 0;
    }

    return Math.round((this.stats.activeTenants / this.stats.totalTenants) * 100);
  }

  userActivePercent(): number {
    if (!this.stats?.totalUsers) {
      return 0;
    }

    return Math.round((this.stats.activeUsers / this.stats.totalUsers) * 100);
  }
}


