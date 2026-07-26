import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { SharedModule } from '../../shared/shared.module';
import { ToastService } from '../../shared/services/toast.service';
import { TimesheetService } from '../services/timesheet.service';
import { Timesheet } from '../models/timesheet.model';
import { EmployeeService } from '../services/employee.service';
import { Employee } from '../models/employee.model';
import { toEmployeeRef, prefillEmployeeIdFromQuery } from '../shared/hr-form.utils';

@Component({
  selector: 'app-timesheets-form',
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
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './timesheet-form.component.html',
  styleUrl: './timesheet-form.component.scss'
})
export class TimesheetFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly entityService = inject(TimesheetService);
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
  statusOptions = ["DRAFT","SUBMITTED","VALIDATED","REJECTED"];

  ngOnInit(): void {
    this.form = this.fb.group({
      employeeId: [null, Validators.required],
      periodYear: [new Date().getFullYear(), Validators.required],
      periodMonth: [new Date().getMonth() + 1, Validators.required],
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
              employeeId: data.employee?.id
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
    const payload: Timesheet = {
      ...rest,
      id: this.entityId ?? undefined,
      employee: toEmployeeRef(employeeId)
    };

    this.saving = true;
    const request$ = this.editing ? this.entityService.update(payload) : this.entityService.create(payload);
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.saving = false;
        if (response?.success) {
          this.toast.success();
          this.router.navigate(['/hr/timesheets']);
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
    this.router.navigate(['/hr/timesheets']);
  }
}
