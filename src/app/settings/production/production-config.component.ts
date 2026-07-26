import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, of, switchMap } from 'rxjs';
import { CardComponent } from '../../theme/components/card/card.component';
import { CompanyProfileService } from '../../shared/services/company-profile.service';
import { CampaignService } from '../../shared/services/campaign.service';
import { ToastService } from '../../shared/services/toast.service';
import { CompanyProfile } from '../../shared/models/CompanyProfile';
import { ParameterComponent } from '../parameter/parameter.component';
import { AppParameterService } from '../../shared/services/AppParameterService';
import { parseDailyMetricPayload } from '../../shared/services/DailyMetricPayload';
import { TenantParameterClient } from '../../shared/services/tenant-parameter.client';

@Component({
  selector: 'app-production-config',
  standalone: true,
  templateUrl: './production-config.component.html',
  styleUrl: './production-config.component.scss',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    TranslateModule,
    CardComponent,
    ParameterComponent
  ]
})
export class ProductionConfigComponent implements OnInit {
  private readonly dailyMetricCode = 'DAILY_OIL_METRIC';

  campaignForm!: FormGroup;
  formEnabled = false;
  loading = true;
  rollingOver = false;
  resetDailyMetricOnRollover = true;
  companyProfile: CompanyProfile | null = null;

  constructor(
    private fb: FormBuilder,
    private companyProfileService: CompanyProfileService,
    private campaignService: CampaignService,
    private parameterService: AppParameterService,
    private tenantParams: TenantParameterClient,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.campaignForm = this.fb.group({
      campaignStartDate: [null, Validators.required],
      campaignStartTime: ['00:00', Validators.required],
      campaignEndAt: [null as string | null]
    });
    this.campaignForm.disable();
    this.loadCampaignConfig();
  }

  get campaignPreview(): string {
    return this.campaignService.getCampaignPreview(new Date(), this.buildCampaignProfileFromForm());
  }

  get campaignEndDisplay(): string | null {
    const endAt = this.campaignForm.getRawValue().campaignEndAt as string | null;
    return endAt ? this.campaignService.formatDateTime(endAt) : null;
  }

  get campaignStartDisplay(): string {
    const raw = this.campaignForm.getRawValue();
    const startAt = this.campaignService.combineDateTime(raw.campaignStartDate, raw.campaignStartTime);
    return startAt ? this.campaignService.formatDateTime(startAt) : '—';
  }

  enableForm(): void {
    this.formEnabled = true;
    this.campaignForm.enable();
  }

  onReset(): void {
    this.patchCampaignConfig(this.companyProfile ?? this.companyProfileService.getProfileFromCache());
    this.campaignForm.disable();
    this.formEnabled = false;
  }

  markCampaignEndDate(): void {
    if (!this.formEnabled) {
      return;
    }
    this.campaignForm.patchValue({ campaignEndAt: new Date().toISOString() });
  }

  startNewSeason(): void {
    if (this.rollingOver) {
      return;
    }

    const currentProfile = this.companyProfile ?? this.companyProfileService.getProfileFromCache();
    if (!currentProfile) {
      this.toast.error('AUTO.IMPOSSIBLE_DE_CHARGER_LA_CONFIGURATION_DE_CAMPAGNE');
      return;
    }

    const now = new Date();
    const campaignStartAt = this.campaignService.combineDateTime(now, '00:00');
    const clearedProfile: CompanyProfile = {
      ...currentProfile,
      campaignStartAt,
      campaignEndAt: null,
      campaignEndMonth: undefined,
      campaignEndDay: undefined
    };
    const monthDayFields = this.campaignService.extractMonthDayFields(campaignStartAt, null, clearedProfile);
    const payload: CompanyProfile = {
      ...clearedProfile,
      ...monthDayFields
    };

    this.rollingOver = true;
    this.companyProfileService
      .saveProfile(payload)
      .pipe(
        switchMap((savedProfile) => {
          this.companyProfile = savedProfile;
          this.patchCampaignConfig(savedProfile);
          if (!this.resetDailyMetricOnRollover) {
            return of(savedProfile);
          }
          return this.resetDailyOilMetric().pipe(
            catchError(() => of(savedProfile)),
            switchMap(() => of(savedProfile))
          );
        })
      )
      .subscribe({
        next: () => {
          this.rollingOver = false;
          this.campaignForm.disable();
          this.formEnabled = false;
          this.toast.success('GENERAL_CONFIG_UI.PRODUCTION_CONFIG.ROLLOVER_SUCCESS');
        },
        error: () => {
          this.rollingOver = false;
          this.toast.error('AUTO.ERREUR_LORS_DE_L_ENREGISTREMENT_DE_LA_CAMPAGNE');
        }
      });
  }

