import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { AuthenticationService } from '../auth/services/authentication.service';
import { HomeDashboardComponent } from '../home-dashboard/home-dashboard.component';
import { ReceptionDashboardComponent } from '../reception/reception-dashboard/reception-dashboard.component';
import { FinanceDashboardComponent } from '../finance/finance-dashboard/finance-dashboard.component';
import { StorageUnitsBoardComponent } from '../storage/storage-units-board/storage-units-board.component';
import { StockDashboardComponent } from '../stock/components/dashboard/stock-dashboard/stock-dashboard.component';
import { HrDashboardComponent } from '../hr/hr-dashboard/hr-dashboard.component';
import { RapportGlobalOFComponent } from '../analytics/components/Rapport-Global-OF/Rapport-Global-OF.component';
import { AdministrationDashboardComponent } from '../administration/administration-dashboard/administration-dashboard.component';
import { DashboardHubService } from './dashboard-hub.service';
import { DashboardTabDefinition, DashboardTabId } from './dashboard-hub.models';

@Component({
  selector: 'app-dashboard-hub',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslateModule,
    HomeDashboardComponent,
    ReceptionDashboardComponent,
    FinanceDashboardComponent,
    StorageUnitsBoardComponent,
    StockDashboardComponent,
    HrDashboardComponent,
    RapportGlobalOFComponent,
    AdministrationDashboardComponent
  ],
  templateUrl: './dashboard-hub.component.html',
  styleUrl: './dashboard-hub.component.scss'
})
export class DashboardHubComponent implements OnInit, OnDestroy {
  private readonly hubService = inject(DashboardHubService);
  private readonly auth = inject(AuthenticationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  visibleTabs: DashboardTabDefinition[] = [];
  activeTabId: DashboardTabId | null = null;
  loadedTabs = new Set<DashboardTabId>();

  ngOnInit(): void {
    this.refreshTabs(this.readTabFromRoute());

    this.auth.permissionsChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.refreshTabs(this.activeTabId);
    });

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const tabFromRoute = this.readTabFromRoute();
      if (tabFromRoute && tabFromRoute !== this.activeTabId) {
        this.selectTab(tabFromRoute, false);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectTab(tabId: DashboardTabId, syncRoute = true): void {
    if (!this.visibleTabs.some((tab) => tab.id === tabId)) {
      return;
    }
    this.activeTabId = tabId;
    this.loadedTabs.add(tabId);

    if (syncRoute) {
      void this.router.navigate(['/dashboard', tabId]);
    }
  }

  private refreshTabs(preferredTab: DashboardTabId | null): void {
    this.visibleTabs = this.hubService.getVisibleTabs();

    if (!this.visibleTabs.length) {
      this.activeTabId = null;
      this.loadedTabs.clear();
      return;
    }

    const fallback = this.visibleTabs[0].id;
    const nextTab =
      preferredTab && this.visibleTabs.some((tab) => tab.id === preferredTab) ? preferredTab : fallback;

    this.activeTabId = nextTab;
    this.loadedTabs.add(nextTab);

    if (!this.readTabFromRoute()) {
      void this.router.navigate(['/dashboard', nextTab], { replaceUrl: true });
    }
  }

  private readTabFromRoute(): DashboardTabId | null {
    const tabId = this.route.snapshot.paramMap.get('tabId');
    return this.hubService.isKnownTab(tabId) ? tabId : null;
  }
}
