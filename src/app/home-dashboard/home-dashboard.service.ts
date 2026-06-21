import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of } from 'rxjs';
import { catchError, defaultIfEmpty } from 'rxjs/operators';
import { AdvancedSearchService } from '../shared/services/advanced-serach.service';
import { SearchData } from '../shared/models/advanced-search/searchData';
import { SearchOperation } from '../shared/models/advanced-search/searchOperation';
import { SearchResponse } from '../shared/models/advanced-search/searchResponse';
import { StatistiqueService } from '../stock/services/statistique.service';
import { HomeMetric, HomeModuleId, HomeModuleSection } from './home-dashboard.models';

@Injectable({ providedIn: 'root' })
export class HomeDashboardService {
  private search = inject(AdvancedSearchService);
  private stockStats = inject(StatistiqueService);

  loadSections(moduleIds: HomeModuleId[]): Observable<HomeModuleSection[]> {
    const loaders: Partial<Record<HomeModuleId, Observable<HomeMetric[]>>> = {
      reception: this.loadReceptionMetrics(),
      finance: this.loadFinanceMetrics(),
      storage: this.loadStorageMetrics(),
      inventory: this.loadInventoryMetrics(),
      conditioning: this.loadConditioningMetrics(),
      hr: this.loadHrMetrics()
    };

    const requests = moduleIds.map((id) =>
      (loaders[id] ?? of([])).pipe(
        map((metrics) => this.buildSection(id, metrics)),
        catchError(() => of(this.buildSection(id, [], true)))
      )
    );

    if (!requests.length) {
      return of([]);
    }

    return forkJoin(requests);
  }

  private buildSection(id: HomeModuleId, metrics: HomeMetric[], error = false): HomeModuleSection {
    const meta = MODULE_META[id];
    const attentionCount = metrics.filter((m) => m.attention && Number(m.value) > 0).reduce((s, m) => s + Number(m.value), 0);
    return {
      id,
      ...meta,
      metrics,
      attentionCount,
      visible: true,
      loading: false,
      error
    };
  }

  private count(endpoint: string, search: Record<string, unknown> = {}): Observable<number> {
    const searchData: SearchData = {
      page: 0,
      size: 1,
      sort: 'createdDate',
      order: 'DESC',
      searchData: {
        operation: SearchOperation.AND,
        search: {
          isDeleted: { equalValue: false },
          ...search
        }
      }
    };

    return this.search.search(searchData, endpoint).pipe(
      map((res: SearchResponse) => Number(res?.total ?? 0)),
      catchError(() => of(0)),
      defaultIfEmpty(0)
    );
  }

  private loadReceptionMetrics(): Observable<HomeMetric[]> {
    return forkJoin({
      inProgress: this.count('production/deliveries', { status: { inValues: ['IN_PROGRESS'] } }),
      awaiting: this.count('production/deliveries', { status: { inValues: ['WAITING', 'NEW'] } }),
      unpaid: this.count('production/deliveries', { paid: { equalValue: false } })
    }).pipe(
      map(({ inProgress, awaiting, unpaid }) => [
        { labelKey: 'HOME_DASHBOARD.METRICS.IN_PROGRESS', value: inProgress, attention: true },
        { labelKey: 'HOME_DASHBOARD.METRICS.AWAITING_ACTION', value: awaiting, attention: true },
        { labelKey: 'HOME_DASHBOARD.METRICS.UNPAID', value: unpaid, attention: true }
      ])
    );
  }

  private loadFinanceMetrics(): Observable<HomeMetric[]> {
    return forkJoin({
      pendingExpenses: this.count('finance/expense', { status: { inValues: ['PENDING'] } }),
      transactions: this.count('finance/transactions'),
      pendingSales: this.count('production/oil_sale', { status: { inValues: ['PENDING'] } })
    }).pipe(
      map(({ pendingExpenses, transactions, pendingSales }) => [
        { labelKey: 'HOME_DASHBOARD.METRICS.PENDING_EXPENSES', value: pendingExpenses, attention: true },
        { labelKey: 'HOME_DASHBOARD.METRICS.TRANSACTIONS', value: transactions },
        { labelKey: 'HOME_DASHBOARD.METRICS.PENDING_OIL_SALES', value: pendingSales, attention: true }
      ])
    );
  }

  private loadStorageMetrics(): Observable<HomeMetric[]> {
    return forkJoin({
      pendingTx: this.count('production/oil_transaction', { transactionState: { inValues: ['PENDING'] } }),
      tanks: this.count('production/storage-units')
    }).pipe(
      map(({ pendingTx, tanks }) => [
        { labelKey: 'HOME_DASHBOARD.METRICS.PENDING_OIL_TX', value: pendingTx, attention: true },
        { labelKey: 'HOME_DASHBOARD.METRICS.STORAGE_UNITS', value: tanks }
      ])
    );
  }

