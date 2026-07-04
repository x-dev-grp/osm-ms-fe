import { Component, effect, inject, input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { CardComponent } from '../../../theme/components/card/card.component';
import { ThemeLayoutService } from '../../../theme/services/theme-layout.service';
import { DARK, LIGHT } from '../../../theme/const';

export interface FinanceOverviewWidget {
  title: string;
  count: string;
  subLabel: string;
  percentage?: number;
  isLoss?: boolean;
  color?: string;
}

@Component({
  selector: 'app-finance-overview-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule, NgApexchartsModule, CardComponent],
  templateUrl: './finance-overview-chart.component.html',
  styleUrl: './finance-overview-chart.component.scss'
})
export class FinanceOverviewChartComponent implements OnInit, OnChanges {
  private readonly themeService = inject(ThemeLayoutService);

  readonly widgets = input.required<FinanceOverviewWidget[]>();
  readonly categories = input.required<string[]>();
  readonly columnSeries = input.required<number[]>();
  readonly lineSeries = input.required<number[]>();
  readonly columnLabel = input('Count');
  readonly lineLabel = input('Amount');

  chartOptions: Partial<ApexOptions> = {};
  activeIndex = 0;
  cardBackground = 'bg-accent-100';

  constructor() {
    effect(() => {
      this.applyTheme(this.themeService.isDarkMode());
    });
  }

  ngOnInit(): void {
    this.buildChart();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.buildChart();
  }

  selectWidget(index: number): void {
    this.activeIndex = index;
  }

  private buildChart(): void {
    const categories = this.categories();
    const columnData = this.columnSeries();
    const lineData = this.lineSeries();

    this.chartOptions = {
      chart: {
        height: 300,
        type: 'line',
        stacked: false,
        toolbar: { show: false }
      },
      plotOptions: {
        bar: { columnWidth: '50%' }
      },
      legend: { show: false },
      stroke: { width: [0, 4], curve: 'smooth' },
      dataLabels: { enabled: false },
      series: [
        { name: this.columnLabel(), type: 'column', data: columnData },
        { name: this.lineLabel(), type: 'line', data: lineData }
      ],
      fill: {
        type: 'gradient',
        gradient: {
          inverseColors: false,
          shade: 'light',
          type: 'vertical',
          opacityFrom: [0, 1],
          opacityTo: [0.35, 1]
        }
      },
      markers: {
        size: 3,
        colors: ['#fff'],
        strokeColors: 'var(--primary-500)',
        strokeWidth: 2,
        shape: 'circle',
        hover: { size: 5 }
      },
      colors: ['var(--primary-500)', 'var(--primary-500)'],
      yaxis: {
        labels: { style: { colors: ['#8996a4'] } }
      },
      grid: { show: true, borderColor: '#f3f5f7' },
      xaxis: {
        categories,
        labels: {
          style: {
            colors: categories.map(() => '#8996a4')
          }
        },
        axisBorder: { show: false, color: '#f3f5f7' }
      },
      tooltip: { theme: 'light' }
    };

    this.applyTheme(this.themeService.isDarkMode());
  }

  private applyTheme(isDark: string): void {
    if (!this.chartOptions) {
      return;
    }
    const tooltip = { ...this.chartOptions.tooltip };
    const grid = { ...this.chartOptions.grid };
    const xaxis = { ...this.chartOptions.xaxis };
    tooltip.theme = isDark === DARK ? DARK : LIGHT;
    grid.borderColor = isDark === DARK ? '#fafafa0d' : '#f3f5f7';
    if (xaxis) {
      xaxis.axisBorder = { ...(xaxis.axisBorder || {}), color: isDark === DARK ? '#fafafa0d' : '#f3f5f7' };
    }
    this.chartOptions = { ...this.chartOptions, tooltip, grid, xaxis };
    this.cardBackground = 'bg-accent-100';
  }
}
