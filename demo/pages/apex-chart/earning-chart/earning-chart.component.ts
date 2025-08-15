// angular import
import { Component, OnInit, OnChanges, SimpleChanges, effect, inject, input } from '@angular/core';

// project import
import { SharedModule } from 'src/app/shared/shared.module';
import { ThemeLayoutService } from 'src/app/theme//services/theme-layout.service';

// third party
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

// const
import { DARK, LIGHT } from 'src/app/theme//const';

@Component({
  selector: 'app-earning-chart',
  imports: [SharedModule, NgApexchartsModule],
  templateUrl: './earning-chart.component.html',
  standalone: true,
  styleUrl: './earning-chart.component.scss'
})
export class EarningChartComponent implements OnInit, OnChanges {
  private themeService = inject(ThemeLayoutService);

  // public props
  chartOptions: Partial<ApexOptions>;
  readonly styleInput = input<string>();
  readonly iconImage = input<string>();
  readonly headerTitle = input<string>();
  readonly earningValue = input<string>();
  readonly background = input<string>();
  readonly textColor = input<string>();
  readonly percentageValue = input<string>();
  readonly data = input.required<[]>();
  readonly color = input.required<[]>();

  // constructor
  constructor() {
    effect(() => {
      this.isDarkTheme(this.themeService.isDarkMode());
    });
  }

  // life cycle
  ngOnInit() {
    this.setChartOptions();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      this.setChartOptions();
    }
  }

  setChartOptions() {
    this.chartOptions = {
      chart: { type: 'line', background: 'transparent', height: 40, sparkline: { enabled: true } },
      stroke: { width: 2, curve: 'smooth' },
      series: [
        {
          data: (this.data() && this.data().length) ? this.data() : [0]
        }
      ],
      xaxis: { crosshairs: { width: 1 }, labels: { show: false }, axisTicks: { show: false }, axisBorder: { show: false } },
      yaxis: { show: false },
      tooltip: {
        fixed: { enabled: false },
        x: { show: false },
        y: {
          title: {
            formatter: function () {
              return '';
            }
          }
        },
        marker: { show: false },
        theme: 'light'
      },
      grid: { show: false },
      colors: this.color(),
      theme: {
        mode: 'light'
      }
    };
  }

  // private methods
  private isDarkTheme(isDark: string) {
    const tooltip = { ...this.chartOptions.tooltip };
    tooltip.theme = isDark === DARK ? DARK : LIGHT;
    this.chartOptions = { ...this.chartOptions, tooltip };
  }
}
