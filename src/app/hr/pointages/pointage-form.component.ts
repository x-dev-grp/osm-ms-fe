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
import { PointageService } from '../services/pointage.service';
import { EmployeeService } from '../services/employee.service';
import { Pointage } from '../models/pointage.model';
import { Employee } from '../models/employee.model';
import { parseDate, prefillEmployeeIdFromQuery, toEmployeeRef, toIsoDate } from '../shared/hr-form.utils';

@Component({
  selector: 'app-pointage-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, SharedModule, TranslateModule,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatIconModule, MatProgressSpinnerModule
  ],
  templateUrl: './pointage-form.component.html',
  styleUrl: './pointage-form.component.scss'
})
export class PointageFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pointageService = inject(PointageService);
  private readonly employeeService = inject(EmployeeService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  form!: FormGroup;
  loading = false;
  saving = false;
  editing = false;
  readOnly = false;
  entityId: string | null = null;
  employees: Employee[] = [];
  statuses = ['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'PUBLIC_HOLIDAY'];

  ngOnInit(): void {
    this.form = this.fb.group({
      employeeId: [null, Validators.required],
      workDate: [null, Validators.required],
      checkIn: [''],
      checkOut: [''],
      workedHours: [null, Validators.min(0)],
      breakMinutes: [0, Validators.min(0)],
      status: ['PRESENT'],
      notes: ['']
    });

    this.readOnly = this.route.snapshot.url.some((s) => s.path === 'view');
    this.editing = this.route.snapshot.url.some((s) => s.path === 'edit');
    this.entityId = this.route.snapshot.paramMap.get('id');

    this.employeeService.getAllList().subscribe({
      next: (response) => (this.employees = response.data ?? []),
      error: () => (this.employees = [])
    });
    prefillEmployeeIdFromQuery(this.route, this.form, this.editing, this.entityId);

    if (this.entityId) {
      this.loading = true;
      this.pointageService.getPointage(this.entityId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (response) => {
          this.loading = false;
          if (response?.success && response.data) {
            const data = response.data;
            this.form.patchValue({
              ...data,
              employeeId: data.employee?.id,
              workDate: parseDate(data.workDate)
            });
          }
        },
        error: () => {
          this.loading = false;
          this.toast.error('HR.ATTENDANCE.FORM.LOAD_ERROR');
        }
      });
    }

    if (this.readOnly) this.form.disable();
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
    const payload: Pointage = {
      ...rest,
      id: this.entityId ?? undefined,
      employee: toEmployeeRef(employeeId),
      workDate: toIsoDate(raw.workDate)!,
      breakMinutes: Number(raw.breakMinutes ?? 0),
      workedHours: raw.workedHours != null ? Number(raw.workedHours) : undefined
    };
    this.saving = true;
    const request$ = this.editing ? this.pointageService.updatePointage(payload) : this.pointageService.createPointage(payload);
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.saving = false;
        if (response?.success) {
          this.toast.success('HR.ATTENDANCE.FORM.SAVE_SUCCESS');
          this.router.navigate(['/hr/pointages']);
          return;
        }
        this.toast.error('HR.ATTENDANCE.FORM.SAVE_ERROR');
      },
      error: () => {
        this.saving = false;
        this.toast.error('HR.ATTENDANCE.FORM.SAVE_ERROR');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/hr/pointages']);
  }
}
