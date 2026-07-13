import { Component, inject, input, OnInit, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  DASHBOARD_QUICK_PERIODS,
  DashboardDateRange,
  DashboardPresetPeriod,
  getDashboardPresetDateRange,
  getDashboardPresetTranslationKey,
  stripDashboardDate
} from './dashboard-preset.util';

@Component({
  selector: 'app-dashboard-date-filter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './dashboard-date-filter.component.html',
  styleUrl: './dashboard-date-filter.component.scss'
})
export class DashboardDateFilterComponent implements OnInit {
  private readonly translate = inject(TranslateService);

  readonly disabled = input(false);
  readonly defaultPreset = input<DashboardPresetPeriod>('thisMonth');

  readonly rangeChange = output<DashboardDateRange>();
  readonly summaryChange = output<string | null>();

  readonly quickPeriods = DASHBOARD_QUICK_PERIODS;

  selectedPreset: DashboardPresetPeriod = 'thisMonth';
  customStartDate: Date | null = null;
  customEndDate: Date | null = null;
  maxDate = new Date();
  selectedPeriodKey: string | null = 'DASHBOARD.DATE_FILTER.THIS_MONTH';

  ngOnInit(): void {
    this.selectedPreset = this.defaultPreset();
    this.emitPreset(this.selectedPreset);
  }

  selectPresetPeriod(preset: DashboardPresetPeriod): void {
    this.selectedPreset = preset;
    this.customStartDate = null;
    this.customEndDate = null;
    this.emitPreset(preset);
  }

  applyCustomDateRange(): void {
    if (!this.customStartDate || !this.customEndDate) {
      return;
    }
    this.selectedPreset = 'custom';
    this.selectedPeriodKey = null;
    const start = stripDashboardDate(this.customStartDate);
    const end = stripDashboardDate(this.customEndDate);
    this.emitSummary(`${this.formatDate(start)} – ${this.formatDate(end)}`);
    this.rangeChange.emit({
      start,
      end,
      preset: 'custom'
    });
  }

  clearDateRange(): void {
    this.selectPresetPeriod(this.defaultPreset());
  }

  private emitPreset(preset: DashboardPresetPeriod): void {
    const dates = getDashboardPresetDateRange(preset);
    this.selectedPeriodKey = getDashboardPresetTranslationKey(preset);
    this.emitSummary(this.selectedPeriodKey ? this.translate.instant(this.selectedPeriodKey) : null);
    this.rangeChange.emit({ ...dates, preset });
  }

  private emitSummary(summary: string | null): void {
    this.summaryChange.emit(summary);
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
  }
}
