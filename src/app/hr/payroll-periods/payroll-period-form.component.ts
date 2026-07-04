import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { SharedModule } from '../../shared/shared.module';
import { ToastService } from '../../shared/services/toast.service';
import { PayrollPeriodService } from '../services/payroll-period.service';
import { PayrollPeriod } from '../models/payroll-period.model';
import { PayrollPeriodStatus } from '../models/hr.enums';
import { Payslip } from '../models/payslip.model';
import { parseDate, toIsoDate } from '../shared/hr-form.utils';
import { AuthenticationService } from '../../auth/services/authentication.service';
import { Action, HREntity, OOSMModule, permissionKey } from '../../theme/types/permissions';

type PayrollPeriodTab = 'period' | 'payslips';

@Component({
  selector: 'app-payroll-period-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    SharedModule,
    TranslateModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule
  ],
  templateUrl: './payroll-period-form.component.html',
  styleUrl: './payroll-period-form.component.scss'
})
export class PayrollPeriodFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly payrollPeriodService = inject(PayrollPeriodService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthenticationService);

  form!: FormGroup;
  loading = false;
  saving = false;
  generating = false;
  advancing = false;
  editing = false;
  readOnly = false;
  entityId: string | null = null;
  period: PayrollPeriod | null = null;
  activePageTab: PayrollPeriodTab = 'period';
  statuses = ['OPEN', 'CALCULATED', 'VALIDATED', 'PAID', 'CLOSED'];

  ngOnInit(): void {
    this.form = this.fb.group({
      year: [new Date().getFullYear(), [Validators.required, Validators.min(2000)]],
      month: [new Date().getMonth() + 1, [Validators.required, Validators.min(1), Validators.max(12)]],
      periodStart: [null, Validators.required],
      periodEnd: [null, Validators.required],
      status: ['OPEN']
    });

    this.readOnly = this.route.snapshot.url.some((s) => s.path === 'view');
    this.editing = this.route.snapshot.url.some((s) => s.path === 'edit');
    this.entityId = this.route.snapshot.paramMap.get('id');

    if (this.entityId) {
      this.loadEntity(this.entityId);
    }

    if (this.readOnly) {
      this.form.disable();
    }
  }

  loadPageTab(tab: PayrollPeriodTab): void {
    this.activePageTab = tab;
  }

  periodTitle(): string {
    if (!this.period) {
      return '';
    }
    return `${this.period.month}/${this.period.year}`;
  }

  nextStatus(): PayrollPeriodStatus | null {
    const current = this.period?.status ?? 'OPEN';
    switch (current) {
      case 'OPEN':
        return 'CALCULATED';
      case 'CALCULATED':
        return 'VALIDATED';
      case 'VALIDATED':
        return 'PAID';
      case 'PAID':
        return 'CLOSED';
      default:
        return null;
    }
  }

  canGeneratePayslips(): boolean {
    return (
      !!this.period &&
      !['PAID', 'CLOSED'].includes(this.period.status ?? 'OPEN') &&
      this.auth.hasPermission(permissionKey(OOSMModule.HR, HREntity.PAYROLLPERIOD, Action.CALCULATE))
    );
  }

  canAdvanceStatus(): boolean {
    const target = this.nextStatus();
    if (!target) {
      return false;
    }
    const action = this.actionForTargetStatus(target);
    return action != null && this.auth.hasPermission(permissionKey(OOSMModule.HR, HREntity.PAYROLLPERIOD, action));
  }

  private actionForTargetStatus(status: PayrollPeriodStatus): Action | null {
    switch (status) {
      case 'CALCULATED':
        return Action.CALCULATE;
      case 'VALIDATED':
        return Action.VALIDATE;
      case 'PAID':
        return Action.PAY;
      case 'CLOSED':
        return Action.CLOSE;
      default:
        return null;
    }
  }

  generatePayslips(): void {
    if (!this.entityId || !this.canGeneratePayslips()) {
      return;
    }
    this.generating = true;
    this.payrollPeriodService
      .generatePayslips(this.entityId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.generating = false;
          if (response?.success && response.data?.[0]) {
            this.period = response.data[0];
            this.form.patchValue({
              ...this.period,
              periodStart: parseDate(this.period.periodStart),
              periodEnd: parseDate(this.period.periodEnd)
            });
            this.toast.success('HR.PAYROLL.PROFILE.GENERATE_SUCCESS');
            this.activePageTab = 'payslips';
            return;
          }
          this.toast.error(response?.message || 'HR.PAYROLL.PROFILE.GENERATE_ERROR');
        },
        error: () => {
          this.generating = false;
          this.toast.error('HR.PAYROLL.PROFILE.GENERATE_ERROR');
        }
      });
  }

  advanceStatus(): void {
    const target = this.nextStatus();
    if (!this.entityId || !target) {
      return;
    }
    this.advancing = true;
    this.payrollPeriodService
      .advanceStatus(this.entityId, target)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.advancing = false;
          if (response?.success && response.data?.[0]) {
            this.period = response.data[0];
            this.form.patchValue({ status: this.period.status });
            this.toast.success('HR.PAYROLL.PROFILE.STATUS_SUCCESS');
            return;
          }
          this.toast.error(response?.message || 'HR.PAYROLL.PROFILE.STATUS_ERROR');
        },
        error: () => {
          this.advancing = false;
          this.toast.error('HR.PAYROLL.PROFILE.STATUS_ERROR');
        }
      });
  }

  trackById(_index: number, item: Payslip): string | undefined {
    return item.id;
  }

  private loadEntity(id: string): void {
    this.loading = true;
    this.payrollPeriodService
      .getPayrollPeriod(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response?.success && response.data) {
            this.period = response.data;
            this.form.patchValue({
              ...this.period,
              periodStart: parseDate(this.period.periodStart),
              periodEnd: parseDate(this.period.periodEnd)
            });
          }
        },
        error: () => {
          this.loading = false;
          this.toast.error('HR.DASHBOARD.LOAD_ERROR');
        }
      });
  }

  save(): void {
    if (this.readOnly || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const payload: PayrollPeriod = {
      ...raw,
      id: this.entityId ?? undefined,
      year: Number(raw.year),
      month: Number(raw.month),
      periodStart: toIsoDate(raw.periodStart)!,
      periodEnd: toIsoDate(raw.periodEnd)!
    };
    this.saving = true;
    const request$ = this.editing
      ? this.payrollPeriodService.updatePayrollPeriod(payload)
      : this.payrollPeriodService.createPayrollPeriod(payload);
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.saving = false;
        if (response?.success) {
          this.toast.success();
          this.router.navigate(['/hr/payroll-periods']);
          return;
        }
        this.toast.error(response?.message || 'AUTO.OPERATION_FAILED');
      },
      error: () => {
        this.saving = false;
        this.toast.error('AUTO.OPERATION_FAILED');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/hr/payroll-periods']);
  }
}
