import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { UnifiedDelivery } from '../../../shared/models/UnifiedDelivery';
import { StorageUnitDto } from '../../../shared/models/StorageUnitDto';
import { SupplierType } from '../../../shared/models/supplier-type';
import { OliveLotStatus } from '../../../shared/models/OliveLotStatus';
import { UnifiedDeliveryService } from '../../../shared/services/delivery.service';
import { SupplierTypeService } from '../../../shared/services/supplier.service';
import { StorageUnitDtoService } from '../../../shared/services/storage.service';
import { CardComponent } from '../../../theme/components/card/card.component';
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';
import { SharedModule } from 'src/app/shared/shared.module';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EarningChartComponent } from '../../../theme/pages/apex-chart/earning-chart/earning-chart.component';

// import { EarningChartComponent } from '../../../theme/pages/apex-chart/earning-chart/earning-chart.component';

 type TrendGranularity = 'daily' | 'weekly' | 'monthly' | 'yearly';
 @Component({
  selector: 'app-reception-dashboard',
  templateUrl: './reception-dashboard.component.html',
  styleUrls: ['./reception-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressBarModule,
    MatTabsModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    RouterModule,
    EarningChartComponent,
    CardComponent,
    NgApexchartsModule,
    SharedModule,
    TranslateModule
  ]
})

export class ReceptionDashboardComponent implements OnInit, OnDestroy {
  isLoading = true;
  error: string | null = null;
  destroy$ = new Subject<void>();

  // Raw data vs filtered
  private allReceptions: UnifiedDelivery[] = [];
  receptions: UnifiedDelivery[] = [];
  suppliers: SupplierType[] = [];
  storageUnits: StorageUnitDto[] = [];
  chartHeights: Record<'small' | 'medium' | 'large', number> = { small: 220, medium: 400, large: 600 };
  currentChartSize: 'small' | 'medium' | 'large' = 'small';

// 2) helper to inject height into options
  private withHeight<T extends Partial<ApexOptions>>(opts: T): T {
    return {
      ...opts,
      chart: { ...(opts.chart || {}), height: this.chartHeights[this.currentChartSize] }
    } as T;
  }

  // Date range + granularity
  rangeStart!: Date;
  rangeEnd!: Date;
  trendGranularity: TrendGranularity = 'monthly';

  // Summary stats
  totalReceptions = 0;
  pendingReceptions = 0;
  completedReceptions = 0;
  totalVolume = 0;

  // Sparkline arrays (now adapt to granularity)
  receptionsPerDay: number[] = [];
  pendingReceptionsPerDay: number[] = [];
  completedReceptionsPerDay: number[] = [];
  volumePerDay: number[] = [];

  // Bar/Pie data
  supplierNames: string[] = [];
  supplierVolumes: number[] = [];
  storageNames: string[] = [];
  storageUtilization: number[] = [];

  // Recent receptions
  recentReceptions: UnifiedDelivery[] = [];

  // KPIs
  avgVolumePerReception = 0;
  avgUnitPrice = 0;
  totalPaidAmount = 0;
  totalUnpaidAmount = 0;
  uniqueSuppliers = 0;
  storageUnitsUsed = 0;
  avgProcessingTime = 0;

  // Apex options (heights controlled in template)
  receptionsByStatusChartOptions: Partial<ApexOptions> = {};
  volumeBySupplierChartOptions: Partial<ApexOptions> = {};
  volumeByStorageChartOptions: Partial<ApexOptions> = {};
  receptionsByTypeChartOptions: Partial<ApexOptions> = {};
  receptionsTrendChartOptions: Partial<ApexOptions> = {};
  qualityControlChartOptions: Partial<ApexOptions> = {};
  recentReceptionsChartOptions: Partial<ApexOptions> = {};

  // UI
  lastUpdated: Date | null = new Date();
// Period and size (legacy API restored)
  currentReceptionTrendView: 'monthly' | 'weekly' | 'daily' = 'daily';

  // DI
  private deliveryService = inject(UnifiedDeliveryService);
  private supplierService = inject(SupplierTypeService);
  private storageService = inject(StorageUnitDtoService);
  private translate = inject(TranslateService);

  constructor() {
    // default: last 30 days
    const end = this.stripTime(new Date());
    const start = this.stripTime(new Date());
    start.setDate(end.getDate() - 29);
    this.rangeStart = start;
    this.rangeEnd = end;

    this.translate.onLangChange.pipe(takeUntil(this.destroy$)).subscribe(() => this.updateChartLabels());
  }

