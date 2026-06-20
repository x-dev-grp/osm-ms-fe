import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { AuthenticationService } from '../auth/services/authentication.service';
import {
  Action,
  ConditioningEntity,
  FinanceEntity,
  HREntity,
  InventoryEntity,
  OSMModule,
  permissionKey,
  ProductionEntity,
  ReceptionEntity
} from '../theme/types/permissions';
import { HomeDashboardService } from './home-dashboard.service';
import { HomeModuleId, HomeModuleSection, HomeQuickLink } from './home-dashboard.models';

@Component({
  selector: 'app-home-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule, TranslateModule],
  templateUrl: './home-dashboard.component.html',
  styleUrls: ['./home-dashboard.component.scss']
})
export class HomeDashboardComponent implements OnInit, OnDestroy {
  private auth = inject(AuthenticationService);
  private dashboardService = inject(HomeDashboardService);
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
      this.auth.hasModule(OSMModule.RECEPTION) &&
      this.auth.hasPermission(permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.READ))
    ) {
      ids.push('reception');
    }

    if (
      this.auth.hasModule(OSMModule.FINANCE) &&
      this.auth.hasAnyPermission([
        permissionKey(OSMModule.FINANCE, FinanceEntity.FINANCIALTRANSACTION, Action.READ),
        permissionKey(OSMModule.FINANCE, FinanceEntity.EXPENSE, Action.READ),
        permissionKey(OSMModule.FINANCE, FinanceEntity.OILSALE, Action.READ)
      ])
    ) {
      ids.push('finance');
    }

    if (
      this.auth.hasModule(OSMModule.PRODUCTION) &&
      this.auth.hasAnyPermission([
        permissionKey(OSMModule.PRODUCTION, ProductionEntity.STORAGEUNIT, Action.READ),
        permissionKey(OSMModule.PRODUCTION, ProductionEntity.OILTRANSACTION, Action.READ)
      ])
    ) {
      ids.push('storage');
    }

    if (
      this.auth.hasModule(OSMModule.INVENTAIR) &&
      this.auth.hasPermission(permissionKey(OSMModule.INVENTAIR, InventoryEntity.STOCKSEC, Action.READ))
    ) {
      ids.push('inventory');
    }

    if (
      this.auth.hasModule(OSMModule.CONDITIONING) &&
      this.auth.hasAnyPermission([
        permissionKey(OSMModule.CONDITIONING, ConditioningEntity.OF, Action.READ),
        permissionKey(OSMModule.CONDITIONING, ConditioningEntity.PROJET, Action.READ)
      ])
    ) {
      ids.push('conditioning');
    }

    if (this.auth.hasModule(OSMModule.HR) && this.auth.hasPermission(permissionKey(OSMModule.HR, HREntity.EMPLOYEE, Action.READ))) {
      ids.push('hr');
    }

    return ids;
  }

  private buildQuickLinks(): HomeQuickLink[] {
    const links: HomeQuickLink[] = [];

    if (
      this.auth.hasModule(OSMModule.RECEPTION) &&
      this.auth.hasPermission(permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.READ))
    ) {
      links.push({
        titleKey: 'WELCOME.LINKS.RECEPTION',
        hintKey: 'WELCOME.LINKS.RECEPTION_HINT',
        icon: 'assignment',
        route: '/reception',
        accentClass: 'quick-link--reception'
      });
    }

    if (this.auth.hasModule(OSMModule.FINANCE)) {
      links.push({
        titleKey: 'WELCOME.LINKS.FINANCE',
        hintKey: 'WELCOME.LINKS.FINANCE_HINT',
        icon: 'account_balance_wallet',
        route: '/finance/dashboard',
        accentClass: 'quick-link--finance'
      });
    }

    if (
      this.auth.hasModule(OSMModule.PRODUCTION) &&
      this.auth.hasPermission(permissionKey(OSMModule.PRODUCTION, ProductionEntity.STORAGEUNIT, Action.READ))
    ) {
      links.push({
        titleKey: 'MENU.STORAGE.TITLE',
        hintKey: 'HOME_DASHBOARD.QUICK_LINKS.STORAGE_HINT',
        icon: 'water_drop',
        route: '/storage/storage_recap',
        accentClass: 'quick-link--storage'
      });
    }

    if (
      this.auth.hasModule(OSMModule.INVENTAIR) &&
      this.auth.hasPermission(permissionKey(OSMModule.INVENTAIR, InventoryEntity.STOCKSEC, Action.READ))
    ) {
      links.push({
        titleKey: 'AUTO.STOCKS',
        hintKey: 'HOME_DASHBOARD.QUICK_LINKS.STOCK_HINT',
        icon: 'inventory_2',
        route: '/stock/dashboard',
        accentClass: 'quick-link--inventory'
      });
    }

    if (this.auth.hasModule(OSMModule.HABILITATION)) {
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
