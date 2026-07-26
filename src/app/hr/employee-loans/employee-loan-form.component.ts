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
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { SharedModule } from '../../shared/shared.module';
import { ToastService } from '../../shared/services/toast.service';
import { EmployeeLoanService } from '../services/employee-loan.service';
import { EmployeeLoan } from '../models/employee-loan.model';
import { EmployeeService } from '../services/employee.service';
import { Employee } from '../models/employee.model';
import { toEmployeeRef, prefillEmployeeIdFromQuery, parseDate, toIsoDate } from '../shared/hr-form.utils';

@Component({
  selector: 'app-employee-loans-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    TranslateModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './employee-loan-form.component.html',
  styleUrl: './employee-loan-form.component.scss'
})
export class EmployeeLoanFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly entityService = inject(EmployeeLoanService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly employeeService = inject(EmployeeService);

  form!: FormGroup;
  loading = false;
  saving = false;
  editing = false;
  readOnly = false;
  entityId: string | null = null;
  employees: Employee[] = [];
  statusOptions = ["DRAFT","ACTIVE","PAID","SUSPENDED","CANCELLED"];

  ngOnInit(): void {
    this.form = this.fb.group({
      employeeId: [null, Validators.required],
      principalAmount: [null, [Validators.required, Validators.min(0.01)]],
      monthlyInstallment: [null, [Validators.required, Validators.min(0.01)]],
      startDate: [null, Validators.required],
      status: ['DRAFT']
    });

    this.readOnly = this.route.snapshot.url.some((segment) => segment.path === 'view');
    this.editing = this.route.snapshot.url.some((segment) => segment.path === 'edit');
    this.entityId = this.route.snapshot.paramMap.get('id');

    this.employeeService.getAllList().subscribe({
      next: (response) => (this.employees = response.data ?? []),
      error: () => (this.employees = [])
    });
    prefillEmployeeIdFromQuery(this.route, this.form, this.editing, this.entityId);

    if (this.entityId) {
      this.loading = true;
      this.entityService
        .getById(this.entityId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.loading = false;
            if (response?.success && response.data) {
              const data = response.data;
            this.form.patchValue({
              ...data,
              employeeId: data.employee?.id,
              startDate: parseDate(data.startDate)
            });
            }
          },
          error: () => {
            this.loading = false;
            this.toast.error('AUTO.OPERATION_FAILED');
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

  save(): void {
    if (this.readOnly || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const { employeeId, ...rest } = raw;
    const payload: EmployeeLoan = {
      ...rest,
      id: this.entityId ?? undefined,
      employee: toEmployeeRef(employeeId),
      startDate: toIsoDate(raw.startDate)
    };

    this.saving = true;
    const request$ = this.editing ? this.entityService.update(payload) : this.entityService.create(payload);
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.saving = false;
        if (response?.success) {
          this.toast.success();
          this.router.navigate(['/hr/employee-loans']);
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
    this.router.navigate(['/hr/employee-loans']);
  }
}
