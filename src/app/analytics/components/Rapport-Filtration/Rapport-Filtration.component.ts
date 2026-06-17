import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { AnalyticsService } from '../../services/analytics.service';
import { TranslateModule } from '@ngx-translate/core';

type FiltrationRow = {
  operationId: string;
  operationDate: string | null;
  inputVolume: number;
  outputVolume: number;
  lossVolume: number;
  efficiencyRate: number;
  operationLabel: string;
  operationDateLabel: string;
};

@Component({
  selector: 'app-filtration-report',
  standalone: true,
  imports: [TranslateModule, CommonModule, NgApexchartsModule],
  templateUrl: './Rapport-Filtration.component.html',
  styleUrls: ['./Rapport-Filtration.component.scss']
})
export class RapportFiltrationComponent implements OnInit {
  private readonly i18n = inject(TranslateService);
  data: FiltrationRow[] = [];
  loading = false;
  errorMessage = '';

  efficiencyChartOptions: Partial<ApexOptions> | null = null;
  volumeTrendsChartOptions: Partial<ApexOptions> | null = null;

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

    this.analyticsService.getFiltration().subscribe({
      next: (res: any) => {
        const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];

        this.data = rows.map((row: any, index: number) => {
          const operationDate = row?.operationDate ? String(row.operationDate) : null;
          return {
            operationId: String(row?.operationId ?? ''),
            operationDate,
            inputVolume: Number(row?.inputVolume ?? 0),
            outputVolume: Number(row?.outputVolume ?? 0),
            lossVolume: Number(row?.lossVolume ?? 0),
            efficiencyRate: Number(row?.efficiencyRate ?? 0),
            operationLabel: this.buildOperationLabel(operationDate, index),
            operationDateLabel: this.formatOperationDate(operationDate)
          };
        });

        this.initCharts();
        this.loading = false;
      },
      error: (err) => {
        this.data = [];
        this.efficiencyChartOptions = null;
        this.volumeTrendsChartOptions = null;
        this.errorMessage = err?.error?.message || err?.message || this.i18n.instant('AUTO.IMPOSSIBLE_DE_CHARGER_LE_RAPPORT_DE_FILTRATION');
        this.loading = false;
      }
    });
  }

  exportPdf(): void {
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
        this.errorMessage = err?.error?.message || err?.message || this.i18n.instant('AUTO.IMPOSSIBLE_D_EXPORTER_LE_PDF');
        this.loading = false;
      }
    });
  }

  private initCharts(): void {
    if (!this.data.length) {
      this.efficiencyChartOptions = null;
      this.volumeTrendsChartOptions = null;
      return;
    }

    let excellent = 0;
    let good = 0;
    let poor = 0;

    this.data.forEach((item) => {
      if (item.efficiencyRate >= 98) excellent++;
      else if (item.efficiencyRate >= 95) good++;
      else poor++;
    });

    this.efficiencyChartOptions = {
      series: [excellent, good, poor],
      chart: { type: 'donut', height: 320 },
      labels: ['Excellent (>=98%)', 'Bon (95-97%)', 'Faible (<95%)'],
      colors: ['#10b981', '#f59e0b', '#ef4444'],
      legend: { position: 'bottom' },
      dataLabels: { enabled: true }
    };

    const sortedData = [...this.data]
      .sort((a, b) => this.timeValue(a.operationDate) - this.timeValue(b.operationDate))
      .slice(-10);

    this.volumeTrendsChartOptions = {
      series: [
        { name: 'Volume entrant', data: sortedData.map((item) => item.inputVolume) },
        { name: 'Volume sortant', data: sortedData.map((item) => item.outputVolume) }
      ],
      chart: { type: 'area', height: 320, toolbar: { show: false } },
      colors: ['#64748b', '#3b82f6'],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      xaxis: {
        categories: sortedData.map((item) => this.chartDateLabel(item.operationDate, item.operationLabel)),
        labels: { style: { fontSize: '10px' } }
      },
      tooltip: {
        y: { formatter: (val: number) => `${val.toLocaleString()} L` }
      },
      legend: { position: 'top' }
    };
  }

  private buildOperationLabel(operationDate: string | null, index: number): string {
    if (operationDate) {
      const parsed = new Date(operationDate);
      if (!Number.isNaN(parsed.getTime())) {
        return `Operation ${index + 1}`;
      }
    }

    return `Operation ${index + 1}`;
  }

  private formatOperationDate(operationDate: string | null): string {
    if (!operationDate) {
      return '-';
    }

    const parsed = new Date(operationDate);
    if (Number.isNaN(parsed.getTime())) {
      return '-';
    }

    return parsed.toLocaleString();
  }

  private chartDateLabel(operationDate: string | null, fallback: string): string {
    if (operationDate) {
      const parsed = new Date(operationDate);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString();
      }
    }

    return fallback;
  }

  private timeValue(operationDate: string | null): number {
    if (!operationDate) {
      return 0;
    }

    const parsed = new Date(operationDate).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }
}
