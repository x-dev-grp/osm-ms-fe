import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { AuthenticationService } from '../auth/services/authentication.service';
import { DashboardShellComponent } from '../shared/components/dashboard/dashboard-shell.component';
import {
  Action,
  ConditioningEntity,
  FinanceEntity,
  InventoryEntity,
  OOSMModule,
  permissionKey,
  ProductionEntity,
  ReceptionEntity
} from '../theme/types/permissions';
import { HomeDashboardService } from './home-dashboard.service';
import { HomeModuleId, HomeModuleSection, HomeQuickLink } from './home-dashboard.models';
import { createKpiSheet, DashboardExportPayload } from '../shared/components/dashboard/dashboard-export.models';

@Component({
  selector: 'app-home-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule, TranslateModule, DashboardShellComponent],
  templateUrl: './home-dashboard.component.html',
  styleUrls: ['./home-dashboard.component.scss']
})
export class HomeDashboardComponent implements OnInit, OnDestroy {
  private auth = inject(AuthenticationService);
  private dashboardService = inject(HomeDashboardService);
  private translate = inject(TranslateService);
  private destroy$ = new Subject<void>();

  loading = true;
  loadError = false;
  lastUpdated: Date | null = null;
  sections: HomeModuleSection[] = [];
  quickLinks: HomeQuickLink[] = [];
  attentionTotal = 0;

  get userDisplayName(): string {
    const user = this.auth.currentUserValue;
    if (!user) {
      return '';
    }
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return fullName || user.username || user.email || '';
  }

  get headerSubtitle(): string {
    if (this.userDisplayName) {
      return this.translate.instant('HOME_DASHBOARD.GREETING_NAMED', { name: this.userDisplayName });
    }
    return this.translate.instant('HOME_DASHBOARD.GREETING');
  }

  get exportPayload(): DashboardExportPayload | null {
    if (!this.sections.length && !this.attentionTotal) {
      return null;
    }

    const kpiSheet = createKpiSheet(this.translate.instant('HOME_DASHBOARD.HERO.ATTENTION'), [
      { label: this.translate.instant('HOME_DASHBOARD.HERO.ATTENTION'), value: this.attentionTotal },
      { label: this.translate.instant('HOME_DASHBOARD.HERO.MODULES'), value: this.sections.length }
    ]);

    const modulesSheet = {
      name: this.translate.instant('HOME_DASHBOARD.SECTIONS.TITLE'),
      columns: [
        { key: 'module', label: this.translate.instant('HOME_DASHBOARD.SECTIONS.TITLE') },
        { key: 'metric', label: 'Metric' },
        { key: 'value', label: 'Value' }
      ],
      rows: this.sections.flatMap((section) =>
        section.metrics.map((metric) => ({
          module: this.translate.instant(section.titleKey),
          metric: this.translate.instant(metric.labelKey),
          value: metric.value
        }))
      )
    };

    return {
      fileName: 'home-dashboard',
      title: this.translate.instant('HOME_DASHBOARD.TITLE'),
      sheets: [kpiSheet, modulesSheet].filter((sheet) => sheet.rows.length > 0)
    };
  }

