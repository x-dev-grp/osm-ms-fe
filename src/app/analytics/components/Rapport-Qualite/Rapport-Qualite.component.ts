import { Component, inject, OnInit } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';
import { AnalyticsService } from '../../services/analytics.service';

type QualityRow = {
  productName: string;
  totalControls: number;
  failedControls: number;
  nonConformityRate: number;
  conformControls: number;
};

@Component({
  selector: 'app-quality-report',
  standalone: true,
  imports: [TranslateModule, CommonModule, NgApexchartsModule],
  templateUrl: './Rapport-Qualite.component.html',
  styleUrls: ['./Rapport-Qualite.component.scss']
})
export class RapportQualiteComponent implements OnInit {
  private readonly i18n = inject(TranslateService);
  data: QualityRow[] = [];
  loading = false;
  errorMessage = '';

  conformityChartOptions: Partial<ApexOptions> | null = null;

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    this.loadData();
  }

  get hasData(): boolean {
    return this.data.length > 0;
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = '';

    this.analyticsService.getQuality().subscribe({
      next: (res: any) => {
        const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];

        this.data = rows.map((row: any) => {
          const totalControls = Number(row?.totalControls ?? 0);
          const failedControls = Number(row?.failedControls ?? 0);
          const nonConformityRate = Number(row?.nonConformityRate ?? 0);

          return {
            productName: String(row?.productName ?? '-'),
            totalControls,
            failedControls,
            nonConformityRate,
            conformControls: Math.max(0, totalControls - failedControls)
          };
        });

        this.initCharts();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading quality report', err);
        this.data = [];
        this.conformityChartOptions = null;
        this.errorMessage = err?.error?.message || err?.message || this.i18n.instant('AUTO.IMPOSSIBLE_DE_CHARGER_LE_RAPPORT_QUALITE');
        this.loading = false;
      }
    });
  }

  exportPdf(): void {
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
        console.error('Error exporting PDF', err);
        this.errorMessage = err?.error?.message || err?.message || this.i18n.instant('AUTO.IMPOSSIBLE_D_EXPORTER_LE_PDF');
        this.loading = false;
      }
    });
  }

  getConformityRate(row: QualityRow): number {
    return Math.max(0, 100 - row.nonConformityRate);
  }

  getRateBarClass(rate: number): string {
    if (rate >= 95) return 'bg-success';
    if (rate >= 80) return 'bg-warning';
    return 'bg-danger';
  }

  private initCharts(): void {
    if (!this.data.length) {
      this.conformityChartOptions = null;
      return;
    }

    const conformeCount = this.data.reduce((sum, row) => sum + row.conformControls, 0);
    const nonConformeCount = this.data.reduce((sum, row) => sum + row.failedControls, 0);

    if (conformeCount === 0 && nonConformeCount === 0) {
      this.conformityChartOptions = null;
      return;
    }

    this.conformityChartOptions = {
      series: [conformeCount, nonConformeCount],
      chart: { type: 'donut', height: 320 },
      labels: ['Conforme', 'Non conforme'],
      colors: ['#10b981', '#ef4444'],
      legend: { position: 'bottom' },
      dataLabels: { enabled: true }
    };
  }
}
