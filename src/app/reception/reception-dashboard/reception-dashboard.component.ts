import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BehaviorSubject, forkJoin, of, Subject } from 'rxjs';
import { catchError, finalize, take, takeUntil } from 'rxjs/operators';
import { UnifiedDelivery } from '../../shared/models/UnifiedDelivery';
import { StorageUnitDto } from '../../shared/models/StorageUnitDto';
import { SupplierType } from '../../shared/models/supplier-type';
import { OliveLotStatus } from '../../shared/models/OliveLotStatus';
import { UnifiedDeliveryService } from '../../shared/services/delivery.service';
import { SupplierTypeService } from '../../shared/services/supplier.service';
import { StorageUnitDtoService } from '../../shared/services/storage.service';
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';
import { SharedModule } from 'src/app/shared/shared.module';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EarningChartComponent } from '../../theme/pages/apex-chart/earning-chart/earning-chart.component';
import { CardComponent } from '../../theme/components/card/card.component';
import { MatDialog } from '@angular/material/dialog';
import { DailyMetricClient, normalizeMetricValue } from '../../shared/services/DailyMetricPayload';
import { DailyMetricDialogComponent } from '../../shared/components/daily-metric-dialog/daily-metric-dialog.component';
import { OperationType } from '../../shared/models/operation-type.enum';

type TrendGranularity = 'daily' | 'weekly' | 'monthly' | 'yearly';
type PresetPeriod = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'custom';

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
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    MatSelectModule,
    FormsModule,
    RouterModule,
    EarningChartComponent,
    CardComponent,
    NgApexchartsModule,
    SharedModule,
    TranslateModule
  ]
})
export class ReceptionDashboardComponent implements OnInit, OnDestroy {
  // Loading & Error States
  isLoading = true;
  error: string | null = null;
  destroy$ = new Subject<void>();
  lastUpdated: Date | null = new Date();

