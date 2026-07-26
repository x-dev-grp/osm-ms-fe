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

import { SharedModule } from '../../shared/shared.module';
import { ToastService } from '../../shared/services/toast.service';
import { LegalRuleService } from '../services/legal-rule.service';
import { LegalRule } from '../models/legal-rule.model';
import { parseDate, toIsoDate } from '../shared/hr-form.utils';

@Component({
  selector: 'app-legal-rules-form',
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
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './legal-rule-form.component.html',
  styleUrl: './legal-rule-form.component.scss'
})
export class LegalRuleFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly entityService = inject(LegalRuleService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  form!: FormGroup;
  loading = false;
  saving = false;
  editing = false;
  readOnly = false;
  entityId: string | null = null;
  categoryOptions = ["MINIMUM_WAGE","CNSS","TAX","OVERTIME","LEAVE","CONTRACT","NOTICE","PROBATION","WORKING_TIME","HOLIDAY","OTHER"];

  ngOnInit(): void {
    this.form = this.fb.group({
      code: ['', Validators.required],
      category: ['OTHER', Validators.required],
      effectiveFrom: [null, Validators.required],
      value: [null],
      legalReference: [''],
      description: [''],
      active: [true]
    });

    this.readOnly = this.route.snapshot.url.some((segment) => segment.path === 'view');
    this.editing = this.route.snapshot.url.some((segment) => segment.path === 'edit');
    this.entityId = this.route.snapshot.paramMap.get('id');

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
              effectiveFrom: parseDate(data.effectiveFrom)
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

  save(): void {
    if (this.readOnly || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: LegalRule = {
      ...raw,
      id: this.entityId ?? undefined,
      effectiveFrom: toIsoDate(raw.effectiveFrom)
    };

    this.saving = true;
    const request$ = this.editing ? this.entityService.update(payload) : this.entityService.create(payload);
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.saving = false;
        if (response?.success) {
          this.toast.success();
          this.router.navigate(['/hr/legal-rules']);
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
    this.router.navigate(['/hr/legal-rules']);
  }
}