  // Theme colors (as arrays for your mini charts)
  get primaryColor() { return ['var(--primary-500)']; }
  get warningColor() { return ['var(--warning-500)']; }
  get successColor() { return ['var(--success-500)']; }
  get infoColor()    { return ['var(--info-500)']; }

  // Currency formatting
  get formattedAvgUnitPrice(): string     { return this.avgUnitPrice.toFixed(2) + ' TND'; }
  get formattedTotalPaidAmount(): string  { return this.totalPaidAmount.toFixed(2) + ' TND'; }
  get formattedTotalUnpaidAmount(): string{ return this.totalUnpaidAmount.toFixed(2) + ' TND'; }

  ngOnInit(): void { this.loadData(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  // === Range + Granularity API (call these from UI) ===
  setDateRange(start: Date | null, end: Date | null): void {
    if (!start || !end) return;
    this.rangeStart = this.stripTime(start);
    this.rangeEnd = this.stripTime(end);
    this.applyFiltersAndRebuild();
  }




  refresh(): void {
    try { this.loadData(); }
    finally { this.lastUpdated = new Date(); }
  }

  // === Data load (still client-side filtering) ===
  loadData(): void {
    this.isLoading = true;
    this.error = null;

    forkJoin({
      deliveries: this.deliveryService.getAllDeliveriesList().pipe(catchError(() => of({ data: [] }))),
      suppliers:  this.supplierService.getAllSuppliers().pipe(catchError(() => of({ data: [] }))),
      storage:    this.storageService.getAllStorageUnit().pipe(catchError(() => of({ data: [] })))
    })
      .pipe(finalize(() => (this.isLoading = false)), takeUntil(this.destroy$))
      .subscribe({
        next: ({ deliveries, suppliers, storage }) => {
          this.allReceptions = Array.isArray(deliveries.data) ? deliveries.data : deliveries.data ? [deliveries.data] : [];
          this.suppliers     = Array.isArray(suppliers.data)  ? suppliers.data  : suppliers.data  ? [suppliers.data]  : [];
          this.storageUnits  = Array.isArray(storage.data)    ? storage.data    : storage.data    ? [storage.data]    : [];
          this.applyFiltersAndRebuild();
        },
        error: () => { this.error = 'Erreur lors du chargement des données'; }
      });
  }
  private getReceptionsTrendData(receptions: UnifiedDelivery[], view: 'monthly' | 'weekly' | 'daily') {
    if (view === 'monthly') return this.generateMonthlyReceptionsTrend(receptions);
    if (view === 'weekly')  return this.generateWeeklyReceptionsTrend(receptions);
    return this.generateDailyReceptionsTrend(receptions);
  }


  // === Filtering + rebuilding stats/charts ===
  private applyFiltersAndRebuild(): void {
    // 1) filter by [rangeStart, rangeEnd]
    this.receptions = this.allReceptions.filter(r => {
      if (!r.deliveryDate) return false;
      const d = this.stripTime(new Date(r.deliveryDate));
      return d >= this.rangeStart && d <= this.rangeEnd;
    });

    // 2) rebuild sparklines using selected granularity (last 7 bins ending at rangeEnd)
    this.receptionsPerDay = this.getCountsForSparkline(this.receptions, this.trendGranularity, 7);
    this.pendingReceptionsPerDay = this.getCountsForSparkline(
      this.receptions.filter(r => this.isStatus(r, OliveLotStatus.IN_PROGRESS)),
      this.trendGranularity,
      7
    );
    this.completedReceptionsPerDay = this.getCountsForSparkline(
      this.receptions.filter(r => this.isStatus(r, OliveLotStatus.COMPLETED)),
      this.trendGranularity,
      7
    );
    this.volumePerDay = this.getVolumeForSparkline(this.receptions, this.trendGranularity, 7);

    // 3) KPIs + main charts
    this.prepareStatsAndCharts();
  }

  // === Status helpers ===
  private statusKey(status: any): string {
    try {
      if (status == null) return 'UNKNOWN';
      if (typeof status === 'string') return status;
      const key = (OliveLotStatus as any)[status];
      return key ?? String(status);
    } catch { return String(status); }
  }
  private isStatus(r: UnifiedDelivery, target: OliveLotStatus): boolean {
    return this.statusKey(r.status) === OliveLotStatus[target];
  }

  // === KPIs + charts (respect current this.receptions i.e., filtered range) ===
  private prepareStatsAndCharts(): void {
    // KPIs
    this.totalReceptions = this.receptions.length;
    this.pendingReceptions = this.receptions.filter(r => this.isStatus(r, OliveLotStatus.IN_PROGRESS)).length;
    this.completedReceptions = this.receptions.filter(r => this.isStatus(r, OliveLotStatus.COMPLETED)).length;
    this.totalVolume = this.receptions.reduce((sum, r) => sum + (r.oilQuantity || 0), 0);

    this.recentReceptions = [...this.receptions]
      .filter(r => r.deliveryDate)
      .sort((a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime())
      .slice(0, 5);

    this.avgVolumePerReception = this.receptions.length ? (this.totalVolume / this.receptions.length) : 0;
    this.avgUnitPrice = this.receptions.length
      ? this.receptions.reduce((sum, r) => sum + (r.unitPrice || 0), 0) / this.receptions.length
      : 0;
    this.totalPaidAmount   = this.receptions.reduce((s, r) => s + (r.paidAmount   || 0), 0);
    this.totalUnpaidAmount = this.receptions.reduce((s, r) => s + (r.unpaidAmount || 0), 0);
    this.uniqueSuppliers   = new Set(this.receptions.map(r => r.supplier?.id)).size;
    this.storageUnitsUsed  = new Set(this.receptions.map(r => r.storageUnit?.id)).size;

    const completed = this.receptions.filter(r =>
      this.isStatus(r, OliveLotStatus.COMPLETED) && r.deliveryDate && r.trtDate
    );
    this.avgProcessingTime = completed.length
      ? completed.reduce((sum, r) =>
      sum + (new Date(r.trtDate!).getTime() - new Date(r.deliveryDate).getTime()) / 86_400_000, 0
    ) / completed.length
      : 0;

     this.updateReceptionTrendView(this.currentReceptionTrendView);

    // --- Status distribution (Pie) ---
    const statusCounts: Record<string, number> = {};
    this.receptions.forEach(r => {
      const key = this.statusKey(r.status);
      const label = this.translate.instant('RECEPTION_LIST.STATUS.' + key) || key || 'INCONNU';
      statusCounts[label] = (statusCounts[label] || 0) + 1;
    });
    this.receptionsByStatusChartOptions = {
      series: Object.values(statusCounts),
      chart: { type: 'pie', toolbar: { show: false } },
      labels: Object.keys(statusCounts),
      colors: ['#4CAF50', '#FFC107', '#F44336', '#2196F3', '#9C27B0']
    };

    // --- Supplier volumes (Bar) ---
    const supplierMap = new Map<string, number>();
    this.receptions.forEach(r => {
      const name = r.supplier?.supplierInfo?.name || 'Inconnu';
      supplierMap.set(name, (supplierMap.get(name) || 0) + (r.oilQuantity || 0));
    });
    this.supplierNames = [...supplierMap.keys()];
    this.supplierVolumes = [...supplierMap.values()];
    this.volumeBySupplierChartOptions = {
      series: [{ name: 'Volume', data: this.supplierVolumes }],
      chart: { type: 'bar', toolbar: { show: false } },
      xaxis: { categories: this.supplierNames },
      colors: ['var(--primary-500)']
    };

    // --- Storage utilization (Bar) ---
    this.storageNames = this.storageUnits.map(s => s.name);
    this.storageUtilization = this.storageUnits.map(s => {
      const max = s.maxCapacity || 0;
      const cur = s.currentVolume || 0;
      return max > 0 ? Math.round((cur / max) * 100) : 0;
    });
    this.volumeByStorageChartOptions = {
      series: [{ name: 'Utilisation', data: this.storageUtilization }],
      chart: { type: 'bar', toolbar: { show: false } },
      xaxis: { categories: this.storageNames },
      colors: ['var(--info-500)']
    };

    // --- Receptions by type (Bar) ---
    const typeMap = new Map<string, number>();
    this.receptions.forEach(r => {
      const type = r.deliveryType || 'INCONNU';
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    });
    this.receptionsByTypeChartOptions = {
      series: [{ name: 'Réceptions', data: [...typeMap.values()] }],
      chart: { type: 'bar', toolbar: { show: false } },
      xaxis: { categories: [...typeMap.keys()] },
      colors: ['var(--success-500)']
    };

    // --- QC distribution (Pie) ---
    const qcMap: Record<string, number> = {};
    this.receptions.forEach(r => {
      if (r.qualityControlResults?.length) {
        r.qualityControlResults.forEach(qc => {
          const rule = qc.rule?.ruleName?.toString() || 'INCONNU';
          qcMap[rule] = (qcMap[rule] || 0) + 1;
        });
      }
    });
    this.qualityControlChartOptions = {
      series: Object.values(qcMap),
      chart: { type: 'pie', toolbar: { show: false } },
      labels: Object.keys(qcMap),
      colors: ['#4CAF50', '#FFC107', '#F44336', '#2196F3', '#9C27B0']
    };

    // --- Recent receptions (Bar) ---
    this.recentReceptionsChartOptions = {
      series: [{ name: "Quantité d'huile", data: this.recentReceptions.map(r => r.oilQuantity || 0) }],
      chart: { type: 'bar', toolbar: { show: false } },
      xaxis: {
        categories: this.recentReceptions.map(r => `Lot ${r.lotNumber} (${r.supplier?.supplierInfo?.name || 'Inconnu'})`),
        labels: { rotate: -45, trim: true, hideOverlappingLabels: true }
      },
      yaxis: { title: { text: 'Quantité (T)' } },
      tooltip: { y: { formatter: (val: number) => val.toFixed(2) + ' T' } },
      colors: ['var(--secondary-500)']
    };
      this.volumeBySupplierChartOptions     = this.withHeight(this.volumeBySupplierChartOptions);
    this.volumeByStorageChartOptions      = this.withHeight(this.volumeByStorageChartOptions);
     this.recentReceptionsChartOptions     = this.withHeight(this.recentReceptionsChartOptions);
  }
// Trend uses your legacy updater:
  updateReceptionTrendView(view: 'monthly' | 'weekly' | 'daily') {
    this.currentReceptionTrendView = view;
    const data = this.getReceptionsTrendData(this.receptions, view);
    this.receptionsTrendChartOptions = this.withHeight({
      series: [{ name: 'Réceptions', data: data.data }],
      chart: { type: 'line', toolbar: { show: false } },
      xaxis: { categories: data.categories },
      colors: ['var(--primary-500)']
    });
  }

// 4) when size changes, just re-apply heights
  updateChartSize(size: 'small' | 'medium' | 'large') {
    this.currentChartSize = size;

    // re-apply height to all options
      this.volumeBySupplierChartOptions   = this.withHeight(this.volumeBySupplierChartOptions);
    this.volumeByStorageChartOptions    = this.withHeight(this.volumeByStorageChartOptions);
     this.recentReceptionsChartOptions   = this.withHeight(this.recentReceptionsChartOptions);
    this.updateReceptionTrendView(this.currentReceptionTrendView);
  }
  // === Sparkline helpers (7 bins ending at rangeEnd) ===
  private getCountsForSparkline(recs: UnifiedDelivery[], gran: TrendGranularity, bins = 7): number[] {
    const buckets = this.makeTrailingBuckets(gran, bins, this.rangeEnd);
    const map = new Map<string, number>(buckets.map(b => [b.key, 0]));
    recs.forEach(r => {
      if (!r.deliveryDate) return;
      const key = this.bucketKey(gran, new Date(r.deliveryDate));
      if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
    });
    return buckets.map(b => map.get(b.key) || 0);
  }

  private getVolumeForSparkline(recs: UnifiedDelivery[], gran: TrendGranularity, bins = 7): number[] {
    const buckets = this.makeTrailingBuckets(gran, bins, this.rangeEnd);
    const map = new Map<string, number>(buckets.map(b => [b.key, 0]));
    recs.forEach(r => {
      if (!r.deliveryDate) return;
      const key = this.bucketKey(gran, new Date(r.deliveryDate));
      if (map.has(key)) map.set(key, (map.get(key) || 0) + (r.oilQuantity || 0));
    });
    return buckets.map(b => map.get(b.key) || 0);
  }

  // === Trend helpers (for any [start,end]) ===
  private getTrendSeries(recs: UnifiedDelivery[], gran: TrendGranularity, start: Date, end: Date) {
    const buckets = this.makeBucketsBetween(gran, start, end);
    const map = new Map<string, number>(buckets.map(b => [b.key, 0]));
    recs.forEach(r => {
      if (!r.deliveryDate) return;
      const key = this.bucketKey(gran, new Date(r.deliveryDate));
      if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
    });
    return {
      categories: buckets.map(b => b.label),
      data: buckets.map(b => map.get(b.key) || 0)
    };
  }

  // === Bucketing ===
  private makeTrailingBuckets(gran: TrendGranularity, bins: number, end: Date) {
    const out: { key: string; label: string }[] = [];
    const e = this.stripTime(new Date(end));
    for (let i = bins - 1; i >= 0; i--) {
      const d = this.addToDate(e, gran, -i);
      out.push({ key: this.bucketKey(gran, d), label: this.bucketLabel(gran, d) });
    }
    return out;
  }

  private makeBucketsBetween(gran: TrendGranularity, start: Date, end: Date) {
    const out: { key: string; label: string }[] = [];
    const s = this.alignToBucketStart(gran, this.stripTime(new Date(start)));
    const e = this.stripTime(new Date(end));
    let cursor = new Date(s);
    while (cursor <= e) {
      out.push({ key: this.bucketKey(gran, cursor), label: this.bucketLabel(gran, cursor) });
      cursor = this.addToDate(cursor, gran, 1);
    }
    return out;
  }

  private bucketKey(gran: TrendGranularity, d: Date): string {
    const y = d.getUTCFullYear();
    const m = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = d.getUTCDate().toString().padStart(2, '0');
    if (gran === 'daily')  return `${y}-${m}-${day}`;
    if (gran === 'weekly') return this.isoWeekKey(d); // YYYY-Www
    if (gran === 'monthly')return `${y}-${m}`;
    return `${y}`; // yearly
  }

  private bucketLabel(gran: TrendGranularity, d: Date): string {
    if (gran === 'daily')  return d.toLocaleDateString('fr-FR');
    if (gran === 'weekly') {
      const [yy, ww] = this.isoWeekKey(d).split('-W');
      return `Sem. ${ww}/${yy.slice(-2)}`;
    }
    if (gran === 'monthly')return d.toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
    return d.getUTCFullYear().toString();
  }

  private alignToBucketStart(gran: TrendGranularity, d: Date): Date {
    const x = new Date(d);
    if (gran === 'weekly') {
      // align to Monday (ISO week)
      const day = (x.getUTCDay() + 6) % 7; // 0=Monday
      x.setUTCDate(x.getUTCDate() - day);
    } else if (gran === 'monthly') {
      x.setUTCDate(1);
    } else if (gran === 'yearly') {
      x.setUTCMonth(0, 1);
    }
    return x;
  }

  private addToDate(d: Date, gran: TrendGranularity, delta: number): Date {
    const x = new Date(d);
    if (gran === 'daily')  x.setUTCDate(x.getUTCDate() + delta);
    if (gran === 'weekly') x.setUTCDate(x.getUTCDate() + 7 * delta);
    if (gran === 'monthly')x.setUTCMonth(x.getUTCMonth() + delta, 1);
    if (gran === 'yearly') x.setUTCFullYear(x.getUTCFullYear() + delta, 0, 1);
    return x;
  }

  private isoWeekKey(date: Date): string {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    const ww = weekNo.toString().padStart(2, '0');
    return `${d.getUTCFullYear()}-W${ww}`;
  }

  // === Misc ===
  private stripTime(d: Date): Date { return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); }

  private updateChartLabels(): void {
    this.translate.get([
      'DASHBOARD.ANALYTICS.RECEPTION_STATUS',
      'DASHBOARD.ANALYTICS.RECEPTION_TYPE',
      'DASHBOARD.ANALYTICS.VOLUME_BY_SUPPLIER',
      'DASHBOARD.ANALYTICS.VOLUME_BY_STORAGE',
      'DASHBOARD.ANALYTICS.QUALITY_CONTROL',
      'DASHBOARD.ANALYTICS.RECENT_RECEPTIONS',
      'DASHBOARD.ANALYTICS.RECEPTION_TREND.TITLE'
    ]).pipe(takeUntil(this.destroy$))
      .subscribe(t => {
        if (this.receptionsByStatusChartOptions)
          this.receptionsByStatusChartOptions = { ...this.receptionsByStatusChartOptions, title: { text: t['DASHBOARD.ANALYTICS.RECEPTION_STATUS'] } };
        if (this.receptionsByTypeChartOptions)
          this.receptionsByTypeChartOptions   = { ...this.receptionsByTypeChartOptions,   title: { text: t['DASHBOARD.ANALYTICS.RECEPTION_TYPE']   } };
        if (this.volumeBySupplierChartOptions)
          this.volumeBySupplierChartOptions   = { ...this.volumeBySupplierChartOptions,   title: { text: t['DASHBOARD.ANALYTICS.VOLUME_BY_SUPPLIER'] } };
        if (this.volumeByStorageChartOptions)
          this.volumeByStorageChartOptions    = { ...this.volumeByStorageChartOptions,    title: { text: t['DASHBOARD.ANALYTICS.VOLUME_BY_STORAGE'] } };
        if (this.qualityControlChartOptions)
          this.qualityControlChartOptions     = { ...this.qualityControlChartOptions,     title: { text: t['DASHBOARD.ANALYTICS.QUALITY_CONTROL'] } };
        if (this.recentReceptionsChartOptions)
          this.recentReceptionsChartOptions   = { ...this.recentReceptionsChartOptions,   title: { text: t['DASHBOARD.ANALYTICS.RECENT_RECEPTIONS'] } };
        if (this.receptionsTrendChartOptions)
          this.receptionsTrendChartOptions    = { ...this.receptionsTrendChartOptions,    title: { text: t['DASHBOARD.ANALYTICS.RECEPTION_TREND.TITLE'] } };
      });
  }
  private getLastNMonths(n: number): string[] {
    const months: string[] = [];
    for (let i = 0; i < n; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.unshift(date.toLocaleString('fr-FR', { year: 'numeric', month: 'short' }));
    }
    return months;
  }
  private generateMonthlyReceptionsTrend(receptions: UnifiedDelivery[]): { categories: string[]; data: number[] } {
    const monthlyCounts: Record<string, number> = {};
    const last12Months = this.getLastNMonths(12);

    last12Months.forEach((month) => (monthlyCounts[month] = 0));

    receptions.forEach((r) => {
      const month = new Date(r.deliveryDate).toLocaleString('fr-FR', { year: 'numeric', month: 'short' });
      monthlyCounts[month]++;
    });

    return { categories: last12Months, data: last12Months.map((month) => monthlyCounts[month]) };
  }
  private generateWeeklyReceptionsTrend(receptions: UnifiedDelivery[]): { categories: string[]; data: number[] } {
    const weeklyCounts: Record<string, number> = {};
    const last14Days = this.getLastNDates(14);

    last14Days.forEach((date) => {
      const week = this.getWeekNumber(date);
      weeklyCounts[week] = 0;
    });

    receptions.forEach((r) => {
      const date = new Date(r.deliveryDate);
      const week = this.getWeekNumber(date);
      weeklyCounts[week]++;
    });

    const categories = last14Days.map((date) => {
      const week = this.getWeekNumber(date);
      return `Sem. ${week} (${date.getDate()}/${date.getMonth() + 1})`;
    });

    return { categories, data: last14Days.map((date) => weeklyCounts[this.getWeekNumber(date)]) };
  }
  private getWeekNumber(date: Date): string {
    date = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    // (Sunday is 0)
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    // Get full year number in ISO-8601 year numbering.
    const yearStart = new Date(Date.UTC(date.getFullYear(), 0, 1));
    // Calculate full weeks to the nearest Thursday
    const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${date.getFullYear()}-${weekNo}`;
  }
  private getLastNDates(n: number): Date[] {
    const dates: Date[] = [];
    for (let i = 0; i < n; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.unshift(date);
    }
    return dates;
  }

  private generateDailyReceptionsTrend(receptions: UnifiedDelivery[]): { categories: string[]; data: number[] } {
    const dailyCounts: Record<string, number> = {};
    const last14Days = this.getLastNDates(14);

    last14Days.forEach((date) => (dailyCounts[date.toISOString().split('T')[0]] = 0));

    receptions.forEach((r) => {
      const date = new Date(r.deliveryDate).toISOString().split('T')[0];
      dailyCounts[date]++;
    });

    return {
      categories: last14Days.map((d) => d.toLocaleDateString('fr-FR')),
      data: last14Days.map((d) => dailyCounts[d.toISOString().split('T')[0]])
    };
  }
  // Quick actions (unchanged hooks)
  setQuickRange(range: '7d' | '30d' | 'ytd'): void {
    const end = this.stripTime(new Date());
    let start = new Date(end);
    if (range === '7d')  start.setUTCDate(end.getUTCDate() - 6);
    if (range === '30d') start.setUTCDate(end.getUTCDate() - 29);
    if (range === 'ytd') start = new Date(Date.UTC(end.getUTCFullYear(), 0, 1));
    this.setDateRange(start, end);
  }

  export(fmt: 'png' | 'csv' | 'pdf'): void { (this as any).exportDashboard?.(fmt); }
}