  // Daily base-price metric (DAILY_OIL_METRIC parameter)
  private readonly DAILY_METRIC_CODE = 'DAILY_OIL_METRIC';
  canEditToday$ = new BehaviorSubject(true);
  // Quick period configuration for compact pills
  quickPeriods = [
    { value: 'today' as PresetPeriod, label: 'DASHBOARD.DATE_FILTER.TODAY' },
    { value: 'yesterday' as PresetPeriod, label: 'DASHBOARD.DATE_FILTER.YESTERDAY' },
    { value: 'thisWeek' as PresetPeriod, label: 'DASHBOARD.DATE_FILTER.THIS_WEEK' },
    { value: 'lastWeek' as PresetPeriod, label: 'DASHBOARD.DATE_FILTER.LAST_WEEK' },
    { value: 'thisMonth' as PresetPeriod, label: 'DASHBOARD.DATE_FILTER.THIS_MONTH' },
    { value: 'lastMonth' as PresetPeriod, label: 'DASHBOARD.DATE_FILTER.LAST_MONTH' },
    { value: 'thisYear' as PresetPeriod, label: 'DASHBOARD.DATE_FILTER.THIS_YEAR' },
    { value: 'lastYear' as PresetPeriod, label: 'DASHBOARD.DATE_FILTER.LAST_YEAR' }
  ];
  // Date Range & Filtering
  rangeStart!: Date;
  rangeEnd!: Date;
  trendGranularity: TrendGranularity = 'monthly';
  selectedPreset: PresetPeriod = 'thisMonth';
  customStartDate: Date | null = null;
  customEndDate: Date | null = null;
  maxDate = new Date();
  selectedPeriodDisplay: string | null = null;
  // Operation Type Filter
  selectedOperationType: string;
  operationTypes = [
    { value: OperationType.SIMPLE_RECEPTION, labelKey: 'DELIVERIES.OPERATION_TYPE.SIMPLE_RECEPTION' },
    { value: OperationType.OLIVE_PURCHASE, labelKey: 'DELIVERIES.OPERATION_TYPE.OLIVE_PURCHASE' },
    { value: OperationType.BASE, labelKey: 'DELIVERIES.OPERATION_TYPE.BASE' },
    { value: OperationType.EXCHANGE, labelKey: 'DELIVERIES.OPERATION_TYPE.EXCHANGE' },
    { value: OperationType.OIL_PURCHASE, labelKey: 'DELIVERIES.OPERATION_TYPE.OIL_PURCHASE' }
  ];
  // Data Collections
  receptions: UnifiedDelivery[] = [];
  suppliers: SupplierType[] = [];
  storageUnits: StorageUnitDto[] = [];
  // KPIs
  totalReceptions = 0;
  pendingReceptions = 0;
  completedReceptions = 0;
  totalVolume = 0;
  avgVolumePerReception = 0;
  avgUnitPrice = 0;
  totalPaidAmount = 0;
  totalUnpaidAmount = 0;
  totalAmount = 0;
  uniqueSuppliers = 0;
  storageUnitsUsed = 0;
  avgProcessingTime = 0;
  // Sparkline Arrays (for earning charts)
  receptionsPerDay: number[] = [];
  pendingReceptionsPerDay: number[] = [];
  completedReceptionsPerDay: number[] = [];
  volumePerDay: number[] = [];
  // Chart Options
  currentReceptionTrendView: 'monthly' | 'weekly' | 'daily' = 'daily';
  currentChartSize: 'small' | 'medium' | 'large' = 'small';
  baseUnitPriceTrendChartOptions: any = {
    chart: { type: 'line', height: 320, toolbar: { show: false } },
    colors: ['#0E6FFF'],
    series: [{ name: 'Unit Price (BASE)', data: [] }],
    xaxis: { categories: [] },
    yaxis: {
      title: { text: 'TND/kg' },
      labels: { formatter: (val: number) => Number(val)?.toFixed(2) ?? '0.00' }
    },
    stroke: { curve: 'smooth', width: 2 },
    markers: { size: 3 },
    tooltip: {
      y: { formatter: (val: number) => `${(Number(val) || 0).toFixed(3)} TND/kg` }
    }
  };
  receptionsTrendChartOptions: Partial<ApexOptions> = {};
  private allReceptions: UnifiedDelivery[] = [];
  // Services
  private deliveryService = inject(UnifiedDeliveryService);
  private supplierService = inject(SupplierTypeService);
  private storageService = inject(StorageUnitDtoService);
  private translate = inject(TranslateService);

  constructor(
    private dialog: MatDialog,
    private dailyMetric: DailyMetricClient
  ) {
    this.initializeDefaultDateRange();
    this.translate.onLangChange.pipe(takeUntil(this.destroy$)).subscribe(() => this.updateChartLabels());
  }

  // Theme Colors for Earning Charts
  get primaryColor() {
    return ['var(--primary-500)'];
  }

  get warningColor() {
    return ['var(--warning-500)'];
  }

  get successColor() {
    return ['var(--success-500)'];
  }

  get formattedTotalPaidAmount(): string {
    return this.totalPaidAmount.toFixed(2) + ' TND';
  }

  get formattedTotalUnpaidAmount(): string {
    return this.totalUnpaidAmount.toFixed(2) + ' TND';
  }