  ngOnInit(): void {
    this.quickLinks = this.buildQuickLinks();
    this.refresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refresh(): void {
    const visibleIds = this.getVisibleModuleIds();
    this.loading = true;
    this.loadError = false;

    if (!visibleIds.length) {
      this.sections = [];
      this.attentionTotal = 0;
      this.loading = false;
      this.lastUpdated = new Date();

      if (!this.quickLinks.length) {
        this.auth.logout('no-access');
      }
      return;
    }

    this.dashboardService
      .loadSections(visibleIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sections) => {
          this.sections = sections;
          this.attentionTotal = sections.reduce((sum, s) => sum + s.attentionCount, 0);
          this.loading = false;
          this.lastUpdated = new Date();
        },
        error: () => {
          this.loadError = true;
          this.loading = false;
        }
      });
  }

  private getVisibleModuleIds(): HomeModuleId[] {
    const ids: HomeModuleId[] = [];

    if (
      this.auth.hasModule(OOSMModule.RECEPTION) &&
      this.auth.hasPermission(permissionKey(OOSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.READ))
    ) {
      ids.push('reception');
    }

    if (
      this.auth.hasModule(OOSMModule.FINANCE) &&
      this.auth.hasAnyPermission([
        permissionKey(OOSMModule.FINANCE, FinanceEntity.FINANCIALTRANSACTION, Action.READ),
        permissionKey(OOSMModule.FINANCE, FinanceEntity.EXPENSE, Action.READ),
        permissionKey(OOSMModule.FINANCE, FinanceEntity.OILSALE, Action.READ)
      ])
    ) {
      ids.push('finance');
    }

    if (
      this.auth.hasModule(OOSMModule.PRODUCTION) &&
      this.auth.hasAnyPermission([
        permissionKey(OOSMModule.PRODUCTION, ProductionEntity.STORAGEUNIT, Action.READ),
        permissionKey(OOSMModule.PRODUCTION, ProductionEntity.OILTRANSACTION, Action.READ)
      ])
    ) {
      ids.push('storage');
    }

    if (
      this.auth.hasModule(OOSMModule.INVENTAIR) &&
      this.auth.hasPermission(permissionKey(OOSMModule.INVENTAIR, InventoryEntity.STOCKSEC, Action.READ))
    ) {
      ids.push('inventory');
    }

    if (
      this.auth.hasModule(OOSMModule.CONDITIONING) &&
      this.auth.hasAnyPermission([
        permissionKey(OOSMModule.CONDITIONING, ConditioningEntity.OF, Action.READ),
        permissionKey(OOSMModule.CONDITIONING, ConditioningEntity.PROJET, Action.READ)
      ])
    ) {
      ids.push('conditioning');
    }

    return ids;
  }

  private buildQuickLinks(): HomeQuickLink[] {
    const links: HomeQuickLink[] = [];

    if (
      this.auth.hasModule(OOSMModule.RECEPTION) &&
      this.auth.hasPermission(permissionKey(OOSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.READ))
    ) {
      links.push({
        titleKey: 'WELCOME.LINKS.RECEPTION',
        hintKey: 'WELCOME.LINKS.RECEPTION_HINT',
        icon: 'assignment',
        route: '/dashboard/reception',
        accentClass: 'quick-link--reception'
      });
    }

    if (this.auth.hasModule(OOSMModule.FINANCE)) {
      links.push({
        titleKey: 'WELCOME.LINKS.FINANCE',
        hintKey: 'WELCOME.LINKS.FINANCE_HINT',
        icon: 'account_balance_wallet',
        route: '/dashboard/finance',
        accentClass: 'quick-link--finance'
      });
    }

    if (
      this.auth.hasModule(OOSMModule.PRODUCTION) &&
      this.auth.hasPermission(permissionKey(OOSMModule.PRODUCTION, ProductionEntity.STORAGEUNIT, Action.READ))
    ) {
      links.push({
        titleKey: 'MENU.STORAGE.TITLE',
        hintKey: 'HOME_DASHBOARD.QUICK_LINKS.STORAGE_HINT',
        icon: 'water_drop',
        route: '/dashboard/storage',
        accentClass: 'quick-link--storage'
      });
    }

    if (
      this.auth.hasModule(OOSMModule.INVENTAIR) &&
      this.auth.hasPermission(permissionKey(OOSMModule.INVENTAIR, InventoryEntity.STOCKSEC, Action.READ))
    ) {
      links.push({
        titleKey: 'AUTO.STOCKS',
        hintKey: 'HOME_DASHBOARD.QUICK_LINKS.STOCK_HINT',
        icon: 'inventory_2',
        route: '/dashboard/inventory',
        accentClass: 'quick-link--inventory'
      });
    }

    if (this.auth.hasModule(OOSMModule.HABILITATION)) {
      links.push({
        titleKey: 'WELCOME.LINKS.SETTINGS',
        hintKey: 'WELCOME.LINKS.SETTINGS_HINT',
        icon: 'settings',
        route: '/settings',
        accentClass: 'quick-link--settings'
      });
    }

    return links;
  }
}
