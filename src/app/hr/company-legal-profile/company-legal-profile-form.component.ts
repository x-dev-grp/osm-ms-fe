import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
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
import { CompanyLegalProfileService } from '../services/company-legal-profile.service';
import { CompanyLegalProfile } from '../models/company-legal-profile.model';

@Component({
  selector: 'app-company-legal-profile-form',
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
  templateUrl: './company-legal-profile-form.component.html',
  styleUrl: './company-legal-profile-form.component.scss'
})
export class CompanyLegalProfileFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly profileService = inject(CompanyLegalProfileService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  form!: FormGroup;
  loading = false;
  saving = false;
  entityId: string | null = null;

  businessActivities = [
    'OLIVE_GROWING',
    'INDUSTRIAL_PROCESSING',
    'PACKAGING',
    'LOGISTICS',
    'ADMINISTRATION',
    'OTHER'
  ];
  weeklyRegimes = ['HOURS_40', 'HOURS_48', 'CUSTOM'];

  ngOnInit(): void {
    this.form = this.fb.group({
      businessActivity: ['OTHER', Validators.required],
      cnssEmployerNumber: ['', Validators.required],
      employmentSector: [''],
      cnssRegime: [''],
      collectiveAgreement: [''],
      weeklyRegime: ['HOURS_48', Validators.required],
      accidentRiskRate: [null],
      minimumWageProfile: [''],
      fiscalRegime: [''],
      notes: ['']
    });

    this.loading = true;
    this.profileService
      .getAllList()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.loading = false;
          const first = response?.data?.[0];
          if (first) {
            this.entityId = first.id ?? null;
            this.form.patchValue(first);
          }
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: CompanyLegalProfile = {
      ...this.form.getRawValue(),
      id: this.entityId ?? undefined
    };
    this.saving = true;
    const request$ = this.entityId ? this.profileService.update(payload) : this.profileService.create(payload);
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.saving = false;
        if (response?.success) {
          this.toast.success();
          this.entityId = response.data?.id ?? this.entityId;
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
    this.router.navigate(['/hr/settings']);
  }
}
