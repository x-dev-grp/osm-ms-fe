import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { SharedModule } from '../../shared/shared.module';
import { DashboardShellComponent } from '../../shared/components/dashboard/dashboard-shell.component';
import { ToastService } from '../../shared/services/toast.service';
import {
  ComplianceSummary,
  ComplianceViolation,
  HrOpsService
} from '../services/hr-ops.service';

@Component({
  selector: 'app-hr-compliance',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    TranslateModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DashboardShellComponent
  ],
  templateUrl: './hr-compliance.component.html',
  styleUrl: './hr-compliance.component.scss'
})
export class HrComplianceComponent implements OnInit {
  private readonly ops = inject(HrOpsService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  loading = false;
  scanning = false;
  summary: ComplianceSummary | null = null;
  violations: ComplianceViolation[] = [];

  ngOnInit(): void {
    this.loadSummary();
  }

  loadSummary(): void {
    this.loading = true;
    this.ops
      .getComplianceSummary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.summary = response?.data ?? null;
        },
        error: () => {
          this.loading = false;
          this.toast.error('HR.COMPLIANCE.LOAD_ERROR');
        }
      });
  }

  runScan(): void {
    this.scanning = true;
    this.ops
      .scanCompliance()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.scanning = false;
          this.violations = response?.data ?? [];
          this.loadSummary();
          this.toast.success('HR.COMPLIANCE.SCAN_SUCCESS');
        },
        error: () => {
          this.scanning = false;
          this.toast.error('HR.COMPLIANCE.SCAN_ERROR');
        }
      });
  }
}
