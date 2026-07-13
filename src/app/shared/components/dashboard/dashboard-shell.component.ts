import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject, input, OnDestroy, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { DashboardDateFilterComponent } from './dashboard-date-filter.component';
import { DashboardExportService } from './dashboard-export.service';
import { DashboardExportFormat, DashboardExportPayload, hasExportableData } from './dashboard-export.models';
import { DashboardDateRange, DashboardPresetPeriod } from './dashboard-preset.util';
import { DashboardTheme } from './dashboard-theme';

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslateModule,
    DashboardDateFilterComponent
  ],
  templateUrl: './dashboard-shell.component.html',
  styleUrl: './dashboard-shell.component.scss'
})
export class DashboardShellComponent implements OnInit, OnDestroy {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly exportService = inject(DashboardExportService);
  private readonly destroy$ = new Subject<void>();

  readonly titleKey = input.required<string>();
  readonly subtitleKey = input<string | null>(null);
  readonly subtitleText = input<string | null>(null);
  readonly icon = input.required<string>();
  readonly theme = input<DashboardTheme>('home');

  readonly loading = input(false);
  readonly loadErrorKey = input<string | null>(null);
  readonly loadErrorText = input<string | null>(null);
  readonly lastUpdated = input<Date | null>(null);
  readonly showDateFilter = input(false);
  readonly showFiltersPanel = input(false);
  readonly filtersSummary = input<string | null>(null);
  readonly defaultPreset = input<DashboardPresetPeriod>('thisMonth');
  readonly loadingMessageKey = input('DASHBOARD.LOADING.TEXT');
  readonly exportPayload = input<DashboardExportPayload | null>(null);
  readonly showExport = input(true);

  readonly refresh = output<void>();
  readonly dateRangeChange = output<DashboardDateRange>();

  readonly filtersExpanded = signal(true);
  readonly dateFilterSummary = signal<string | null>(null);
  readonly exporting = signal(false);

  readonly canExport = computed(() => this.showExport() && hasExportableData(this.exportPayload()));

  ngOnInit(): void {
    this.breakpointObserver
      .observe(['(min-width: 769px)'])
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.filtersExpanded.set(state.matches);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleFilters(): void {
    this.filtersExpanded.update((expanded) => !expanded);
  }

  onDateRangeChange(range: DashboardDateRange): void {
    this.dateRangeChange.emit(range);
  }

  onDateFilterSummaryChange(summary: string | null): void {
    this.dateFilterSummary.set(summary);
  }

  async exportAs(format: DashboardExportFormat): Promise<void> {
    if (this.exporting() || !this.canExport()) {
      return;
    }
    this.exporting.set(true);
    try {
      await this.exportService.export(this.exportPayload(), format);
    } finally {
      this.exporting.set(false);
    }
  }
}
