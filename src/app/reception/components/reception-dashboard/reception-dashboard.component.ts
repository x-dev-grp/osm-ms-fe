import { Component, OnInit, OnDestroy, inject } from '@angular/core';
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
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { UnifiedDelivery } from '../../../shared/models/UnifiedDelivery';
import { StorageUnitDto } from '../../../shared/models/StorageUnitDto';
import { SupplierType } from '../../../shared/models/supplier-type';
import { OliveLotStatus } from '../../../shared/models/OliveLotStatus';
import { UnifiedDeliveryService } from '../../../shared/services/delivery.service';
import { SupplierTypeService } from '../../../shared/services/supplier.service';
import { StorageUnitDtoService } from '../../../shared/services/storage.service';
import { EarningChartComponent } from '../../../demo/pages/apex-chart/earning-chart/earning-chart.component';
import { CardComponent } from '../../../@theme/components/card/card.component';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
// Step 1: Import Gridster types
import { GridsterConfig, GridsterItem } from 'angular-gridster2';

// Define DashboardCard interface for CDK-based dashboard
// Remove DashboardCard interface and CDK imports

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
    // GridsterModule removed as it's not used directly here
  ]
})
export class ReceptionDashboardComponent implements OnInit, OnDestroy {
  isLoading = true;
  error: string | null = null;
  destroy$ = new Subject<void>();

  receptions: UnifiedDelivery[] = [];
  suppliers: SupplierType[] = [];
  storageUnits: StorageUnitDto[] = [];

  // Summary stats
  totalReceptions = 0;
  pendingReceptions = 0;
  completedReceptions = 0;
  totalVolume = 0;

  // Chart data (for earning charts that take array of numbers)
  receptionsPerDay: number[] = [];
  pendingReceptionsPerDay: number[] = [];
  completedReceptionsPerDay: number[] = [];
  volumePerDay: number[] = [];

  // Chart data (for apx-charts)
  supplierNames: string[] = [];
  supplierVolumes: number[] = [];
  storageNames: string[] = [];
  storageUtilization: number[] = [];

  // Recent receptions
  recentReceptions: UnifiedDelivery[] = [];

  // New KPIs
  avgVolumePerReception = 0;
  avgUnitPrice = 0;
  totalPaidAmount = 0;
  totalUnpaidAmount = 0;
  uniqueSuppliers = 0;
  storageUnitsUsed = 0;
  avgProcessingTime = 0;

  // Chart options
  receptionsByStatusChartOptions: Partial<ApexOptions> = {};
  volumeBySupplierChartOptions: Partial<ApexOptions> = {};
  volumeByStorageChartOptions: Partial<ApexOptions> = {};
  receptionsByTypeChartOptions: Partial<ApexOptions> = {};
  receptionsTrendChartOptions: Partial<ApexOptions> = {};
  qualityControlChartOptions: Partial<ApexOptions> = {};
  recentReceptionsChartOptions: Partial<ApexOptions> = {};

  currentReceptionTrendView: 'monthly' | 'weekly' | 'daily' = 'monthly';

  // Step 1: Add gridOptions and cards array
  gridOptions: GridsterConfig = {
    draggable: { enabled: true },
    resizable: { enabled: true },
    pushItems: true,
    swap: true,
    minCols: 6,
    minRows: 6,
    // You can adjust these options as needed
  };

  cards: GridsterItem[] = [
    // Example cards, will fill with real data in next steps
    { x: 0, y: 0, cols: 2, rows: 2, title: 'Total Receptions', type: 'kpi' },
    { x: 2, y: 0, cols: 2, rows: 2, title: 'Pending Receptions', type: 'kpi' },
    // Add more cards as needed
  ];

  private deliveryService = inject(UnifiedDeliveryService);
  private supplierService = inject(SupplierTypeService);
  private storageService = inject(StorageUnitDtoService);
  private translate = inject(TranslateService);