  ngOnInit(): void {
    this.refreshDailyMetricState();
    this.loadData();
    this.onOperationTypeChange(OperationType.SIMPLE_RECEPTION);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // === Data Loading ===
  loadData(): void {
    this.isLoading = true;
    this.error = null;

    forkJoin({
      deliveries: this.deliveryService.getAllDeliveriesList().pipe(catchError(() => of({ data: [] }))),
      suppliers: this.supplierService.getAllSuppliers().pipe(catchError(() => of({ data: [] }))),
      storage: this.storageService.getAllStorageUnit().pipe(catchError(() => of({ data: [] })))
    })
      .pipe(
        finalize(() => (this.isLoading = false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: ({ deliveries, suppliers, storage }) => {
          this.allReceptions = Array.isArray(deliveries.data) ? deliveries.data : deliveries.data ? [deliveries.data] : [];
          this.suppliers = Array.isArray(suppliers.data) ? suppliers.data : suppliers.data ? [suppliers.data] : [];
          this.storageUnits = Array.isArray(storage.data) ? storage.data : storage.data ? [storage.data] : [];
          this.applyFiltersAndRebuild();
        },
        error: () => {
          this.error = 'Erreur lors du chargement des données';
        }
      });
  }

  refresh(): void {
    try {
      this.loadData();
    } finally {
      this.lastUpdated = new Date();
    }
  }

  onOperationTypeChange(op: string): void {
    this.selectedOperationType = op;
    this.refresh();
  }

  selectPresetPeriod(preset: PresetPeriod): void {
    this.selectedPreset = preset;
    this.customStartDate = null;
    this.customEndDate = null;

    const dates = this.getPresetDateRange(preset);
    this.rangeStart = dates.start;
    this.rangeEnd = dates.end;

    this.updateSelectedPeriodDisplay();
    this.applyFiltersAndRebuild();
  }

  applyCustomDateRange(): void {
    if (!this.customStartDate || !this.customEndDate) return;

    this.selectedPreset = 'custom';
    this.rangeStart = this.stripTime(this.customStartDate);
    this.rangeEnd = this.stripTime(this.customEndDate);

    this.updateSelectedPeriodDisplay();
    this.applyFiltersAndRebuild();
  }

  clearDateRange(): void {
    this.selectedPreset = 'thisMonth';
    this.customStartDate = null;
    this.customEndDate = null;
    this.selectedPeriodDisplay = null;
    this.initializeDefaultDateRange();
    this.applyFiltersAndRebuild();
  }

  openDailyMetricDialog(): void {
    const dialogRef = this.dialog.open(DailyMetricDialogComponent, {
      width: '440px',
      autoFocus: true,
      restoreFocus: false,
      panelClass: 'daily-metric-dialog',
      data: {
        code: this.DAILY_METRIC_CODE,
        unit: 'TND/kg'
      }
    });

    dialogRef.afterClosed().subscribe((saved) => {
      if (saved) {
        this.refreshDailyMetricState();
        this.applyFiltersAndRebuild();
      }
    });
  }

  private refreshDailyMetricState(): void {
    this.dailyMetric
      .canEditToday(this.DAILY_METRIC_CODE)
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe((canEdit) => this.canEditToday$.next(canEdit));
  }

  updateReceptionTrendView(view: 'monthly' | 'weekly' | 'daily'): void {
    this.currentReceptionTrendView = view;
    const data = this.getReceptionsTrendData(this.receptions, view);
    this.receptionsTrendChartOptions = {
      series: [{ name: 'Réceptions', data: data.data }],
      chart: { type: 'line', height: 320, toolbar: { show: false } },
      xaxis: { categories: data.categories },
      colors: ['var(--primary-500)']
    };
  }

  // === Filtering & Data Processing ===
  private applyFiltersAndRebuild(): void {
    // Filter by date range and operation type
    this.receptions = this.allReceptions.filter((r) => {
      if (!r.deliveryDate) return false;
      const d = this.stripTime(new Date(r.deliveryDate));
      const inRange = d >= this.rangeStart && d <= this.rangeEnd;

      if (this.selectedOperationType) {
        const op = String((r as any).operationType ?? '').toUpperCase();
        return inRange && op === this.selectedOperationType;
      }

      return inRange;
    });

    // Build sparklines (7 bins ending at rangeEnd)
    this.receptionsPerDay = this.getCountsForSparkline(this.receptions, this.trendGranularity, 7);
    this.pendingReceptionsPerDay = this.getCountsForSparkline(
      this.receptions.filter((r) => this.isStatus(r, OliveLotStatus.IN_PROGRESS)),
      this.trendGranularity,
      7
    );
    this.completedReceptionsPerDay = this.getCountsForSparkline(
      this.receptions.filter((r) => this.isStatus(r, OliveLotStatus.COMPLETED)),
      this.trendGranularity,
      7
    );
    this.volumePerDay = this.getVolumeForSparkline(this.receptions, this.trendGranularity, 7);

    // Calculate KPIs and update charts
    this.prepareStatsAndCharts();
  }

  // === Date Range Management ===
  private initializeDefaultDateRange(): void {
    const now = new Date();
    this.rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
    this.rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.updateSelectedPeriodDisplay();
  }

  private getPresetDateRange(preset: PresetPeriod): { start: Date; end: Date } {
    const now = new Date();
    const today = this.stripTime(now);

    switch (preset) {
      case 'today':
        return { start: new Date(today), end: new Date(today) };

      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { start: yesterday, end: yesterday };

      case 'thisWeek':
        const startOfWeek = new Date(today);
        const dayOfWeek = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return { start: startOfWeek, end: endOfWeek };

      case 'lastWeek':
        const lastWeekStart = new Date(today);
        const lastWeekDay = lastWeekStart.getDay();
        const lastWeekDiff = lastWeekStart.getDate() - lastWeekDay + (lastWeekDay === 0 ? -6 : 1) - 7;
        lastWeekStart.setDate(lastWeekDiff);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
        return { start: lastWeekStart, end: lastWeekEnd };

      case 'thisMonth':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        };

      case 'lastMonth':
        return {
          start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          end: new Date(now.getFullYear(), now.getMonth(), 0)
        };

      case 'thisYear':
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date(now.getFullYear(), 11, 31)
        };

      case 'lastYear':
        return {
          start: new Date(now.getFullYear() - 1, 0, 1),
          end: new Date(now.getFullYear() - 1, 11, 31)
        };

      default:
        return { start: this.rangeStart, end: this.rangeEnd };
    }
  }

