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
import { LeaveRequestService } from '../services/leave-request.service';
import { EmployeeService } from '../services/employee.service';
import { LeaveRequest } from '../models/leave-request.model';
import { Employee } from '../models/employee.model';
import { parseDate, prefillEmployeeIdFromQuery, toEmployeeRef, toIsoDate } from '../shared/hr-form.utils';
import { AuthenticationService } from '../../auth/services/authentication.service';
import { Action, HREntity, OOSMModule, permissionKey } from '../../theme/types/permissions';

@Component({
  selector: 'app-leave-request-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, SharedModule, TranslateModule,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatIconModule, MatProgressSpinnerModule
  ],
  templateUrl: './leave-request-form.component.html',
  styleUrl: './leave-request-form.component.scss'
})
export class LeaveRequestFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly leaveService = inject(LeaveRequestService);
  private readonly employeeService = inject(EmployeeService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthenticationService);

  form!: FormGroup;
  loading = false;
  saving = false;
  editing = false;
  readOnly = false;
  entityId: string | null = null;
  leaveRequest: LeaveRequest | null = null;
  actionLoading = false;
  employees: Employee[] = [];
  leaveTypes = ['ANNUAL', 'SICK', 'UNPAID', 'MATERNITY', 'PATERNITY', 'OTHER'];
  statuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

  ngOnInit(): void {
    this.form = this.fb.group({
      employeeId: [null, Validators.required],
      leaveType: ['ANNUAL', Validators.required],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      durationDays: [null, Validators.min(0)],
      status: ['PENDING']
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
      this.leaveService.getLeaveRequest(this.entityId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (response) => {
          this.loading = false;
          if (response?.success && response.data) {
            const data = response.data;
            this.leaveRequest = data;
            this.form.patchValue({
              ...data,
              employeeId: data.employee?.id,
              startDate: parseDate(data.startDate),
              endDate: parseDate(data.endDate)
            });
          }
        },
        error: () => {
          this.loading = false;
          this.toast.error('LEAVE.MESSAGES.ERROR_LOADING');
        }
      });
    }

    if (this.readOnly) this.form.disable();
  }

  employeeLabel(employee: Employee): string {
    return `${employee.firstName} ${employee.lastName}`.trim();
  }

  canReviewLeave(): boolean {
    return (
      this.readOnly &&
      this.leaveRequest?.status === 'PENDING' &&
      (this.canApproveLeave() || this.canRejectLeave())
    );
  }

  canApproveLeave(): boolean {
    return this.auth.hasPermission(permissionKey(OOSMModule.HR, HREntity.LEAVEREQUEST, Action.APPROVE));
  }

  canRejectLeave(): boolean {
    return this.auth.hasPermission(permissionKey(OOSMModule.HR, HREntity.LEAVEREQUEST, Action.REJECT));
  }

  approve(): void {
    if (!this.entityId) {
      return;
    }
    this.actionLoading = true;
    this.leaveService
      .approveLeaveRequest(this.entityId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.actionLoading = false;
          if (response?.success && response.data?.[0]) {
            this.leaveRequest = response.data[0];
            this.form.patchValue({ status: this.leaveRequest.status });
            this.toast.success('HR.LEAVES.ACTIONS.APPROVE_SUCCESS');
            return;
          }
          this.toast.error(response?.message || 'HR.LEAVES.ACTIONS.ACTION_ERROR');
        },
        error: () => {
          this.actionLoading = false;
          this.toast.error('HR.LEAVES.ACTIONS.ACTION_ERROR');
        }
      });
  }

  reject(): void {
    if (!this.entityId) {
      return;
    }
    this.actionLoading = true;
    this.leaveService
      .rejectLeaveRequest(this.entityId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.actionLoading = false;
          if (response?.success && response.data?.[0]) {
            this.leaveRequest = response.data[0];
            this.form.patchValue({ status: this.leaveRequest.status });
            this.toast.success('HR.LEAVES.ACTIONS.REJECT_SUCCESS');
            return;
          }
          this.toast.error(response?.message || 'HR.LEAVES.ACTIONS.ACTION_ERROR');
        },
        error: () => {
          this.actionLoading = false;
          this.toast.error('HR.LEAVES.ACTIONS.ACTION_ERROR');
        }
      });
  }

  save(): void {
    if (this.readOnly || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const { employeeId, ...rest } = raw;
    const payload: LeaveRequest = {
      ...rest,
      id: this.entityId ?? undefined,
      employee: toEmployeeRef(employeeId),
      startDate: toIsoDate(raw.startDate)!,
      endDate: toIsoDate(raw.endDate)!,
      durationDays: raw.durationDays != null ? Number(raw.durationDays) : undefined
    };
    this.saving = true;
    const request$ = this.editing ? this.leaveService.updateLeaveRequest(payload) : this.leaveService.createLeaveRequest(payload);
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.saving = false;
        if (response?.success) {
          this.toast.success('LEAVE.MESSAGES.SAVE_SUCCESS');
          this.router.navigate(['/hr/leave-requests']);
          return;
        }
        this.toast.error('LEAVE.MESSAGES.ERROR_SAVING');
      },
      error: () => {
        this.saving = false;
        this.toast.error('LEAVE.MESSAGES.ERROR_SAVING');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/hr/leave-requests']);
  }
}
