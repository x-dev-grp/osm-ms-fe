import { Component, DestroyRef, inject, OnInit } from '@angular/core';

import { CommonModule, DatePipe } from '@angular/common';

import { RouterLink } from '@angular/router';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatButtonModule } from '@angular/material/button';

import { MatIconModule } from '@angular/material/icon';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TranslateModule } from '@ngx-translate/core';

import { SharedModule } from 'src/app/shared/shared.module';

import { AdminDashboardService } from '../services/admin-dashboard.service';

import { AdminDashboardStats } from '../models/admin-dashboard-stats.model';

import { AdminSettingsService } from '../admin-settings/services/admin-settings.service';

@Component({
  selector: 'app-administration-dashboard',

  standalone: true,

  imports: [CommonModule, SharedModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule, TranslateModule, DatePipe],

  templateUrl: './administration-dashboard.component.html',

  styleUrls: ['./administration-dashboard.component.scss']
})
export class AdministrationDashboardComponent implements OnInit {
  private readonly adminDashboardService = inject(AdminDashboardService);
  private readonly adminSettingsService = inject(AdminSettingsService);
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


