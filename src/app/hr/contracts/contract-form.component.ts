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
import { EmploymentContractService } from '../services/employment-contract.service';
import { EmployeeService } from '../services/employee.service';
import { PosteService } from '../services/poste.service';
import { CddLegalReason, EmploymentContract } from '../models/employment-contract.model';
import { Employee } from '../models/employee.model';
import { Poste } from '../models/poste.model';
import { parseDate, prefillEmployeeIdFromQuery, toEmployeeRef, toIsoDate, toPosteRef } from '../shared/hr-form.utils';

const CDD_REASON_REQUIRED_TYPES = new Set(['CDD', 'SEASONAL', 'TEMPORARY']);

@Component({
  selector: 'app-contract-form',
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
  templateUrl: './contract-form.component.html',
  styleUrl: './contract-form.component.scss'
})
export class ContractFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly contractService = inject(EmploymentContractService);
  private readonly employeeService = inject(EmployeeService);
  private readonly posteService = inject(PosteService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  form!: FormGroup;
  loading = false;
  saving = false;
  editing = false;
  readOnly = false;
  entityId: string | null = null;
  employees: Employee[] = [];
  postes: Poste[] = [];

  contractTypes = ['CDI', 'CDD', 'INTERNSHIP', 'TEMPORARY', 'SEASONAL', 'PART_TIME', 'OTHER_LEGAL_TYPE'];
  statuses = ['DRAFT', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'TERMINATED', 'CANCELLED'];
  cddLegalReasons: CddLegalReason[] = [
    'TEMPORARY_REPLACEMENT',
    'SEASONAL_WORK',
    'TEMPORARY_INCREASE_ACTIVITY',
    'TEMPORARY_NATURE_OF_WORK',
    'OTHER_LEGAL_EXCEPTION'
  ];

  get requiresCddReason(): boolean {
    return CDD_REASON_REQUIRED_TYPES.has(this.form?.get('contractType')?.value);
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      employeeId: [null, Validators.required],
      posteId: [null, Validators.required],
      contractNumber: [''],
      contractType: ['CDI', Validators.required],
      startDate: [null, Validators.required],
      endDate: [null],
      salary: [null, Validators.min(0)],
      baseSalary: [null, Validators.min(0)],
      weeklyHours: [null, Validators.min(0)],
      cddLegalReason: [null],
      probationStart: [null],
      probationEnd: [null],
      status: ['DRAFT']
    });

    this.readOnly = this.route.snapshot.url.some((s) => s.path === 'view');
    this.editing = this.route.snapshot.url.some((s) => s.path === 'edit');
    this.entityId = this.route.snapshot.paramMap.get('id');

    this.loadLookups();
    prefillEmployeeIdFromQuery(this.route, this.form, this.editing, this.entityId);

    this.form
      .get('contractType')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((type) => this.applyContractTypeRules(type));

    if (this.entityId) {
      this.loading = true;
      this.contractService.getContract(this.entityId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (response) => {
          this.loading = false;
          if (response?.success && response.data) {
            const data = response.data;
            this.form.patchValue({
              ...data,
              employeeId: data.employee?.id,
              posteId: data.poste?.id,
              startDate: parseDate(data.startDate),
              endDate: parseDate(data.endDate),
              probationStart: parseDate(data.probationStart),
              probationEnd: parseDate(data.probationEnd)
            });
            this.applyContractTypeRules(data.contractType);
          }
        },
        error: () => {
          this.loading = false;
          this.toast.error('CONTRACT.MESSAGES.ERROR_LOADING');
        }
      });
    }

    if (this.readOnly) {
      this.form.disable();
    } else {
      this.applyContractTypeRules(this.form.get('contractType')?.value);
    }
  }

  private applyContractTypeRules(contractType: string | null | undefined): void {
    const endDateControl = this.form.get('endDate');
    const cddReasonControl = this.form.get('cddLegalReason');
    if (!endDateControl || !cddReasonControl) {
      return;
    }

    if (contractType === 'CDI') {
      endDateControl.setValue(null);
      endDateControl.disable({ emitEvent: false });
      endDateControl.clearValidators();
    } else if (!this.readOnly) {
      endDateControl.enable({ emitEvent: false });
      endDateControl.setValidators(Validators.required);
    }
    endDateControl.updateValueAndValidity({ emitEvent: false });

    if (CDD_REASON_REQUIRED_TYPES.has(contractType ?? '')) {
      cddReasonControl.setValidators(Validators.required);
      if (!this.readOnly) {
        cddReasonControl.enable({ emitEvent: false });
      }
    } else {
      cddReasonControl.clearValidators();
      cddReasonControl.setValue(null);
    }
    cddReasonControl.updateValueAndValidity({ emitEvent: false });
  }

  private loadLookups(): void {
    this.employeeService.getAllList().subscribe({
      next: (response) => (this.employees = response.data ?? []),
      error: () => (this.employees = [])
    });
    this.posteService.getAllList().subscribe({
      next: (response) => (this.postes = response.data ?? []),
      error: () => (this.postes = [])
    });
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
    const { employeeId, posteId, ...rest } = raw;
    const payload: EmploymentContract = {
      ...rest,
      id: this.entityId ?? undefined,
      employee: toEmployeeRef(employeeId),
      poste: toPosteRef(posteId),
      startDate: toIsoDate(raw.startDate)!,
      endDate: toIsoDate(raw.endDate),
      probationStart: toIsoDate(raw.probationStart),
      probationEnd: toIsoDate(raw.probationEnd)
    };

    this.saving = true;
    const request$ = this.editing ? this.contractService.updateContract(payload) : this.contractService.createContract(payload);
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.saving = false;
        if (response?.success) {
          this.toast.success('CONTRACT.MESSAGES.SAVE_SUCCESS');
          this.router.navigate(['/hr/contracts']);
          return;
        }
        this.toast.error(response?.message || 'CONTRACT.MESSAGES.ERROR_SAVING');
      },
      error: () => {
        this.saving = false;
        this.toast.error('CONTRACT.MESSAGES.ERROR_SAVING');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/hr/contracts']);
  }
}