  private updateSelectedPeriodDisplay(): void {
    if (this.selectedPreset === 'custom' && this.customStartDate && this.customEndDate) {
      this.selectedPeriodDisplay = `${this.customStartDate.toLocaleDateString()} - ${this.customEndDate.toLocaleDateString()}`;
    } else {
      const presetLabels: Record<PresetPeriod, string> = {
        today: "Aujourd'hui",
        yesterday: 'Hier',
        thisWeek: 'Cette semaine',
        lastWeek: 'Semaine dernière',
        thisMonth: 'Ce mois',
        lastMonth: 'Mois dernier',
        thisYear: 'Cette année',
        lastYear: 'Année dernière',
        custom: 'Période personnalisée'
      };
      this.selectedPeriodDisplay = presetLabels[this.selectedPreset] || '';
    }
  }

  // === KPIs & Charts ===
  private prepareStatsAndCharts(): void {
    // Calculate KPIs
    this.totalReceptions = this.receptions.length;
    this.pendingReceptions = this.receptions.filter((r) => this.isStatus(r, OliveLotStatus.IN_PROGRESS)).length;
    this.completedReceptions = this.receptions.filter((r) => this.isStatus(r, OliveLotStatus.COMPLETED)).length;
    this.totalVolume = this.receptions.reduce((sum, r) => sum + (r.oilQuantity || 0), 0);

    this.avgVolumePerReception = this.receptions.length ? this.totalVolume / this.receptions.length : 0;
    this.avgUnitPrice = this.receptions.length
      ? this.receptions.reduce((sum, r) => sum + (r.unitPrice || 0), 0) / this.receptions.length
      : 0;
    this.totalPaidAmount = this.receptions.reduce((s, r) => s + (r.paidAmount || 0), 0);
    this.totalUnpaidAmount = this.receptions.reduce((s, r) => s + (r.unpaidAmount || 0), 0);
    this.totalAmount = this.receptions.reduce((s, r) => s + (r.price || 0), 0);
    this.uniqueSuppliers = new Set(this.receptions.map((r) => r.supplier?.id)).size;
    this.storageUnitsUsed = new Set(this.receptions.map((r) => r.storageUnit?.id)).size;

    const completed = this.receptions.filter((r) => this.isStatus(r, OliveLotStatus.COMPLETED) && r.deliveryDate && r.trtDate);
    this.avgProcessingTime = completed.length
      ? completed.reduce((sum, r) => sum + (new Date(r.trtDate!).getTime() - new Date(r.deliveryDate).getTime()) / 86_400_000, 0) /
        completed.length
      : 0;

    // Update charts
    this.updateReceptionTrendView(this.currentReceptionTrendView);
    this.buildBaseUnitPriceTrend_OIL_BASE(this.receptions);
  }

