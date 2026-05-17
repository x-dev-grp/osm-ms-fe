import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ToastService } from '../../shared/services/toast.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
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
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CompanyProfileComponent } from '../company/company-profile.component';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ParameterComponent } from '../parameter/parameter.component';
import { CampaignService } from '../../shared/services/campaign.service';


@Component({
  selector: 'app-general-config',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
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

  productionConfigFormEnabled = false;
  financeConfigFormEnabled = false;
  hrConfigFormEnabled = false;
  otherConfigFormEnabled = false;

  readonly months = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Fevrier' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Aout' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Decembre' }
  ];

  constructor(
    private fb: FormBuilder,
    private toast: ToastService,
    private companyProfileService: CompanyProfileService,
    private campaignService: CampaignService
  ) {}

  ngOnInit(): void {
    this.productionConfigForm = this.fb.group({
      campaignStartMonth: [9, Validators.required],
      campaignStartDay: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
      campaignEndMonth: [4, Validators.required],
      campaignEndDay: [30, [Validators.required, Validators.min(1), Validators.max(31)]]
    });
    this.financeConfigForm = this.fb.group({
      millingPricePerKg: [0]
    });
    this.hrConfigForm = this.fb.group({});
    this.otherConfigForm = this.fb.group({});
    this.productionConfigForm.disable();
    this.financeConfigForm.disable();
    this.hrConfigForm.disable();
    this.otherConfigForm.disable();
    this.loadProductionConfig();
  }

  onSaveProductionConfig(): void {
    if (this.productionConfigForm.invalid) return;

    const currentProfile = this.companyProfile ?? this.companyProfileService.getProfileFromCache();
    if (!currentProfile) {
      this.toast.error('Impossible de charger la configuration de campagne');
      return;
    }

    const payload: CompanyProfile = {
      ...currentProfile,
      ...this.productionConfigForm.getRawValue()
    };

    this.companyProfileService.saveProfile(payload).subscribe({
      next: (savedProfile) => {
        this.companyProfile = savedProfile;
        this.productionConfigForm.patchValue({
          campaignStartMonth: savedProfile.campaignStartMonth ?? 9,
          campaignStartDay: savedProfile.campaignStartDay ?? 1,
          campaignEndMonth: savedProfile.campaignEndMonth ?? 4,
          campaignEndDay: savedProfile.campaignEndDay ?? 30
        });
        this.productionConfigForm.disable();
        this.productionConfigFormEnabled = false;
        this.toast.success('Configuration de campagne enregistree avec succes');
      },
      error: () => {
        this.toast.error('Erreur lors de l enregistrement de la campagne');
      }
    });
  }
  onSaveFinanceConfig(): void {
    if (this.financeConfigForm.invalid) return;
    // Implement save logic for finance config
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
    this.financeConfigForm.reset();
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
    return this.campaignService.getCampaignPreview(new Date(), this.productionConfigForm.getRawValue());
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
          this.toast.error('Impossible de charger la configuration de campagne');
        }
      }
    });
  }

  private patchProductionConfig(profile: CompanyProfile | null): void {
    this.productionConfigForm.patchValue({
      campaignStartMonth: profile?.campaignStartMonth ?? 9,
      campaignStartDay: profile?.campaignStartDay ?? 1,
      campaignEndMonth: profile?.campaignEndMonth ?? 4,
      campaignEndDay: profile?.campaignEndDay ?? 30
    }, { emitEvent: false });
  }
}