  private resetDailyOilMetric() {
    return this.parameterService.ensureParameterByCode(this.dailyMetricCode).pipe(
      switchMap((param) => {
        const existing = parseDailyMetricPayload(param.value);
        const nextValue = JSON.stringify({ current: 0, history: existing.history ?? [] });
        return this.parameterService.updateValue({ ...param, value: nextValue });
      })
    );
  }

  onSave(): void {
    if (this.campaignForm.invalid) {
      return;
    }

    const currentProfile = this.companyProfile ?? this.companyProfileService.getProfileFromCache();
    if (!currentProfile) {
      this.toast.error('AUTO.IMPOSSIBLE_DE_CHARGER_LA_CONFIGURATION_DE_CAMPAGNE');
      return;
    }

    const rawValue = this.campaignForm.getRawValue();
    const campaignStartAt = this.campaignService.combineDateTime(rawValue.campaignStartDate, rawValue.campaignStartTime);
    const monthDayFields = this.campaignService.extractMonthDayFields(campaignStartAt, rawValue.campaignEndAt, currentProfile);

    const payload: CompanyProfile = {
      ...currentProfile,
      campaignStartAt,
      campaignEndAt: rawValue.campaignEndAt ?? undefined,
      ...monthDayFields
    };

    this.companyProfileService.saveProfile(payload).subscribe({
      next: (savedProfile) => {
        this.companyProfile = savedProfile;
        this.patchCampaignConfig(savedProfile);
        this.campaignForm.disable();
        this.formEnabled = false;
        this.toast.success('AUTO.CONFIGURATION_DE_CAMPAGNE_ENREGISTREE_AVEC_SUCCES');
      },
      error: () => {
        this.toast.error('AUTO.ERREUR_LORS_DE_L_ENREGISTREMENT_DE_LA_CAMPAGNE');
      }
    });
  }

  private loadCampaignConfig(): void {
    const cachedProfile = this.companyProfileService.getProfileFromCache();
    if (cachedProfile) {
      this.companyProfile = cachedProfile;
      this.patchCampaignConfig(cachedProfile);
      this.loading = false;
    }

    this.companyProfileService.getProfile().subscribe({
      next: (profile) => {
        this.companyProfile = profile;
        this.patchCampaignConfig(profile);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        if (!cachedProfile) {
          this.toast.error('AUTO.IMPOSSIBLE_DE_CHARGER_LA_CONFIGURATION_DE_CAMPAGNE');
        }
      }
    });
  }

  private patchCampaignConfig(profile: CompanyProfile | null): void {
    const { date, time } = this.campaignService.splitDateTime(profile?.campaignStartAt);
    this.campaignForm.patchValue(
      {
        campaignStartDate: date ?? this.campaignService.resolveStartDate(profile),
        campaignStartTime: date ? time : '00:00',
        campaignEndAt: profile?.campaignEndAt ?? null
      },
      { emitEvent: false }
    );
    this.warnIfCampaignEndingSoon(profile);
  }

  private warnIfCampaignEndingSoon(profile: CompanyProfile | null): void {
    if (!profile?.campaignEndAt) {
      return;
    }
    const end = new Date(profile.campaignEndAt);
    if (Number.isNaN(end.getTime())) {
      return;
    }
    const daysLeft = (end.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysLeft < 0 || daysLeft > 14) {
      return;
    }
    this.tenantParams.getBoolean('NOTIFY_ON_CAMPAIGN_END', true).subscribe((enabled) => {
      if (enabled) {
        this.toast.info('GENERAL_CONFIG_UI.PRODUCTION_CONFIG.CAMPAIGN_ENDING_SOON', {
          days: Math.ceil(daysLeft)
        });
      }
    });
  }

  private buildCampaignProfileFromForm(): CompanyProfile {
    const rawValue = this.campaignForm.getRawValue();
    return {
      ...(this.companyProfile ?? {}),
      campaignStartAt: this.campaignService.combineDateTime(rawValue.campaignStartDate, rawValue.campaignStartTime),
      campaignEndAt: rawValue.campaignEndAt ?? undefined
    } as CompanyProfile;
  }
}
