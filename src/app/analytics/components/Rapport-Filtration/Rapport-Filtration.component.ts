import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-filtration-report',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './Rapport-Filtration.component.html',
  styleUrls: ['./Rapport-Filtration.component.scss']
})
export class RapportFiltrationComponent implements OnInit {
  data: any[] = [];
  loading = false;

  efficiencyChartOptions: Partial<ApexOptions> | any;
  volumeTrendsChartOptions: Partial<ApexOptions> | any;

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    console.log('Loading Filtration Report...');
    this.analyticsService.getFiltration().subscribe({
      next: (res: any) => {
        console.log('Filtration Response:', res);
        this.data = res?.data ? res.data : res;
        this.initCharts();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error', err);
        this.loading = false;
      }
    });
  }

  exportPdf() {
    this.loading = true;
    this.analyticsService.exportFiltrationPdf().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Rapport_Filtrage.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error', err);
        this.loading = false;
      }
    });
  }

  private initCharts() {
    if (!this.data || this.data.length === 0) return;

    // Efficiency Distribution
    let excellent = 0;
    let good = 0;
    let poor = 0;

    this.data.forEach(item => {
      if (item.efficiencyRate >= 98) excellent++;
      else if (item.efficiencyRate >= 95) good++;
      else poor++;
    });

    this.efficiencyChartOptions = {
      series: [excellent, good, poor],
      chart: { type: 'donut', height: 320 },
      labels: ['Excellent (≥98%)', 'Bon (95-97%)', 'Faible (<95%)'],
      colors: ['#10b981', '#f59e0b', '#ef4444'],
      legend: { position: 'bottom' },
      dataLabels: { enabled: true }
    };

    // Volume Trends
    const sortedData = [...this.data]
      .sort((a, b) => new Date(a.operationDate).getTime() - new Date(b.operationDate).getTime())
      .slice(-10); // Last 10 operations

    this.volumeTrendsChartOptions = {
      series: [
        { name: 'Volume Entrant', data: sortedData.map(item => item.inputVolume) },
        { name: 'Volume Sortant', data: sortedData.map(item => item.outputVolume) }
      ],
      chart: { type: 'area', height: 320, toolbar: { show: false } },
      colors: ['#64748b', '#3b82f6'],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      xaxis: {
        categories: sortedData.map(item => new Date(item.operationDate).toLocaleDateString()),
        labels: { style: { fontSize: '10px' } }
      },
      tooltip: {
        y: { formatter: (val: number) => val.toLocaleString() + ' L' }
      },
      legend: { position: 'top' }
    };
  }
}