  // Central color map for statuses
  private statusColorMap: Record<string, string> = {
    COMPLETED: '#4CAF50',
    IN_PROGRESS: '#FFC107',
    CANCELLED: '#F44336',
    NEW: '#2196F3',
    REFUSED: '#9C27B0',
    INCONNU: '#BDBDBD'
  };

  constructor() {
    console.log('ReceptionDashboardComponent constructor called');
    // Subscribe to language changes
    this.translate.onLangChange.subscribe(() => {
      this.updateChartLabels();
    });
  }

  ngOnInit(): void {
    console.log('ReceptionDashboardComponent ngOnInit called');
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateChartLabels() {
    // Update chart labels when language changes
    this.translate.get([
      'DASHBOARD.ANALYTICS.RECEPTION_STATUS',
      'DASHBOARD.ANALYTICS.RECEPTION_TYPE',
      'DASHBOARD.ANALYTICS.VOLUME_BY_SUPPLIER',
      'DASHBOARD.ANALYTICS.VOLUME_BY_STORAGE',
      'DASHBOARD.ANALYTICS.QUALITY_CONTROL',
      'DASHBOARD.ANALYTICS.RECENT_RECEPTIONS',
      'DASHBOARD.ANALYTICS.RECEPTION_TREND.TITLE'
    ]).subscribe(translations => {
      // Update reception status chart
      if (this.receptionsByStatusChartOptions) {
        this.receptionsByStatusChartOptions = {
          ...this.receptionsByStatusChartOptions,
          title: { text: translations['DASHBOARD.ANALYTICS.RECEPTION_STATUS'] }
        };
      }

      // Update reception type chart
      if (this.receptionsByTypeChartOptions) {
        this.receptionsByTypeChartOptions = {
          ...this.receptionsByTypeChartOptions,
          title: { text: translations['DASHBOARD.ANALYTICS.RECEPTION_TYPE'] }
        };
      }

      // Update volume by supplier chart
      if (this.volumeBySupplierChartOptions) {
        this.volumeBySupplierChartOptions = {
          ...this.volumeBySupplierChartOptions,
          title: { text: translations['DASHBOARD.ANALYTICS.VOLUME_BY_SUPPLIER'] }
        };
      }

      // Update volume by storage chart
      if (this.volumeByStorageChartOptions) {
        this.volumeByStorageChartOptions = {
          ...this.volumeByStorageChartOptions,
          title: { text: translations['DASHBOARD.ANALYTICS.VOLUME_BY_STORAGE'] }
        };
      }

      // Update quality control chart
      if (this.qualityControlChartOptions) {
        this.qualityControlChartOptions = {
          ...this.qualityControlChartOptions,
          title: { text: translations['DASHBOARD.ANALYTICS.QUALITY_CONTROL'] }
        };
      }

      // Update recent receptions chart
      if (this.recentReceptionsChartOptions) {
        this.recentReceptionsChartOptions = {
          ...this.recentReceptionsChartOptions,
          title: { text: translations['DASHBOARD.ANALYTICS.RECENT_RECEPTIONS'] }
        };
      }

      // Update reception trend chart
      if (this.receptionsTrendChartOptions) {
        this.receptionsTrendChartOptions = {
          ...this.receptionsTrendChartOptions,
          title: { text: translations['DASHBOARD.ANALYTICS.RECEPTION_TREND.TITLE'] }
        };
      }
    });
  }

  loadData() {
    console.log('loadData called');
    this.isLoading = true;
    this.error = null;
    forkJoin({
      deliveries: this.deliveryService.getAllDeliveriesList().pipe(catchError(() => of({ data: [] }))),
      suppliers: this.supplierService.getAllSuppliers().pipe(catchError(() => of({ data: [] }))),
      storage: this.storageService.getAllStorageUnit().pipe(catchError(() => of({ data: [] })))
    })
      .pipe(finalize(() => (this.isLoading = false)), takeUntil(this.destroy$))
      .subscribe({
        next: ({ deliveries, suppliers, storage }) => {
          this.receptions = Array.isArray(deliveries.data) ? deliveries.data : [deliveries.data];
          this.suppliers = Array.isArray(suppliers.data) ? suppliers.data : [suppliers.data];
          this.storageUnits = Array.isArray(storage.data) ? storage.data : [storage.data];
          // Compute per-day arrays for sparklines
          this.receptionsPerDay = this.getReceptionsPerDay(this.receptions, 7);
          this.pendingReceptionsPerDay = this.getReceptionsPerDay(this.receptions.filter(r => r.status === OliveLotStatus.IN_PROGRESS), 7);
          this.completedReceptionsPerDay = this.getReceptionsPerDay(this.receptions.filter(r => r.status === 'COMPLETED'), 7);
          this.volumePerDay = this.getVolumePerDay(this.receptions, 7);
          console.log('Receptions:', this.receptions);
          console.log('Suppliers:', this.suppliers);
          console.log('Storage Units:', this.storageUnits);
          this.prepareStatsAndCharts();
        },
        error: () => {
          this.error = 'Erreur lors du chargement des données';
        }
      });
  }

  getReceptionsPerDay(receptions: UnifiedDelivery[], days: number = 7): number[] {
    const counts = Array(days).fill(0);
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      const dayStr = day.toISOString().split('T')[0];
      counts[days - i - 1] = receptions.filter(r => r.deliveryDate && new Date(r.deliveryDate).toISOString().split('T')[0] === dayStr).length;
    }
    return counts;
  }