  private loadInventoryMetrics(): Observable<HomeMetric[]> {
    return this.stockStats.getDashboardPayload(5).pipe(
      map((payload) => {
        const stats = payload.statistiques;
        return [
          {
            labelKey: 'HOME_DASHBOARD.METRICS.CRITICAL_ARTICLES',
            value: stats?.articlesEnAlerte ?? 0,
            attention: true
          },
          {
            labelKey: 'HOME_DASHBOARD.METRICS.PENDING_PURCHASE_ORDERS',
            value: stats?.bonsEnAttente ?? 0,
            attention: true
          },
          { labelKey: 'HOME_DASHBOARD.METRICS.TOTAL_ARTICLES', value: stats?.totalArticles ?? 0 }
        ];
      }),
      catchError(() =>
        of([
          { labelKey: 'HOME_DASHBOARD.METRICS.CRITICAL_ARTICLES', value: 0, attention: true },
          { labelKey: 'HOME_DASHBOARD.METRICS.PENDING_PURCHASE_ORDERS', value: 0, attention: true },
          { labelKey: 'HOME_DASHBOARD.METRICS.TOTAL_ARTICLES', value: 0 }
        ])
      ),
      defaultIfEmpty([
        { labelKey: 'HOME_DASHBOARD.METRICS.CRITICAL_ARTICLES', value: 0, attention: true },
        { labelKey: 'HOME_DASHBOARD.METRICS.PENDING_PURCHASE_ORDERS', value: 0, attention: true },
        { labelKey: 'HOME_DASHBOARD.METRICS.TOTAL_ARTICLES', value: 0 }
      ])
    );
  }

  private loadConditioningMetrics(): Observable<HomeMetric[]> {
    return forkJoin({
      orders: this.count('ordreConditionement/of'),
      projects: this.count('ordreConditionement/projets')
    }).pipe(
      map(({ orders, projects }) => [
        { labelKey: 'HOME_DASHBOARD.METRICS.PRODUCTION_ORDERS', value: orders },
        { labelKey: 'HOME_DASHBOARD.METRICS.PROJECTS', value: projects }
      ]),
      catchError(() =>
        forkJoin({
          orders: this.count('ordreConditionement/of')
        }).pipe(map(({ orders }) => [{ labelKey: 'HOME_DASHBOARD.METRICS.PRODUCTION_ORDERS', value: orders }]))
      )
    );
  }

  private loadHrMetrics(): Observable<HomeMetric[]> {
    return this.count('hr/employee').pipe(map((employees) => [{ labelKey: 'HOME_DASHBOARD.METRICS.EMPLOYEES', value: employees }]));
  }
}

const MODULE_META: Record<
  HomeModuleId,
  Pick<HomeModuleSection, 'titleKey' | 'subtitleKey' | 'icon' | 'accentClass' | 'route'>
> = {
  reception: {
    titleKey: 'HOME_DASHBOARD.SECTIONS.RECEPTION.TITLE',
    subtitleKey: 'HOME_DASHBOARD.SECTIONS.RECEPTION.SUBTITLE',
    icon: 'assignment',
    accentClass: 'module-card--reception',
    route: '/reception'
  },
  finance: {
    titleKey: 'HOME_DASHBOARD.SECTIONS.FINANCE.TITLE',
    subtitleKey: 'HOME_DASHBOARD.SECTIONS.FINANCE.SUBTITLE',
    icon: 'account_balance_wallet',
    accentClass: 'module-card--finance',
    route: '/finance/dashboard'
  },
  storage: {
    titleKey: 'HOME_DASHBOARD.SECTIONS.STORAGE.TITLE',
    subtitleKey: 'HOME_DASHBOARD.SECTIONS.STORAGE.SUBTITLE',
    icon: 'water_drop',
    accentClass: 'module-card--storage',
    route: '/storage/storage_recap'
  },
  inventory: {
    titleKey: 'HOME_DASHBOARD.SECTIONS.INVENTORY.TITLE',
    subtitleKey: 'HOME_DASHBOARD.SECTIONS.INVENTORY.SUBTITLE',
    icon: 'inventory_2',
    accentClass: 'module-card--inventory',
    route: '/stock/dashboard'
  },
  conditioning: {
    titleKey: 'HOME_DASHBOARD.SECTIONS.CONDITIONING.TITLE',
    subtitleKey: 'HOME_DASHBOARD.SECTIONS.CONDITIONING.SUBTITLE',
    icon: 'precision_manufacturing',
    accentClass: 'module-card--conditioning',
    route: '/of'
  },
  hr: {
    titleKey: 'HOME_DASHBOARD.SECTIONS.HR.TITLE',
    subtitleKey: 'HOME_DASHBOARD.SECTIONS.HR.SUBTITLE',
    icon: 'groups',
    accentClass: 'module-card--hr',
    route: '/hr'
  }
};
