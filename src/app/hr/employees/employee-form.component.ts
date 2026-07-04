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
import { EmployeeService } from '../services/employee.service';
import { Employee } from '../models/employee.model';
import { parseDate, toIsoDate } from '../shared/hr-form.utils';

type EmployeeProfileTab = 'profile' | 'contracts' | 'pointages' | 'leave' | 'payslips';

@Component({
  selector: 'app-employee-form',
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
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.scss'
})
export class EmployeeFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly employeeService = inject(EmployeeService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  form!: FormGroup;
  loading = false;
  saving = false;
  editing = false;
  readOnly = false;
  entityId: string | null = null;
  employee: Employee | null = null;
  activePageTab: EmployeeProfileTab = 'profile';

  statuses = ['ACTIVE', 'SUSPENDED', 'TERMINATED'];
  salaryTypes = ['MONTHLY', 'HOURLY', 'DAILY'];
  paymentModes = ['BANK_TRANSFER', 'CASH', 'CHECK'];
  workRegimes = ['HOURS_48', 'HOURS_40', 'AGRICULTURAL'];

  ngOnInit(): void {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      cin: [''],
      cnssMatricule: [''],
      email: ['', Validators.email],
      phone: [''],
      address: [''],
      birthDate: [null],
      hireDate: [null],
      jobTitle: [''],
      department: [''],
      status: ['ACTIVE'],
      salaryType: ['MONTHLY'],
      paymentMode: ['BANK_TRANSFER'],
      bankAccountRef: [''],
      workRegime: ['HOURS_48']
    });

    this.readOnly = this.route.snapshot.url.some((segment) => segment.path === 'view');
    this.editing = this.route.snapshot.url.some((segment) => segment.path === 'edit');
    this.entityId = this.route.snapshot.paramMap.get('id');

    if (!this.editing && !this.readOnly) {
      this.form.get('hireDate')?.addValidators(Validators.required);
    }

    if (this.entityId) {
      this.loadEntity(this.entityId);
    }

    if (this.readOnly) {
      this.form.disable();
    }
  }

  loadPageTab(tab: EmployeeProfileTab): void {
    this.activePageTab = tab;
  }

  employeeDisplayName(): string {
    if (!this.employee) {
      return '';
    }
    return `${this.employee.firstName ?? ''} ${this.employee.lastName ?? ''}`.trim();
  }

  createChildRoute(path: string): string[] {
    return ['/hr', path, 'new'];
  }

  createChildQueryParams(): { employeeId: string } | null {
    return this.entityId ? { employeeId: this.entityId } : null;
  }

  private loadEntity(id: string): void {
    this.loading = true;
    this.employeeService
      .getEmployee(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (!response?.success || !response.data) {
            this.toast.error('HR.EMPLOYEES.MESSAGES.LOAD_ERROR');
            return;
          }
          this.employee = response.data;
          this.form.patchValue({
            ...this.employee,
            birthDate: parseDate(this.employee.birthDate),
            hireDate: parseDate(this.employee.hireDate)
          });
          if (this.employee.activeContract) {
            this.form.get('jobTitle')?.disable();
          }
        },
        error: () => {
          this.loading = false;
          this.toast.error('HR.EMPLOYEES.MESSAGES.LOAD_ERROR');
        }
      });
  }

  save(): void {
    if (this.readOnly || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: Employee = {
      ...raw,
      id: this.entityId ?? undefined,
      birthDate: toIsoDate(raw.birthDate),
      hireDate: toIsoDate(raw.hireDate)
    };

    this.saving = true;
    const request$ = this.editing ? this.employeeService.updateEmployee(payload) : this.employeeService.createEmployee(payload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.saving = false;
        if (response?.success) {
          this.toast.success('HR.EMPLOYEES.MESSAGES.SAVE_SUCCESS');
          this.router.navigate(['/hr/employees']);
          return;
        }
        this.toast.error(response?.message || 'HR.EMPLOYEES.MESSAGES.SAVE_ERROR');
      },
      error: () => {
        this.saving = false;
        this.toast.error('HR.EMPLOYEES.MESSAGES.SAVE_ERROR');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/hr/employees']);
  }

  trackById(_index: number, item: { id?: string }): string | undefined {
    return item.id;
  }
}
