import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastService } from '../../shared/services/toast.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { SharedModule } from '../../shared/shared.module';
import { CompanyProfileService } from '../../shared/services/company-profile.service';
import { CompanyProfile } from '../../shared/models/CompanyProfile';
import { TranslateModule } from '@ngx-translate/core';
import { CompanyProfileComponent } from '../company/company-profile.component';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ParameterComponent } from '../parameter/parameter.component';
import { AppParameterService } from '../../shared/services/AppParameterService';
import { Parameter } from '../../shared/models/Parameter';
import { normalizeMetricValue } from '../../shared/services/DailyMetricPayload';
import { CampaignService } from '../../shared/services/campaign.service';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-general-config',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatCardModule,
    MatListModule,
    SharedModule,
    TranslateModule,
    CompanyProfileComponent,
    ParameterComponent
  ],
  templateUrl: './general-config.component.html',
  styleUrl: './general-config.component.scss'
})
export class GeneralConfigComponent implements OnInit {
  productionConfigForm!: FormGroup;
  financeConfigForm!: FormGroup;
  hrConfigForm!: FormGroup;
  otherConfigForm!: FormGroup;
  activeTab: string = 'company'; // default tab
  companyProfile: CompanyProfile | null = null;
  private millingPriceParameter: Parameter | null = null;
  private readonly millingPriceCode = 'PRIX_TRITURATION_KG';

  productionConfigFormEnabled = false;
  financeConfigFormEnabled = false;
  hrConfigFormEnabled = false;
  otherConfigFormEnabled = false;

  constructor(
    private fb: FormBuilder,
    private toast: ToastService,
    private companyProfileService: CompanyProfileService,
    private campaignService: CampaignService,
    private parameterService: AppParameterService
  ) {}

  ngOnInit(): void {
    this.productionConfigForm = this.fb.group({
      campaignStartDate: [null, Validators.required],
      campaignStartTime: ['00:00', Validators.required],
      campaignEndAt: [null as string | null]
    });
    this.financeConfigForm = this.fb.group({
      millingPricePerKg: [0, [Validators.required, Validators.min(0)]]
    });
    this.hrConfigForm = this.fb.group({});
    this.otherConfigForm = this.fb.group({});
    this.productionConfigForm.disable();
    this.financeConfigForm.disable();
    this.hrConfigForm.disable();
    this.otherConfigForm.disable();
    this.loadProductionConfig();
    this.loadFinanceConfig();
  }