  getVolumePerDay(receptions: UnifiedDelivery[], days: number = 7): number[] {
    const volumes = Array(days).fill(0);
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      const dayStr = day.toISOString().split('T')[0];
      volumes[days - i - 1] = receptions
        .filter(r => r.deliveryDate && new Date(r.deliveryDate).toISOString().split('T')[0] === dayStr)
        .reduce((sum, r) => sum + (r.oilQuantity || 0), 0);
    }
    return volumes;
  }

  prepareStatsAndCharts() {
    console.log('prepareStatsAndCharts called');
    // Summary stats
    this.totalReceptions = this.receptions.length;
    this.pendingReceptions = this.receptions.filter(r => r.status === OliveLotStatus.IN_PROGRESS).length;
    this.completedReceptions = this.receptions.filter(r => r.status === 'COMPLETED').length;
    this.totalVolume = this.receptions.reduce((sum, r) => sum + (r.oilQuantity || 0), 0);

    // Recent receptions (last 5)
    this.recentReceptions = [...this.receptions]
      .sort((a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime())
      .slice(0, 5);

    // KPIs
    this.avgVolumePerReception = this.receptions.length ? this.totalVolume / this.receptions.length : 0;
    this.avgUnitPrice = this.receptions.length ? (this.receptions.reduce((sum, r) => sum + (r.unitPrice || 0), 0) / this.receptions.length) : 0;
    this.totalPaidAmount = this.receptions.reduce((sum, r) => sum + (r.paidAmount || 0), 0);
    this.totalUnpaidAmount = this.receptions.reduce((sum, r) => sum + (r.unpaidAmount || 0), 0);
    this.uniqueSuppliers = new Set(this.receptions.map(r => r.supplier?.id)).size;
    this.storageUnitsUsed = new Set(this.receptions.map(r => r.storageUnit?.id)).size;
    // Average processing time (in days)
    const completed = this.receptions.filter(r => r.status === 'COMPLETED' && r.deliveryDate && r.trtDate);
    this.avgProcessingTime = completed.length ? (completed.reduce((sum, r) => sum + ((new Date(r.trtDate!).getTime() - new Date(r.deliveryDate).getTime()) / (1000 * 60 * 60 * 24)), 0) / completed.length) : 0;

    // Initial setup for Receptions Trend chart (Monthly view)
    this.updateReceptionTrendView('monthly');

    // Receptions by status (Pie)
    const statusCounts: Record<string, number> = {};
    this.receptions.forEach(r => {
      const status = r.status || 'INCONNU';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    const statusKeys = Object.keys(statusCounts);
    this.translate.get(statusKeys.map(s => this.getStatusTranslationKey(s))).subscribe(translatedLabels => {
      this.receptionsByStatusChartOptions = {
        series: statusKeys.map(s => statusCounts[s]),
        chart: { type: 'pie', height: 200 },
        labels: statusKeys.map(s => translatedLabels[this.getStatusTranslationKey(s)] || s),
        colors: statusKeys.map(s => this.getStatusColor(s))
      };
    });

    // Supplier performance
    const supplierMap = new Map<string, number>();
    this.receptions.forEach(r => {
      const name = r.supplier?.supplierInfo?.name || 'Inconnu';
      supplierMap.set(name, (supplierMap.get(name) || 0) + (r.oilQuantity || 0));
    });
    this.supplierNames = Array.from(supplierMap.keys());
    this.supplierVolumes = Array.from(supplierMap.values());
    this.volumeBySupplierChartOptions = {
      series: [{ name: 'Volume', data: this.supplierVolumes }],
      chart: { type: 'bar', height: 200 },
      xaxis: { categories: this.supplierNames },
      colors: ['var(--primary-500)']
    };

    // Storage utilization
    this.storageNames = this.storageUnits.map(s => s.name);
    this.storageUtilization = this.storageUnits.map(s =>
      s.maxCapacity ? Math.round((s.currentVolume / s.maxCapacity) * 100) : 0
    );
    this.volumeByStorageChartOptions = {
      series: [{ name: 'Utilisation', data: this.storageUtilization }],
      chart: { type: 'bar', height: 200 },
      xaxis: { categories: this.storageNames },
      colors: ['var(--info-500)']
    };

    // Receptions by type (Bar)
    const typeMap = new Map<string, number>();
    this.receptions.forEach(r => {
      const type = r.deliveryType || 'INCONNU';
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    });
    this.receptionsByTypeChartOptions = {
      series: [{ name: 'Réceptions', data: Array.from(typeMap.values()) }],
      chart: { type: 'bar', height: 200 },
      xaxis: { categories: Array.from(typeMap.keys()) },
      colors: ['var(--success-500)']
    };

    // Quality control results distribution (Pie)
    const qcMap: Record<string, number> = {};
    this.receptions.forEach(r => {
      if (r.qualityControlResults && r.qualityControlResults.length > 0) {
        r.qualityControlResults.forEach(qc => {
          const rule = qc.rule?.toString() || 'INCONNU';
          qcMap[rule] = (qcMap[rule] || 0) + 1;
        });
      }
    });
    this.qualityControlChartOptions = {
      series: Object.values(qcMap),
      chart: { type: 'pie', height: 200 },
      labels: Object.keys(qcMap),
      colors: ['#4CAF50', '#FFC107', '#F44336', '#2196F3', '#9C27B0']
    };

    // Populate recentReceptionsChartOptions
    this.recentReceptionsChartOptions = {
      series: [{
        name: 'Quantité d\'huile',
        data: this.recentReceptions.map(r => r.oilQuantity || 0)
      }],
      chart: {
        type: 'bar',
        height: 250,
        toolbar: { show: false }
      },
      xaxis: {
        categories: this.recentReceptions.map(r => `Lot ${r.lotNumber} (${r.supplier?.supplierInfo?.name || 'Inconnu'})`),
        labels: { rotate: -45, trim: true, hideOverlappingLabels: true }
      },
      yaxis: { title: { text: 'Quantité (T)' } },
      tooltip: {
        y: { formatter: (val: number) => val.toFixed(2) + ' T' }
      },
      colors: ['var(--secondary-500)']
    };

    // Log chart data for debugging
    console.log('receptionsPerDay', this.receptionsPerDay);
    console.log('volumePerDay', this.volumePerDay);
    console.log('supplierVolumes', this.supplierVolumes);
    console.log('storageUtilization', this.storageUtilization);
  }

  updateReceptionTrendView(view: 'monthly' | 'weekly' | 'daily') {
    this.currentReceptionTrendView = view;
    const data = this.getReceptionsTrendData(this.receptions, view);
    this.receptionsTrendChartOptions = {
      series: [{ name: 'Réceptions', data: data.data }],
      chart: { type: 'line', height: 200, toolbar: { show: false } },
      xaxis: { categories: data.categories },
      colors: ['var(--primary-500)']
    };
  }

  private getReceptionsTrendData(receptions: UnifiedDelivery[], view: 'monthly' | 'weekly' | 'daily') {
    if (view === 'monthly') {
      return this.generateMonthlyReceptionsTrend(receptions);
    } else if (view === 'weekly') {
      return this.generateWeeklyReceptionsTrend(receptions);
    } else {
      return this.generateDailyReceptionsTrend(receptions);
    }
  }

  private generateMonthlyReceptionsTrend(receptions: UnifiedDelivery[]): { categories: string[], data: number[] } {
    const monthlyCounts: Record<string, number> = {};
    const last12Months = this.getLastNMonths(12);

    last12Months.forEach(month => monthlyCounts[month] = 0);

    receptions.forEach(r => {
      const month = new Date(r.deliveryDate).toLocaleString('fr-FR', { year: 'numeric', month: 'short' });
      monthlyCounts[month]++;
    });

    return { categories: last12Months, data: last12Months.map(month => monthlyCounts[month]) };
  }

  private generateWeeklyReceptionsTrend(receptions: UnifiedDelivery[]): { categories: string[], data: number[] } {
    const weeklyCounts: Record<string, number> = {};
    const last14Days = this.getLastNDates(14);

    last14Days.forEach(date => {
      const week = this.getWeekNumber(date);
      weeklyCounts[week] = 0;
    });

    receptions.forEach(r => {
      const date = new Date(r.deliveryDate);
      const week = this.getWeekNumber(date);
      weeklyCounts[week]++;
    });

    const categories = last14Days.map(date => {
      const week = this.getWeekNumber(date);
      return `Sem. ${week} (${date.getDate()}/${date.getMonth() + 1})`;
    });

    return { categories, data: last14Days.map(date => weeklyCounts[this.getWeekNumber(date)]) };
  }

  private getWeekNumber(date: Date): string {
    date = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    // (Sunday is 0)
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    // Get full year number in ISO-8601 year numbering.
    const yearStart = new Date(Date.UTC(date.getFullYear(), 0, 1));
    // Calculate full weeks to the nearest Thursday
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${date.getFullYear()}-${weekNo}`;
  }

  private generateDailyReceptionsTrend(receptions: UnifiedDelivery[]): { categories: string[], data: number[] } {
    const dailyCounts: Record<string, number> = {};
    const last14Days = this.getLastNDates(14);

    last14Days.forEach(date => dailyCounts[date.toISOString().split('T')[0]] = 0);

    receptions.forEach(r => {
      const date = new Date(r.deliveryDate).toISOString().split('T')[0];
      dailyCounts[date]++;
    });

    return { categories: last14Days.map(d => d.toLocaleDateString('fr-FR')), data: last14Days.map(d => dailyCounts[d.toISOString().split('T')[0]]) };
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

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
  }

  // Helper: Map status code to translation key (correct path)
  private getStatusTranslationKey(status: string): string {
    return `DASHBOARD.OIL_RECEPTION.DASHBOARD.STATUS.${status}`;
  }

  // Helper: Get color for status
  private getStatusColor(status: string): string {
    return this.statusColorMap[status] || this.statusColorMap['INCONNU'];
  }

  get primaryColor() {
    return ['var(--primary-500)'];
  }

  get warningColor() {
    return ['var(--warning-500)'];
  }

  get successColor() {
    return ['var(--success-500)'];
  }

  get infoColor() {
    return ['var(--info-500)'];
  }

  // Currency formatting getters for dashboard display
  get formattedAvgUnitPrice(): string {
    return this.avgUnitPrice.toFixed(2) + ' TND';
  }

  get formattedTotalPaidAmount(): string {
    return this.totalPaidAmount.toFixed(2) + ' TND';
  }

  get formattedTotalUnpaidAmount(): string {
    return this.totalUnpaidAmount.toFixed(2) + ' TND';
  }

  // Remove drop, getCardStyle, and startResize methods
}
