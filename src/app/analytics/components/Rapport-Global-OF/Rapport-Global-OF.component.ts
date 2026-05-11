import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  data: any = null;
  loading = false;

  statusChartOptions: Partial<ApexOptions> | any;
  volumeChartOptions: Partial<ApexOptions> | any;

  constructor(private analyticsService: AnalyticsService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    console.log('Loading Global OF Report...');
    this.analyticsService.getGlobalOf({}).subscribe({
      next: (res: any) => {
        console.log('Global OF Response:', res);

        // Handle wrapped ApiResponse or direct DTO
        const d = res?.data ? res.data : res;

        // Support both camelCase and snake_case fallbacks
        this.data = {
          totalOf: Number(d.totalOf ?? d.total_of ?? 0),
          plannedOf: Number(d.plannedOf ?? d.planned_of ?? 0),
          inProgressOf: Number(d.inProgressOf ?? d.in_progress_of ?? 0),
          completedOf: Number(d.completedOf ?? d.completed_of ?? 0),
          canceledOf: Number(d.canceledOf ?? d.canceled_of ?? 0),
          totalTargetQuantity: Number(d.totalTargetQuantity ?? d.total_target_quantity ?? 0),
          totalProducedQuantity: Number(d.totalProducedQuantity ?? d.total_produced_quantity ?? 0)
        };

        this.initCharts();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading global report', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  exportPdf() {
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
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private initCharts() {
    this.statusChartOptions = {
      series: [this.data.completedOf, this.data.inProgressOf, this.data.plannedOf, this.data.canceledOf],
      chart: { type: 'pie', height: 350 },
      labels: ['Terminés', 'En cours', 'Planifiés', 'Clôturés/Annulés'],
      colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
      legend: { position: 'bottom' },
      dataLabels: { enabled: true, formatter: (val: number) => val.toFixed(1) + '%' },
      tooltip: {
        y: { formatter: (val: number) => val + ' OF' }
      }
    };

    this.volumeChartOptions = {
      series: [
        { name: 'Volumes', data: [this.data.totalTargetQuantity, this.data.totalProducedQuantity] }
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
        y: { formatter: (val: number) => val.toLocaleString() + ' L/Kg' }
      },
      legend: { show: false }
    };
  }
}