  onSaveProductionConfig(): void {
    if (this.productionConfigForm.invalid) return;

    const currentProfile = this.companyProfile ?? this.companyProfileService.getProfileFromCache();
    if (!currentProfile) {
      this.toast.error('AUTO.IMPOSSIBLE_DE_CHARGER_LA_CONFIGURATION_DE_CAMPAGNE');
      return;
    }

    const rawValue = this.productionConfigForm.getRawValue();
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
        this.patchProductionConfig(savedProfile);
        this.productionConfigForm.disable();
        this.productionConfigFormEnabled = false;
        this.toast.success('AUTO.CONFIGURATION_DE_CAMPAGNE_ENREGISTREE_AVEC_SUCCES');
      },
      error: () => {
        this.toast.error('AUTO.ERREUR_LORS_DE_L_ENREGISTREMENT_DE_LA_CAMPAGNE');
      }
    });
  }
  onSaveFinanceConfig(): void {
    if (this.financeConfigForm.invalid) {
      return;
    }

    const rawValue = this.financeConfigForm.getRawValue().millingPricePerKg;
    const numericValue = normalizeMetricValue(rawValue);

    this.parameterService
      .ensureParameterByCode(this.millingPriceCode)
      .pipe(
        switchMap((parameter) => {
          const updatedParam: Parameter = {
            ...parameter,
            value: String(numericValue)
          };
          return this.parameterService.updateValue(updatedParam);
        })
      )
      .subscribe({
        next: (res) => {
          const updated = Array.isArray(res?.data) ? res.data[0] : res?.data;
          this.millingPriceParameter = updated ?? this.millingPriceParameter;
          this.patchFinanceConfig(this.millingPriceParameter);
          this.financeConfigForm.disable();
          this.financeConfigFormEnabled = false;
          this.toast.success('AUTO.CONFIGURATION_FINANCE_ENREGISTREE_AVEC_SUCCES');
        },
        error: () => {
          this.toast.error('AUTO.ERREUR_LORS_DE_L_ENREGISTREMENT_DU_PRIX_DE_TRITURATION');
        }
      });
  }
  onSaveHrConfig(): void {
    if (this.hrConfigForm.invalid) return;
    // Implement save logic for HR config
  }
  onSaveOtherConfig(): void {
    if (this.otherConfigForm.invalid) return;
    // Implement save logic for other config
  }

  onResetProductionConfig() {
    this.patchProductionConfig(this.companyProfile ?? this.companyProfileService.getProfileFromCache());
    this.productionConfigForm.disable();
    this.productionConfigFormEnabled = false;
  }
  onResetFinanceConfig() {
    this.patchFinanceConfig(this.millingPriceParameter);
    this.financeConfigForm.disable();
    this.financeConfigFormEnabled = false;
  }
  onResetHrConfig() {
    this.hrConfigForm.reset();
  }
  onResetOtherConfig() {
    this.otherConfigForm.reset();
  }

  enableProductionConfigForm() {
    this.productionConfigFormEnabled = true;
    this.productionConfigForm.enable();
  }
  enableFinanceConfigForm() {
    this.financeConfigFormEnabled = true;
    this.financeConfigForm.enable();
  }
  enableHrConfigForm() {
    this.hrConfigFormEnabled = true;
    this.hrConfigForm.enable();
  }
  enableOtherConfigForm() {
    this.otherConfigFormEnabled = true;
    this.otherConfigForm.enable();
  }

  // This function is called when a tab is changed
  onTabChange(event: MatTabChangeEvent) {
    // Log the event to the console
    console.log(event);
    const tabLabel = event.tab.textLabel.toLowerCase();

    if (tabLabel.includes('production')) {
      this.activeTab = 'parameter';
    } else if (tabLabel.includes('general')) {
      this.activeTab = 'company';
    } else if (tabLabel.includes('finance')) {
      this.activeTab = 'finance';
    } else {
      this.activeTab = 'other';
    }
  }

  get campaignPreview(): string {
    return this.campaignService.getCampaignPreview(new Date(), this.buildCampaignProfileFromForm());
  }

  get campaignEndDisplay(): string | null {
    const endAt = this.productionConfigForm.getRawValue().campaignEndAt as string | null;
    return endAt ? this.campaignService.formatDateTime(endAt) : null;
  }

  markCampaignEndDate(): void {
    if (!this.productionConfigFormEnabled) {
      return;
    }

    this.productionConfigForm.patchValue({
      campaignEndAt: new Date().toISOString()
    });
  }

  private loadProductionConfig(): void {
    const cachedProfile = this.companyProfileService.getProfileFromCache();
    if (cachedProfile) {
      this.companyProfile = cachedProfile;
      this.patchProductionConfig(cachedProfile);
    }

    this.companyProfileService.getProfile().subscribe({
      next: (profile) => {
        this.companyProfile = profile;
        this.patchProductionConfig(profile);
      },
      error: () => {
        if (!cachedProfile) {
          this.toast.error('AUTO.IMPOSSIBLE_DE_CHARGER_LA_CONFIGURATION_DE_CAMPAGNE');
        }
      }
    });
  }

  private patchProductionConfig(profile: CompanyProfile | null): void {
    const { date, time } = this.campaignService.splitDateTime(profile?.campaignStartAt);
    this.productionConfigForm.patchValue(
      {
        campaignStartDate: date ?? this.campaignService.resolveStartDate(profile),
        campaignStartTime: date ? time : '00:00',
        campaignEndAt: profile?.campaignEndAt ?? null
      },
      { emitEvent: false }
    );
  }

  private buildCampaignProfileFromForm(): CompanyProfile {
    const rawValue = this.productionConfigForm.getRawValue();
    return {
      ...(this.companyProfile ?? {}),
      campaignStartAt: this.campaignService.combineDateTime(rawValue.campaignStartDate, rawValue.campaignStartTime),
      campaignEndAt: rawValue.campaignEndAt ?? undefined
    } as CompanyProfile;
  }

  private loadFinanceConfig(): void {
    this.parameterService.ensureParameterByCode(this.millingPriceCode).subscribe({
      next: (parameter) => {
        this.millingPriceParameter = parameter;
        this.patchFinanceConfig(parameter);
      },
      error: () => {
        this.millingPriceParameter = null;
        this.patchFinanceConfig(null);
      }
    });
  }

  private patchFinanceConfig(parameter: Parameter | null): void {
    this.financeConfigForm.patchValue({ millingPricePerKg: normalizeMetricValue(parameter?.value) }, { emitEvent: false });
  }
}
