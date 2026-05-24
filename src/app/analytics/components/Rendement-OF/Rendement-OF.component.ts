import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-of-yield-report',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './Rendement-OF.component.html',
  styleUrls: ['./Rendement_OF.component.scss']
})
export class OfYieldReportComponent implements OnInit {
  data: any[] = [];
  loading = false;

  statusChartOptions: Partial<ApexOptions> | any;
  yieldChartOptions: Partial<ApexOptions> | any;

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.analyticsService.getOfYields().subscribe({
      next: (res: any) => {
        const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        this.data = rows.map((row: any) => ({
          ...row,
          yieldPercent: Number(row?.yieldPercent ?? row?.yieldPercentage ?? 0),
          quantiteNc: Number(row?.quantiteNc ?? row?.quantiteNC ?? 0)
        }));
        this.initCharts();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading yield report', err);
        this.loading = false;
      }
    });
  }

  exportPdf() {
    this.loading = true;
    this.analyticsService.exportOfYieldsPdf().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Rapport_Rendement_OF.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error exporting PDF', err);
        this.loading = false;
      }
    });
  }

  getBadgeClass(statut: string): string {
    switch(statut) {
      case 'TERMINE': return 'bg-success';
      case 'EN_COURS': return 'bg-primary';
      case 'PLANIFIE': return 'bg-warning text-dark';
      case 'CLOTURE':
      case 'ANNULE': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getProgressBarClass(yieldPercent: number): string {
    if (yieldPercent >= 95) return 'bg-success';
    if (yieldPercent >= 80) return 'bg-warning';
    return 'bg-danger';
  }

  private initCharts() {
    if (!this.data || this.data.length === 0) return;

    // Process data for status pie chart
    const statusCounts = this.data.reduce((acc, curr) => {
      acc[curr.statut] = (acc[curr.statut] || 0) + 1;
      return acc;
    }, {});

    const labels = Object.keys(statusCounts);
    const series = Object.values(statusCounts) as number[];

    this.statusChartOptions = {
      series: series,
      chart: { type: 'donut', height: 320 },
      labels: labels,
      colors: labels.map(l => this.getColorForStatus(l)),
      legend: { position: 'bottom' },
      dataLabels: { enabled: true }
    };

    // Top 10 OFs by Yield
    const sortedData = [...this.data]
      .sort((a, b) => Number(b.yieldPercent || 0) - Number(a.yieldPercent || 0))
      .slice(0, 10);

    this.yieldChartOptions = {
      series: [{
        name: 'Rendement (%)',
        data: sortedData.map(item => Number(item.yieldPercent).toFixed(1))
      }],
      chart: { type: 'bar', height: 320, toolbar: { show: false } },
      plotOptions: {
        bar: {
          borderRadius: 4,
          horizontal: false,
          distributed: true,
        }
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: sortedData.map(item => item.ofCode),
        labels: { style: { fontSize: '10px' } }
      },
      colors: sortedData.map(item => {
        if (item.yieldPercent >= 95) return '#10b981';
        if (item.yieldPercent >= 80) return '#f59e0b';
        return '#ef4444';
      }),
      tooltip: {
        y: { formatter: (val: number) => val + '%' }
      },
      legend: { show: false }
    };
  }

  private getColorForStatus(statut: string): string {
    switch(statut) {
      case 'TERMINE': return '#10b981';
      case 'EN_COURS': return '#3b82f6';
      case 'PLANIFIE': return '#f59e0b';
      case 'CLOTURE':
      case 'ANNULE': return '#ef4444';
      default: return '#64748b';
    }
  }
}
