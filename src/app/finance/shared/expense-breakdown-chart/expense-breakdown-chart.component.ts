import { Component, input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { TranslateModule } from '@ngx-translate/core';
import { CardComponent } from '../../../theme/components/card/card.component';

export interface ExpenseBreakdownLegendItem {
  title: string;
  value: string;
  color: string;
}

@Component({
  selector: 'app-expense-breakdown-chart',
  standalone: true,
  imports: [CommonModule, MatMenuModule, NgApexchartsModule, TranslateModule, CardComponent],
  templateUrl: './expense-breakdown-chart.component.html',
  styleUrl: './expense-breakdown-chart.component.scss'
})
export class ExpenseBreakdownChartComponent implements OnInit, OnChanges {
  readonly series = input.required<number[]>();
  readonly labels = input.required<string[]>();
  readonly legendItems = input.required<ExpenseBreakdownLegendItem[]>();

  chartOptions: Partial<ApexOptions> = {};

  ngOnInit(): void {
    this.refreshChart();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.refreshChart();
  }

  private refreshChart(): void {
    this.chartOptions = {
      chart: { height: 280, type: 'donut' },
      series: this.series(),
      colors: ['#faad14', '#52c41a', '#ff4d4f', '#1677ff'],
      labels: this.labels(),
      fill: { opacity: [1, 1, 1, 0.3] },
      legend: { show: false },
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: { show: true, name: { show: true }, value: { show: true } }
          }
        }
      },
      dataLabels: { enabled: false },
      responsive: [
        {
          breakpoint: 575,
          options: {
            chart: { height: 250 },
            plotOptions: { pie: { donut: { size: '65%', labels: { show: false } } } }
          }
        }
      ]
    };
  }
}
