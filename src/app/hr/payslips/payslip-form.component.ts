import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';

import { SharedModule } from '../../shared/shared.module';
import { ToastService } from '../../shared/services/toast.service';
import { PayslipService } from '../services/payslip.service';
import { EmployeeService } from '../services/employee.service';
import { PayrollPeriodService } from '../services/payroll-period.service';
import { Payslip } from '../models/payslip.model';
import { Employee } from '../models/employee.model';
import { PayrollPeriod } from '../models/payroll-period.model';
import { parseDate, prefillEmployeeIdFromQuery, toEmployeeRef, toIsoDate, toPayrollPeriodRef } from '../shared/hr-form.utils';
import { previewPayslipAmounts } from '../shared/hr-payroll.utils';
import { DocumentGenerationService } from '../../shared/services/document-generation.service';
import { AuthenticationService } from '../../auth/services/authentication.service';
import { Action, HREntity, OOSMModule, permissionKey } from '../../theme/types/permissions';

@Component({
  selector: 'app-payslip-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, SharedModule, TranslateModule,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatCheckboxModule, MatIconModule, MatProgressSpinnerModule
  ],
  templateUrl: './payslip-form.component.html',
  styleUrl: './payslip-form.component.scss'
})
export class PayslipFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly payslipService = inject(PayslipService);
  private readonly employeeService = inject(EmployeeService);
  private readonly payrollPeriodService = inject(PayrollPeriodService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly documents = inject(DocumentGenerationService);
  private readonly auth = inject(AuthenticationService);

  form!: FormGroup;
  loading = false;
  saving = false;
  editing = false;
  readOnly = false;
  entityId: string | null = null;
  employees: Employee[] = [];
  payrollPeriods: PayrollPeriod[] = [];
  statuses = ['DRAFT', 'VALIDATED', 'PAID'];

  ngOnInit(): void {
    this.form = this.fb.group({
      payrollPeriodId: [null, Validators.required],
      employeeId: [null, Validators.required],
      baseSalary: [0, Validators.min(0)],
      bonuses: [0, Validators.min(0)],
      grossSalary: [0, Validators.min(0)],
      cnssEmployee: [0, Validators.min(0)],
      cnssEmployer: [0, Validators.min(0)],
      irpp: [0, Validators.min(0)],
      css: [0, Validators.min(0)],
      netSalary: [0, Validators.min(0)],
      paid: [false],
      paymentDate: [null],
      status: ['DRAFT']
    });

    this.readOnly = this.route.snapshot.url.some((s) => s.path === 'view');
    this.editing = this.route.snapshot.url.some((s) => s.path === 'edit');
    this.entityId = this.route.snapshot.paramMap.get('id');

    this.employeeService.getAllList().subscribe({ next: (r) => (this.employees = r.data ?? []), error: () => (this.employees = []) });
    this.payrollPeriodService.getAllList().subscribe({ next: (r) => (this.payrollPeriods = r.data ?? []), error: () => (this.payrollPeriods = []) });
    prefillEmployeeIdFromQuery(this.route, this.form, this.editing, this.entityId);

    merge(
      this.form.get('baseSalary')!.valueChanges,
      this.form.get('bonuses')!.valueChanges,
      this.form.get('grossSalary')!.valueChanges
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.recalculateAmounts());

    if (this.entityId) {
      this.loading = true;
      this.payslipService.getPayslip(this.entityId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (response) => {
          this.loading = false;
          if (response?.success && response.data) {
            const data = response.data;
            this.form.patchValue({
              ...data,
              employeeId: data.employee?.id,
              payrollPeriodId: data.payrollPeriod?.id,
              paymentDate: parseDate(data.paymentDate)
            }, { emitEvent: false });
          }
        },
        error: () => {
          this.loading = false;
          this.toast.error('HR.PAYSLIPS.MESSAGES.LOAD_ERROR');
        }
      });
    }

    if (this.readOnly) {
      this.form.disable();
    }
  }

  employeeLabel(employee: Employee): string {
    return `${employee.firstName} ${employee.lastName}`.trim();
  }

  periodLabel(period: PayrollPeriod): string {
    return `${period.month}/${period.year}`;
  }

  recalculateAmounts(): void {
    if (this.readOnly) {
      return;
    }
    const raw = this.form.getRawValue();
    const base = Number(raw.baseSalary ?? 0);
    const bonuses = Number(raw.bonuses ?? 0);
    const grossOverride = Number(raw.grossSalary ?? 0);
    const preview = previewPayslipAmounts(base, bonuses, grossOverride > 0 ? grossOverride : null);
    this.form.patchValue(
      {
        grossSalary: grossOverride > 0 ? grossOverride : base + bonuses,
        cnssEmployee: preview.cnssEmployee,
        cnssEmployer: preview.cnssEmployer,
        irpp: preview.irpp,
        css: preview.css,
        netSalary: preview.netSalary
      },
      { emitEvent: false }
    );
  }

  save(): void {
    if (this.readOnly || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.recalculateAmounts();
    const raw = this.form.getRawValue();
    const { employeeId, payrollPeriodId, ...rest } = raw;
    const payload: Payslip = {
      ...rest,
      id: this.entityId ?? undefined,
      employee: toEmployeeRef(employeeId),
      payrollPeriod: toPayrollPeriodRef(payrollPeriodId),
      grossSalary: Number(raw.grossSalary ?? 0),
      baseSalary: Number(raw.baseSalary ?? 0),
      bonuses: Number(raw.bonuses ?? 0),
      cnssEmployee: Number(raw.cnssEmployee ?? 0),
      cnssEmployer: Number(raw.cnssEmployer ?? 0),
      irpp: Number(raw.irpp ?? 0),
      css: Number(raw.css ?? 0),
      netSalary: Number(raw.netSalary ?? 0),
      paymentDate: toIsoDate(raw.paymentDate)
    };
    this.saving = true;
    const request$ = this.editing ? this.payslipService.updatePayslip(payload) : this.payslipService.createPayslip(payload);
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.saving = false;
        if (response?.success) {
          this.toast.success('HR.PAYSLIPS.MESSAGES.SAVE_SUCCESS');
          this.router.navigate(['/hr/payslips']);
          return;
        }
        this.toast.error(response?.message || 'HR.PAYSLIPS.MESSAGES.SAVE_ERROR');
      },
      error: () => {
        this.saving = false;
        this.toast.error('HR.PAYSLIPS.MESSAGES.SAVE_ERROR');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/hr/payslips']);
  }

  canDownloadPdf(): boolean {
    return (
      this.readOnly &&
      !!this.entityId &&
      this.auth.hasPermission(permissionKey(OOSMModule.HR, HREntity.PAYSLIP, Action.GEN_PDF))
    );
  }

  downloadPdf(): void {
    if (!this.entityId) {
      return;
    }
    this.documents.downloadPayslipPdf(this.entityId);
  }
}
