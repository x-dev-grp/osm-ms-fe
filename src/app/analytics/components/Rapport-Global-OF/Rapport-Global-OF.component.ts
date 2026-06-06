import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './Rapport-Global-OF.component.html',
  styleUrls: ['./Rapport-Global-OF.component.scss']
})
export class RapportGlobalOFComponent implements OnInit {
  data: {
    totalOf: number;
    plannedOf: number;
    inProgressOf: number;
    completedOf: number;
    canceledOf: number;
    totalTargetQuantity: number;
    totalProducedQuantity: number;
  } | null = null;

  loading = false;
  errorMessage = '';

  statusChartOptions: Partial<ApexOptions> | null = null;
  volumeChartOptions: Partial<ApexOptions> | null = null;

  constructor(
    private analyticsService: AnalyticsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  get hasData(): boolean {
    if (!this.data) {
      return false;
    }

    return Object.values(this.data).some((value) => Number(value || 0) > 0);
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = '';

    this.analyticsService.getGlobalOf({}).subscribe({
      next: (res: any) => {
        const source = res?.data ?? res ?? {};

        this.data = {
          totalOf: Number(source.totalOf ?? source.total_of ?? 0),
          plannedOf: Number(source.plannedOf ?? source.planned_of ?? 0),
          inProgressOf: Number(source.inProgressOf ?? source.in_progress_of ?? 0),
          completedOf: Number(source.completedOf ?? source.completed_of ?? 0),
          canceledOf: Number(source.canceledOf ?? source.canceled_of ?? 0),
          totalTargetQuantity: Number(source.totalTargetQuantity ?? source.total_target_quantity ?? 0),
          totalProducedQuantity: Number(source.totalProducedQuantity ?? source.total_produced_quantity ?? 0)
        };

        this.initCharts();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading global report', err);
        this.data = null;
        this.statusChartOptions = null;
        this.volumeChartOptions = null;
        this.errorMessage = err?.error?.message || err?.message || 'Impossible de charger le rapport global.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  exportPdf(): void {
    this.loading = true;

    this.analyticsService.exportGlobalOfPdf({}).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Rapport_Global_OF.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error exporting PDF', err);
        this.errorMessage = err?.error?.message || err?.message || 'Impossible d exporter le PDF.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private initCharts(): void {
    if (!this.data) {
      this.statusChartOptions = null;
      this.volumeChartOptions = null;
      return;
    }

    this.statusChartOptions = {
      series: [
        this.data.completedOf,
        this.data.inProgressOf,
        this.data.plannedOf,
        this.data.canceledOf
      ],
      chart: { type: 'pie', height: 350 },
      labels: ['Termines', 'En cours', 'Planifies', 'Clotures'],
      colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
      legend: { position: 'bottom' },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val.toFixed(1)}%`
      },
      tooltip: {
        y: { formatter: (val: number) => `${val} OF` }
      }
    };

    this.volumeChartOptions = {
      series: [
        {
          name: 'Volumes',
          data: [this.data.totalTargetQuantity, this.data.totalProducedQuantity]
        }
      ],
      chart: { type: 'bar', height: 350, toolbar: { show: false } },
      colors: ['#64748b', '#10b981'],
      plotOptions: {
        bar: {
          borderRadius: 4,
          horizontal: false,
          distributed: true,
          columnWidth: '40%'
        }
      },
      dataLabels: { enabled: false },
      xaxis: { categories: ['Cible', 'Produit'] },
      tooltip: {
        y: { formatter: (val: number) => `${val.toLocaleString()} L/Kg` }
      },
      legend: { show: false }
    };
  }
}
