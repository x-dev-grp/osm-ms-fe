import { Component, inject, OnInit } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';
import { AnalyticsService } from '../../services/analytics.service';
import { ArticleService } from '../../../stock/services/article.service';

type BomGapRow = {
  materialName: string;
  plannedQuantity: number;
  actualQuantity: number;
  gapQuantity: number;
  gapPercentage: number;
};

@Component({
  selector: 'app-bom-gap-report',
  standalone: true,
  imports: [TranslateModule, CommonModule, NgApexchartsModule],
  templateUrl: './rapport-bom.component.html',
  styleUrls: ['./rapport-bom.component.scss']
})
export class RapportBomComponent implements OnInit {
  private readonly i18n = inject(TranslateService);
  data: BomGapRow[] = [];
  loading = false;
  errorMessage = '';
  private articleNamesByPrefix: Record<string, string> = {};

  distributionChartOptions: Partial<ApexOptions> | null = null;
  topGapsChartOptions: Partial<ApexOptions> | null = null;

  constructor(
    private analyticsService: AnalyticsService,
    private articleService: ArticleService
  ) {}

  ngOnInit(): void {
    this.loadArticleNames();
    this.loadData();
  }

  get hasData(): boolean {
    return this.data.length > 0;
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = '';

    this.analyticsService.getBomGap().subscribe({
      next: (res: any) => {
        const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        this.data = rows.map((row: any) => ({
          materialName: this.formatMaterialName(String(row?.materialName ?? '-')),
          plannedQuantity: Number(row?.plannedQuantity ?? row?.theoreticalQuantity ?? 0),
          actualQuantity: Number(row?.actualQuantity ?? 0),
          gapQuantity: Number(row?.gapQuantity ?? 0),
          gapPercentage: Number(row?.gapPercentage ?? 0)
        }));

        this.initCharts();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading BOM gap report', err);
        this.data = [];
        this.distributionChartOptions = null;
        this.topGapsChartOptions = null;
        this.errorMessage = err?.error?.message || err?.message || this.i18n.instant('AUTO.IMPOSSIBLE_DE_CHARGER_LE_RAPPORT_BOM');
        this.loading = false;
      }
    });
  }

  exportPdf(): void {
    this.loading = true;

    this.analyticsService.exportBomGapPdf().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Rapport_Ecarts_BOM.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error exporting BOM gap PDF', err);
        this.errorMessage = err?.error?.message || err?.message || this.i18n.instant('AUTO.IMPOSSIBLE_D_EXPORTER_LE_PDF');
        this.loading = false;
      }
    });
  }

  private initCharts(): void {
    if (!this.data.length) {
      this.distributionChartOptions = null;
      this.topGapsChartOptions = null;
      return;
    }

    let surconsommation = 0;
    let sousconsommation = 0;
    let conforme = 0;

    this.data.forEach((item) => {
      if (item.gapPercentage > 0) surconsommation++;
      else if (item.gapPercentage < 0) sousconsommation++;
      else conforme++;
    });

    this.distributionChartOptions = {
      series: [surconsommation, sousconsommation, conforme],
      chart: { type: 'donut', height: 320 },
      labels: ['Surconsommation (>0%)', 'Sous-consommation (<0%)', 'Conforme (0%)'],
      colors: ['#ef4444', '#10b981', '#64748b'],
      legend: { position: 'bottom' },
      dataLabels: { enabled: true }
    };

    const sortedData = [...this.data].sort((a, b) => Math.abs(b.gapPercentage) - Math.abs(a.gapPercentage)).slice(0, 10);

    this.topGapsChartOptions = {
      series: [
        {
          name: 'Ecart (%)',
          data: sortedData.map((item) => Number(item.gapPercentage))
        }
      ],
      chart: { type: 'bar', height: 320, toolbar: { show: false } },
      plotOptions: {
        bar: {
          borderRadius: 4,
          horizontal: false,
          distributed: true,
          colors: {
            ranges: [
              { from: -100, to: -0.01, color: '#10b981' },
              { from: 0.01, to: 1000, color: '#ef4444' }
            ]
          }
        }
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: sortedData.map((item) => this.chartLabel(item.materialName)),
        labels: { style: { fontSize: '10px' } }
      },
      tooltip: {
        y: { formatter: (val: number) => `${val}%` }
      },
      legend: { show: false }
    };
  }

  private chartLabel(value: string): string {
    const cleaned = (value || '-').trim();
    return cleaned.length > 18 ? `${cleaned.substring(0, 18)}...` : cleaned;
  }

  private loadArticleNames(): void {
    this.articleService.getActiveArticles().subscribe({
      next: (articles) => {
        this.articleNamesByPrefix = (articles || []).reduce((acc: Record<string, string>, article: any) => {
          const id = String(article?.id || '')
            .trim()
            .toLowerCase();
          const name = String(article?.nom || '').trim();
          if (id.length >= 8 && name) {
            acc[id.substring(0, 8)] = name;
          }
          return acc;
        }, {});

        if (this.data.length) {
          this.data = this.data.map((row) => ({
            ...row,
            materialName: this.formatMaterialName(row.materialName)
          }));
          this.initCharts();
        }
      },
      error: (err) => {
        console.error('Error loading article names for BOM gap report', err);
      }
    });
  }

  private formatMaterialName(value: string): string {
    const raw = (value || '-').trim();
    const match = raw.match(/^Article\s+([0-9a-f]{8})\b/i);
    if (!match) {
      return raw;
    }

    const prefix = match[1].toLowerCase();
    const articleName = this.articleNamesByPrefix[prefix];
    if (!articleName) {
      return raw;
    }

    return raw.replace(/^Article\s+[0-9a-f]{8}/i, articleName);
  }
}
