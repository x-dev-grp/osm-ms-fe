import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { CardComponent } from '../../theme/components/card/card.component';
import { CompanyProfileService } from '../../shared/services/company-profile.service';
import { CampaignService } from '../../shared/services/campaign.service';
import { ToastService } from '../../shared/services/toast.service';
import { CompanyProfile } from '../../shared/models/CompanyProfile';
import { ParameterComponent } from '../parameter/parameter.component';

@Component({
  selector: 'app-production-config',
  standalone: true,
  templateUrl: './production-config.component.html',
  styleUrl: './production-config.component.scss',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    TranslateModule,
    CardComponent,
    ParameterComponent
  ]
})
export class ProductionConfigComponent implements OnInit {
  campaignForm!: FormGroup;
  formEnabled = false;
  loading = true;
  companyProfile: CompanyProfile | null = null;

  constructor(
    private fb: FormBuilder,
    private companyProfileService: CompanyProfileService,
    private campaignService: CampaignService,
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
