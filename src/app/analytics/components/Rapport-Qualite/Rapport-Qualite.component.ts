import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-quality-report',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './Rapport-Qualite.component.html',
  styleUrls: ['./Rapport-Qualite.component.scss']
})
export class RapportQualiteComponent implements OnInit {
  data: any = null;
  loading = false;

  conformityChartOptions: Partial<ApexOptions> | any;

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    console.log('Loading Quality Report...');
    this.analyticsService.getQuality().subscribe({
      next: (res: any) => {
        console.log('Quality Response:', res);
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
    this.analyticsService.exportQualityPdf().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Rapport_Qualite.pdf';
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
    if (!this.data) return;

    let conformeCount = 0;
    let nonConformeCount = 0;

    // data is an object grouping by Control Point
    Object.values(this.data).forEach((results: any) => {
      if (Array.isArray(results)) {
        results.forEach((r: any) => {
          if (r.estConforme) conformeCount++;
          else nonConformeCount++;
        });
      }
    });

    if (conformeCount === 0 && nonConformeCount === 0) return;

    this.conformityChartOptions = {
      series: [conformeCount, nonConformeCount],
      chart: { type: 'donut', height: 320 },
      labels: ['Conforme', 'Non Conforme'],
      colors: ['#10b981', '#ef4444'],
      legend: { position: 'bottom' },
      dataLabels: { enabled: true }
    };
  }
}
