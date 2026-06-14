import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';
import { DailyMetricClient, DailyMetricState, normalizeMetricValue } from '../../services/DailyMetricPayload';
import { ToastService } from '../../services/toast.service';

export interface DailyMetricDialogData {
  code: string;
  unit?: string;
}

@Component({
  selector: 'app-daily-metric-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './daily-metric-dialog.component.html',
  styleUrl: './daily-metric-dialog.component.scss'
})
export class DailyMetricDialogComponent implements OnInit {
  loading = true;
  saving = false;
  state: DailyMetricState | null = null;
  value = 0;
  todayLabel = new Date().toLocaleDateString();

  constructor(
    private dailyMetric: DailyMetricClient,
    private toast: ToastService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private dialogRef: MatDialogRef<DailyMetricDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: DailyMetricDialogData
  ) {}

  ngOnInit(): void {
    this.dailyMetric
      .getState(this.data.code)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (state) => {
          this.state = state;
          this.value = normalizeMetricValue(state.todayEntry?.[1] ?? state.payload.current);
          this.cdr.markForCheck();
        },
        error: () => {
          this.state = {
            payload: { current: 0, history: [] },
            todayEntry: null,
            canEditToday: true
          };
          this.value = 0;
          this.cdr.markForCheck();
        }
      });
  }

  get lastValue(): number {
    return normalizeMetricValue(this.state?.payload?.current);
  }

  get todayValue(): number {
    return normalizeMetricValue(this.state?.todayEntry?.[1]);
  }

  get unitSuffix(): string {
    return this.data.unit ? ` ${this.data.unit}` : '';
  }

  save(): void {
    if (!this.state?.canEditToday || this.saving) {
      return;
    }

    const numericValue = normalizeMetricValue(this.value);
    if (numericValue < 0) {
      this.toast.warning(this.translate.instant('DASHBOARD.DAILY_METRIC.INVALID_VALUE'));
      return;
    }

    this.saving = true;
    this.cdr.markForCheck();
    this.dailyMetric
      .upsertToday(this.data.code, numericValue)
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.toast.success(this.translate.instant('DASHBOARD.DAILY_METRIC.SAVED'));
          this.dialogRef.close(true);
        },
        error: (error: Error) => {
          this.toast.warning(this.translate.instant(this.resolveErrorKey(error?.message)));
        }
      });
  }

  close(): void {
    this.dialogRef.close(false);
  }

  private resolveErrorKey(message?: string): string {
    switch (message) {
      case 'ALREADY_ENTERED_TODAY':
        return 'DASHBOARD.DAILY_METRIC.ALREADY_ENTERED';
      case 'PARAMETER_NOT_FOUND':
        return 'DASHBOARD.DAILY_METRIC.PARAMETER_NOT_FOUND';
      case 'INVALID_VALUE':
        return 'DASHBOARD.DAILY_METRIC.INVALID_VALUE';
      default:
        return 'DASHBOARD.DAILY_METRIC.SAVE_ERROR';
    }
  }
}