  private getReceptionsTrendData(receptions: UnifiedDelivery[], view: 'monthly' | 'weekly' | 'daily') {
    if (view === 'monthly') return this.generateMonthlyReceptionsTrend(receptions);
    if (view === 'weekly') return this.generateWeeklyReceptionsTrend(receptions);
    return this.generateDailyReceptionsTrend(receptions);
  }

  private buildBaseUnitPriceTrend_OIL_BASE(receptions: any[]): void {
    const trendCats: string[] = this.receptionsTrendChartOptions?.xaxis?.categories ?? [];

    const rows = (receptions || []).filter(
      (r) =>
        r?.deliveryType?.toUpperCase?.() === 'OIL' &&
        String(r?.operationType).toUpperCase() === 'BASE' &&
        Number.isFinite(Number(r?.unitPrice ?? r?.oilUnitPrice)) &&
        (r?.deliveryDate || r?.date || r?.createdDate)
    );

    const dayMap = new Map<string, { sum: number; count: number }>();
    for (const r of rows) {
      const dateSource = r.deliveryDate || r.date || r.createdDate;
      const key = this.toDayKey(dateSource);
      const unit = Number(r.unitPrice ?? r.oilUnitPrice) || 0;
      const bucket = dayMap.get(key) || { sum: 0, count: 0 };
      bucket.sum += unit;
      bucket.count += 1;
      dayMap.set(key, bucket);
    }

    const cats = trendCats.length ? trendCats : Array.from(dayMap.keys()).sort();
    const oilBaseData = cats.map((d) => {
      const b = dayMap.get(d);
      const avg = b ? b.sum / b.count : 0;
      return +(Number.isFinite(avg) ? avg : 0).toFixed(3);
    });

    this.dailyMetric.get(this.DAILY_METRIC_CODE).subscribe({
      next: (payload) => {
        const histMap = new Map<string, number>(Array.isArray(payload?.history) ? (payload.history as [string, number][]) : []);
        const refData = cats.map((d) => {
          const v = histMap.has(d) ? normalizeMetricValue(histMap.get(d)) : normalizeMetricValue(payload?.current);
          return +v.toFixed(3);
        });

        this.baseUnitPriceTrendChartOptions = {
          ...this.baseUnitPriceTrendChartOptions,
          xaxis: { ...(this.baseUnitPriceTrendChartOptions?.xaxis ?? {}), categories: cats },
          colors: ['#0E6FFF', '#FF7A00'],
          stroke: { curve: 'smooth', width: [2, 2], dashArray: [0, 6] },
          series: [
            { name: 'Unit Price (BASE - OIL)', data: oilBaseData },
            { name: 'Référence (TND/kg)', data: refData }
          ]
        };
      },
      error: () => {
        this.baseUnitPriceTrendChartOptions = {
          ...this.baseUnitPriceTrendChartOptions,
          xaxis: { ...(this.baseUnitPriceTrendChartOptions?.xaxis ?? {}), categories: cats },
          colors: ['#0E6FFF'],
          stroke: { curve: 'smooth', width: 2 },
          series: [{ name: 'Unit Price (BASE - OIL)', data: oilBaseData }]
        };
      }
    });
  }

  // === Sparkline Helpers ===
  private getCountsForSparkline(recs: UnifiedDelivery[], gran: TrendGranularity, bins = 7): number[] {
    const buckets = this.makeTrailingBuckets(gran, bins, this.rangeEnd);
    const map = new Map<string, number>(buckets.map((b) => [b.key, 0]));
    recs.forEach((r) => {
      if (!r.deliveryDate) return;
      const key = this.bucketKey(gran, new Date(r.deliveryDate));
      if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
    });
    return buckets.map((b) => map.get(b.key) || 0);
  }

