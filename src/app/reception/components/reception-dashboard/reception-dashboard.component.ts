import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  HostListener,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { UnifiedDelivery } from '../../../shared/models/UnifiedDelivery';
import { SupplierType } from '../../../shared/models/supplier-type';
import { StorageUnitDto } from '../../../shared/models/StorageUnitDto';
import { SupplierTypeService } from '../../../shared/services/supplier.service';
import { UnifiedDeliveryService } from '../../../shared/services/delivery.service';
import { StorageUnitDtoService } from '../../../shared/services/storage.service';
import { OliveLotStatus } from '../../../shared/models/OliveLotStatus';
import { EarningChartComponent } from '../../../demo/pages/apex-chart/earning-chart/earning-chart.component';
import { CardComponent } from '../../../@theme/components/card/card.component';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelTitle } from '@angular/material/expansion';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { MatGridList, MatGridTile } from '@angular/material/grid-list';



@Component({
  selector: 'app-reception-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgApexchartsModule,
    TranslateModule,
    EarningChartComponent,
    CardComponent,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelTitle,
    MatTab,
    MatTabGroup,
    MatGridTile,
    MatGridList
  ],
  templateUrl: './reception-dashboard.component.html',
  styleUrls: ['./reception-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReceptionDashboardComponent implements OnInit, OnDestroy {
  // UI state
  isLoading = true;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  // Raw data
  receptions: UnifiedDelivery[] = [];
  suppliers: SupplierType[] = [];
  storageUnits: StorageUnitDto[] = [];

  // Summary statistics
  totalReceptions = 0;
  pendingReceptions = 0;
  completedReceptions = 0;
  totalVolume = 0;
  avgVolumePerReception = 0;
  avgUnitPrice = 0;
  totalPaidAmount = 0;
  totalUnpaidAmount = 0;
  uniqueSuppliers = 0;
  storageUnitsUsed = 0;
  avgProcessingTime = 0;

  // Sparklines
  receptionsPerDay: number[] = [];
  pendingReceptionsPerDay: number[] = [];
  completedReceptionsPerDay: number[] = [];
  volumePerDay: number[] = [];

  // Chart configurations
  receptionsByStatusChartOptions: Partial<ApexOptions> = {};
  receptionsTrendChartOptions: Partial<ApexOptions> = {};
  receptionsByTypeChartOptions: Partial<ApexOptions> = {};
  volumeBySupplierChartOptions: Partial<ApexOptions> = {};
  volumeByStorageChartOptions: Partial<ApexOptions> = {};
  qualityControlChartOptions: Partial<ApexOptions> = {};
  recentReceptionsChartOptions: Partial<ApexOptions> = {};

  // View controls
  currentReceptionTrendView: 'monthly' | 'weekly' | 'daily' = 'monthly';
  currentChartSize: 'small' | 'medium' | 'large' = 'medium';
  private chartDimensions = {
    small: { width: '100%', height: 200 },
    medium: { width: '100%', height: 400 },
    large: { width: '100%', height: 600 }
  };

  // Responsive grid columns
  gridCols = 3;

  constructor(
    private deliveryService: UnifiedDeliveryService,
    private supplierService: SupplierTypeService,
    private storageService: StorageUnitDtoService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {
    // Re-label charts on language switch
    this.translate.onLangChange.pipe(takeUntil(this.destroy$)).subscribe(() => this.updateChartLabels());
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    const width = window.innerWidth;
    this.gridCols = width < 600 ? 1 : width < 900 ? 2 : 3;
  }

  ngOnInit(): void {
    this.onResize();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // -------------------------------------------------------
  // Data loading & error handling
  // -------------------------------------------------------
  private loadData(): void {
    this.isLoading = true;
    this.error = null;
    let deliveriesLoaded = false;
    let suppliersLoaded = false;
    let storageLoaded = false;
    let deliveriesError = false;
    let suppliersError = false;
    let storageError = false;

    // Helper to check if all done
    const checkAllLoaded = () => {
      if ((deliveriesLoaded || deliveriesError) && (suppliersLoaded || suppliersError) && (storageLoaded || storageError)) {
        this.isLoading = false;
        this.cdr.markForCheck();
        if (!deliveriesError && !suppliersError && !storageError) {
          // Prepare sparkline data (last 7 days)
          this.receptionsPerDay = this.getReceptionsPerDay(this.receptions, 7);
          this.pendingReceptionsPerDay = this.getReceptionsPerDay(
            this.receptions.filter((r) => r.status === OliveLotStatus.IN_PROGRESS),
            7
          );
          this.completedReceptionsPerDay = this.getReceptionsPerDay(
            this.receptions.filter((r) => r.status === OliveLotStatus.COMPLETED),
            7
          );
          this.volumePerDay = this.getVolumePerDay(this.receptions, 7);
          // Compute stats & build all charts
          this.prepareStatsAndCharts();
        }
      }
    };

    // Deliveries
    this.deliveryService.getAllDeliveriesList().pipe(
      catchError(() => {
        deliveriesError = true;
        this.error = 'Failed to load deliveries.';
        this.receptions = [];
        checkAllLoaded();
        return of({ data: [] });
      }),
      takeUntil(this.destroy$)
    ).subscribe((deliveries) => {
      this.receptions = Array.isArray(deliveries.data) ? deliveries.data.filter(Boolean) : (deliveries.data ? [deliveries.data] : []);
      deliveriesLoaded = true;
      console.log('Loaded receptions:', this.receptions);
      checkAllLoaded();
    });

    // Suppliers
    this.supplierService.getAllSuppliers().pipe(
      catchError(() => {
        suppliersError = true;
        this.error = 'Failed to load suppliers.';
        this.suppliers = [];
        checkAllLoaded();
        return of({ data: [] });
      }),
      takeUntil(this.destroy$)
    ).subscribe((suppliers) => {
      this.suppliers = Array.isArray(suppliers.data) ? suppliers.data.filter(Boolean) : (suppliers.data ? [suppliers.data] : []);
      suppliersLoaded = true;
      console.log('Loaded suppliers:', this.suppliers);
      checkAllLoaded();
    });

    // Storage Units
    this.storageService.getAllStorageUnit().pipe(
      catchError(() => {
        storageError = true;
        this.error = 'Failed to load storage units.';
        this.storageUnits = [];
        checkAllLoaded();
        return of({ data: [] });
      }),
      takeUntil(this.destroy$)
    ).subscribe((storage) => {
      this.storageUnits = Array.isArray(storage.data) ? storage.data.filter(Boolean) : (storage.data ? [storage.data] : []);
      storageLoaded = true;
      console.log('Loaded storageUnits:', this.storageUnits);
      checkAllLoaded();
    });
  }

  // -------------------------------------------------------
  // Compute KPIs and invoke chart‐builders
  // -------------------------------------------------------
  private prepareStatsAndCharts(): void {
    // Defensive: If no data, set all KPIs to 0
    if (!this.receptions || this.receptions.length === 0) {
      this.totalReceptions = 0;
      this.pendingReceptions = 0;
      this.completedReceptions = 0;
      this.totalVolume = 0;
      this.avgVolumePerReception = 0;
      this.avgUnitPrice = 0;
      this.totalPaidAmount = 0;
      this.totalUnpaidAmount = 0;
      this.uniqueSuppliers = 0;
      this.storageUnitsUsed = 0;
      this.avgProcessingTime = 0;
      return;
    }
    // Basic counts
    this.totalReceptions = this.receptions.length;
    this.pendingReceptions = this.receptions.filter((r) => r.status === OliveLotStatus.IN_PROGRESS).length;
    this.completedReceptions = this.receptions.filter((r) => r.status === OliveLotStatus.COMPLETED).length;
    this.totalVolume = this.receptions.reduce((sum, r) => sum + (r.oilQuantity || 0), 0);

    // Derived metrics
    // Unique suppliers by supplier.id
    this.uniqueSuppliers = new Set(this.receptions.map((r) => r.supplier?.id)).size;

    // Avg processing time (days) for completed items
    const done = this.receptions.filter((r) => r.status === OliveLotStatus.COMPLETED && r.deliveryDate && r.trtDate);
    this.avgProcessingTime = done.length
      ? done.reduce((sum, r) => sum + (new Date(r.trtDate!).getTime() - new Date(r.deliveryDate).getTime()) / 86400000, 0) / done.length
      : 0;

    // Calculate avgUnitPrice, totalPaidAmount, totalUnpaidAmount
    this.avgUnitPrice = this.receptions.length
      ? this.receptions.reduce((sum, r) => sum + (r.unitPrice || 0), 0) / this.receptions.length
      : 0;
    this.totalPaidAmount = this.receptions.reduce((sum, r) => sum + (r.paidAmount || 0), 0);
    this.totalUnpaidAmount = this.receptions.reduce((sum, r) => sum + (r.unpaidAmount || 0), 0);

    // Build each chart
    this.buildStatusChart();
    this.buildTrendChart();
    this.buildTypeChart();
    this.buildVolumeBySupplierChart();
    this.buildVolumeByStorageChart();
    this.buildQualityControlChart();
    this.buildRecentReceptionsChart();
  }

  // -------------------------------------------------------
  // Chart‐building helpers
  // -------------------------------------------------------
  private buildStatusChart(): void {
    const statuses = Array.from(new Set(this.receptions.map((r) => r.status)));
    const counts = statuses.map((s) => this.receptions.filter((r) => r.status === s).length);
    const labels = statuses.map((s) => this.translate.instant(`DASHBOARD.ANALYTICS.STATUS.${s}`));
    // Dynamic color array for statuses
    const statusColors = [this.successColor, this.warningColor, this.primaryColor, this.dangerColor, '#607d8b', '#ff9800'];
    this.receptionsByStatusChartOptions = {
      chart: {
        type: 'pie',
        ...this.chartDimensions[this.currentChartSize]
      },
      series: counts,
      labels,
      colors: statusColors.slice(0, statuses.length),
      title: { text: this.translate.instant('DASHBOARD.ANALYTICS.RECEPTION_STATUS') }
    };
  }

  private buildTrendChart(): void {
    // Choose granularity
    let categories: string[];
    let data: number[];

    if (this.currentReceptionTrendView === 'daily') {
      categories = this.getLastNDates(30);
      data = this.getReceptionsPerDay(this.receptions, 30);
    } else if (this.currentReceptionTrendView === 'weekly') {
      categories = this.getLastNWeeks(12);
      data = this.getReceptionsPerWeek(this.receptions, 12);
    } else {
      categories = this.getLastNMonths(6);
      data = this.getReceptionsPerMonth(this.receptions, 6);
    }

    this.receptionsTrendChartOptions = {
      chart: {
        type: 'area',
        ...this.chartDimensions[this.currentChartSize]
      },
      series: [{ name: this.translate.instant('DASHBOARD.ANALYTICS.TREND'), data }],
      xaxis: { categories },
      colors: [this.primaryColor],
      title: { text: this.translate.instant('DASHBOARD.ANALYTICS.RECEPTION_TREND.TITLE') }
    };
  }

  private buildTypeChart(): void {
    // Use correct type extraction and string conversion
    const types = Array.from(new Set(this.receptions.map((r) => r.operationType)));
    const counts = types.map((t) => this.receptions.filter((r) => r.operationType === t).length);
    // Dynamic color array for types
    const typeColors = [this.primaryColor, this.warningColor, this.successColor, this.dangerColor, '#607d8b', '#ff9800'];
    this.receptionsByTypeChartOptions = {
      chart: {
        type: 'pie',
        ...this.chartDimensions[this.currentChartSize]
      },
      series: counts,
      labels: types.map(t => t ? t.toString() : ''),
      colors: typeColors.slice(0, types.length),
      title: { text: this.translate.instant('DASHBOARD.ANALYTICS.RECEPTION_TYPE') }
    };
  }

  private buildVolumeBySupplierChart(): void {
    // Use supplier.id for matching
    const names = this.suppliers.map((s) => s.supplierInfo.name);
    const volumes = this.suppliers.map((s) =>
      this.receptions.filter((r) => r.supplier && r.supplier.id === s.id).reduce((sum, r) => sum + (r.oilQuantity || 0), 0)
    );
    this.volumeBySupplierChartOptions = {
      chart: {
        type: 'bar',
        ...this.chartDimensions[this.currentChartSize]
      },
      series: [{ name: this.translate.instant('DASHBOARD.ANALYTICS.VOLUME'), data: volumes }],
      xaxis: { categories: names },
      colors: [this.accentColor],
      title: { text: this.translate.instant('DASHBOARD.ANALYTICS.VOLUME_BY_SUPPLIER') }
    };
  }

  private buildVolumeByStorageChart(): void {
    // Use storageUnit?.id for matching
    const names = this.storageUnits.map((s) => s.name);
    const volumes = this.storageUnits.map((s) =>
      this.receptions.filter((r) => r.storageUnit && r.storageUnit.id === s.id).reduce((sum, r) => sum + (r.oilQuantity || 0), 0)
    );
    this.volumeByStorageChartOptions = {
      chart: {
        type: 'bar',
        ...this.chartDimensions[this.currentChartSize]
      },
      series: [{ name: this.translate.instant('DASHBOARD.ANALYTICS.VOLUME'), data: volumes }],
      xaxis: { categories: names },
      colors: [this.accentColor],
      title: { text: this.translate.instant('DASHBOARD.ANALYTICS.VOLUME_BY_STORAGE') }
    };
  }

  private buildQualityControlChart(): void {
    // Count passed/failed based on ruleType and measuredValue
    let passed = 0;
    let failed = 0;
    this.receptions.forEach(r => {
      if (Array.isArray(r.qualityControlResults) && r.qualityControlResults.length > 0) {
        r.qualityControlResults.forEach(qc => {
          const rule = qc.rule;
          if (rule.ruleType === 'BOOLEAN' && rule.booleanValue !== undefined) {
            if (qc.measuredValue === 'true' && rule.booleanValue === true) passed++;
            else failed++;
          } else if (rule.ruleType === 'NUMERIC' && rule.minValue !== undefined && rule.maxValue !== undefined) {
            const val = parseFloat(qc.measuredValue);
            if (!isNaN(val) && val >= rule.minValue && val <= rule.maxValue) passed++;
            else failed++;
          } else {
            // For other types, count as failed for now
            failed++;
          }
        });
      } else {
        failed++;
      }
    });
    this.qualityControlChartOptions = {
      chart: {
        type: 'pie',
        ...this.chartDimensions[this.currentChartSize]
      },
      series: [passed, failed],
      labels: [
        this.translate.instant('DASHBOARD.ANALYTICS.QUALITY_CONTROL.PASSED'),
        this.translate.instant('DASHBOARD.ANALYTICS.QUALITY_CONTROL.FAILED')
      ],
      colors: [this.successColor, this.dangerColor],
      title: { text: this.translate.instant('DASHBOARD.ANALYTICS.QUALITY_CONTROL') }
    };
  }

  private buildRecentReceptionsChart(): void {
    const categories = this.getLastNDates(7);
    const data = this.getReceptionsPerDay(this.receptions, 7);

    this.recentReceptionsChartOptions = {
      chart: {
        type: 'line',
        ...this.chartDimensions[this.currentChartSize]
      },
      series: [{ name: this.translate.instant('DASHBOARD.ANALYTICS.RECENT_RECEPTIONS'), data }],
      xaxis: { categories },
      colors: [this.accentColor],
      tooltip: { enabled: true }
    };
  }

  // -------------------------------------------------------
  // Update chart titles on language change
  // -------------------------------------------------------
  private updateChartLabels(): void {
    if (this.receptionsByStatusChartOptions.title) {
      this.receptionsByStatusChartOptions.title.text = this.translate.instant('DASHBOARD.ANALYTICS.RECEPTION_STATUS');
    }
    if (this.receptionsTrendChartOptions.title) {
      this.receptionsTrendChartOptions.title.text = this.translate.instant('DASHBOARD.ANALYTICS.RECEPTION_TREND.TITLE');
    }
    if (this.receptionsByTypeChartOptions.title) {
      this.receptionsByTypeChartOptions.title.text = this.translate.instant('DASHBOARD.ANALYTICS.RECEPTION_TYPE');
    }
    if (this.volumeBySupplierChartOptions.title) {
      this.volumeBySupplierChartOptions.title.text = this.translate.instant('DASHBOARD.ANALYTICS.VOLUME_BY_SUPPLIER');
    }
    if (this.volumeByStorageChartOptions.title) {
      this.volumeByStorageChartOptions.title.text = this.translate.instant('DASHBOARD.ANALYTICS.VOLUME_BY_STORAGE');
    }
    if (this.qualityControlChartOptions.title) {
      this.qualityControlChartOptions.title.text = this.translate.instant('DASHBOARD.ANALYTICS.QUALITY_CONTROL');
    }
  }

  // -------------------------------------------------------
  // Date‐based helpers
  // -------------------------------------------------------
  private getLastNDates(n: number): string[] {
    const dates: string[] = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }

  private getLastNWeeks(n: number): string[] {
    const weeks: string[] = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const wStart = new Date(now);
      wStart.setDate(now.getDate() - i * 7);
      weeks.push(`W${this.getWeekNumber(wStart)}`);
    }
    return weeks;
  }

  private getLastNMonths(n: number): string[] {
    const months: string[] = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`);
    }
    return months;
  }

  private getReceptionsPerDay(receptions: UnifiedDelivery[], days: number): number[] {
    const labels = this.getLastNDates(days);
    return labels.map((dateStr) => receptions.filter((r) => new Date(r.deliveryDate).toISOString().split('T')[0] === dateStr).length);
  }

  private getReceptionsPerWeek(receptions: UnifiedDelivery[], weeks: number): number[] {
    const labels = this.getLastNWeeks(weeks);
    return labels.map((w) => {
      const weekNum = parseInt(w.slice(1), 10);
      return receptions.filter((r) => {
        const d = new Date(r.deliveryDate);
        return this.getWeekNumber(d) === weekNum;
      }).length;
    });
  }

  private getReceptionsPerMonth(receptions: UnifiedDelivery[], months: number): number[] {
    const labels = this.getLastNMonths(months);
    return labels.map((mStr) => {
      const [year, month] = mStr.split('-').map((x) => +x);
      return receptions.filter((r) => {
        const d = new Date(r.deliveryDate);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      }).length;
    });
  }

  private getVolumePerDay(receptions: UnifiedDelivery[], days: number): number[] {
    const labels = this.getLastNDates(days);
    return labels.map((dateStr) =>
      receptions
        .filter((r) => new Date(r.deliveryDate).toISOString().split('T')[0] === dateStr)
        .reduce((sum, r) => sum + (r.oilQuantity || 0), 0)
    );
  }

  private getWeekNumber(d: Date): number {
    // ISO week number
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  // -------------------------------------------------------
  // Color getters in sync with SCSS variables
  // -------------------------------------------------------
  protected get primaryColor(): string {
    return '#3f51b5';
  }
  protected get warningColor(): string {
    return '#ffa000';
  }
  protected get successColor(): string {
    return '#4caf50';
  }
  protected get dangerColor(): string {
    return '#d32f2f';
  }
  protected get accentColor(): string {
    return '#3f51b5';
  }
}