  private getVolumeForSparkline(recs: UnifiedDelivery[], gran: TrendGranularity, bins = 7): number[] {
    const buckets = this.makeTrailingBuckets(gran, bins, this.rangeEnd);
    const map = new Map<string, number>(buckets.map((b) => [b.key, 0]));
    recs.forEach((r) => {
      if (!r.deliveryDate) return;
      const key = this.bucketKey(gran, new Date(r.deliveryDate));
      if (map.has(key)) map.set(key, (map.get(key) || 0) + (r.oilQuantity || 0));
    });
    return buckets.map((b) => map.get(b.key) || 0);
  }

  private makeTrailingBuckets(gran: TrendGranularity, bins: number, end: Date) {
    const out: { key: string; label: string }[] = [];
    const e = this.stripTime(new Date(end));
    for (let i = bins - 1; i >= 0; i--) {
      const d = this.addToDate(e, gran, -i);
      out.push({ key: this.bucketKey(gran, d), label: this.bucketLabel(gran, d) });
    }
    return out;
  }

  // === Bucketing Utilities ===
  private bucketKey(gran: TrendGranularity, d: Date): string {
    const y = d.getUTCFullYear();
    const m = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = d.getUTCDate().toString().padStart(2, '0');
    if (gran === 'daily') return `${y}-${m}-${day}`;
    if (gran === 'weekly') return this.isoWeekKey(d);
    if (gran === 'monthly') return `${y}-${m}`;
    return `${y}`;
  }

  private bucketLabel(gran: TrendGranularity, d: Date): string {
    if (gran === 'daily') return d.toLocaleDateString('fr-FR');
    if (gran === 'weekly') {
      const [yy, ww] = this.isoWeekKey(d).split('-W');
      return `Sem. ${ww}/${yy.slice(-2)}`;
    }
    if (gran === 'monthly') return d.toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
    return d.getUTCFullYear().toString();
  }

  private addToDate(d: Date, gran: TrendGranularity, delta: number): Date {
    const x = new Date(d);
    if (gran === 'daily') x.setUTCDate(x.getUTCDate() + delta);
    if (gran === 'weekly') x.setUTCDate(x.getUTCDate() + 7 * delta);
    if (gran === 'monthly') x.setUTCMonth(x.getUTCMonth() + delta, 1);
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

  // === Trend Generation ===
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

  private getLastNMonths(n: number): string[] {
    const months: string[] = [];
    for (let i = 0; i < n; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.unshift(date.toLocaleString('fr-FR', { year: 'numeric', month: 'short' }));
    }
    return months;
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

  private getWeekNumber(date: Date): string {
    date = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getFullYear(), 0, 1));
    const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${date.getFullYear()}-${weekNo}`;
  }

  // === Utility Methods ===
  private stripTime(d: Date): Date {
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  }

  private toDayKey(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Tunis',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = fmt.formatToParts(d);
    const y = parts.find((p) => p.type === 'year')!.value;
    const m = parts.find((p) => p.type === 'month')!.value;
    const da = parts.find((p) => p.type === 'day')!.value;
    return `${y}-${m}-${da}`;
  }

  private isStatus(r: UnifiedDelivery, target: OliveLotStatus): boolean {
    return this.statusKey(r.status) === OliveLotStatus[target];
  }

  private statusKey(status: any): string {
    try {
      if (status == null) return 'UNKNOWN';
      if (typeof status === 'string') return status;
      const key = (OliveLotStatus as any)[status];
      return key ?? String(status);
    } catch {
      return String(status);
    }
  }

  private updateChartLabels(): void {
    this.translate
      .get(['DASHBOARD.ANALYTICS.RECEPTION_TREND.TITLE', 'DASHBOARD.ANALYTICS.BASE_UNIT_PRICE_TREND.TITLE'])
      .pipe(takeUntil(this.destroy$))
      .subscribe((t) => {
        if (this.receptionsTrendChartOptions) {
          this.receptionsTrendChartOptions = {
            ...this.receptionsTrendChartOptions,
            title: { text: t['DASHBOARD.ANALYTICS.RECEPTION_TREND.TITLE'] }
          };
        }
      });
  }

  protected readonly OperationType = OperationType;
}
