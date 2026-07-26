import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CompanyProfileService } from '../../shared/services/company-profile.service';
import { ToastService } from '../../shared/services/toast.service';
import { CompanyProfile } from '../../shared/models/CompanyProfile';
import { BankAccount } from '../../finance/models/BankAccount';
import { BankAccountService } from '../../finance/service/bankAccount.service';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../shared/services/language.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CardComponent } from '../../theme/components/card/card.component';

@Component({
  selector: 'app-company-profile',
  standalone: true,
  templateUrl: './company-profile.component.html',
  styleUrls: ['./company-profile.component.scss'],
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
    MatListModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    TranslateModule,
    CardComponent,
    RouterModule
  ]
})
export class CompanyProfileComponent implements OnInit {
  profileForm!: FormGroup;
  logoPreview: string | null = null;
  loading = false;
  bankAccounts: BankAccount[] = [];
  protected profile: CompanyProfile | null = null;
  private originalProfile: CompanyProfile | null = null;
  private translate = inject(TranslateService);
  private languageService = inject(LanguageService);

  governorates: string[] = [
    'Ariana',
    'Beja',
    'Ben Arous',
    'Bizerte',
    'Gabes',
    'Gafsa',
    'Jendouba',
    'Kairouan',
    'Kasserine',
    'Kebili',
    'Kef',
    'Mahdia',
    'Manouba',
    'Medenine',
    'Monastir',
    'Nabeul',
    'Sfax',
    'Sidi Bouzid',
    'Siliana',
    'Sousse',
    'Tataouine',
    'Tozeur',
    'Tunis',
    'Zaghouan'
  ];

  formEnabled = false;
  showResetConfirm = false;

  constructor(
    private fb: FormBuilder,
    private toastService: ToastService,
    private companyProfileService: CompanyProfileService,
    private bankAccountService: BankAccountService
  ) {}

  get displayName(): string {
    return this.profileForm?.get('legalName')?.value || this.translate.instant('GENERAL_CONFIG_UI.COMPANY_INFO.TITLE');
  }

  get legalFormLabel(): string {
    const form = this.profileForm?.get('legalForm')?.value;
    if (!form) {
      return '';
    }
    const key = `GENERAL_CONFIG_UI.COMPANY_INFO.LEGAL_FORMS.${form === 'Autre' ? 'OTHER' : form}`;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : form;
  }

  get formattedCapital(): string {
    const capital = this.profileForm?.get('capital')?.value;
    if (capital == null || capital === '') {
      return '—';
    }
    return `${Number(capital).toLocaleString()} TND`;
  }

  get formattedAddress(): string {
    const parts = [
      this.profileForm?.get('addressLine1')?.value,
      this.profileForm?.get('postalCode')?.value,
      this.profileForm?.get('city')?.value,
      this.profileForm?.get('governorate')?.value
    ].filter(Boolean);
    return parts.length ? parts.join(', ') : '—';
  }

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      legalName: ['', Validators.required],
      registrationNumber: ['', Validators.required],
      taxId: ['', Validators.required],
      cnssNumber: [''],
      legalForm: ['SARL', Validators.required],
      capital: [0, Validators.required],
      creationDate: [null],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      website: ['', Validators.required],
      addressLine1: ['', Validators.required],
      city: ['', Validators.required],
      postalCode: ['', Validators.required],
      governorate: ['', Validators.required],
      logoData: [null, Validators.required],
      logoContentType: [null, Validators.required],
      invoiceFooterNote: [''],
      invoiceLegalMentions: [''],
      preferredThemeColor: ['blue-theme'],
      defaultLanguage: ['fr'],
      timezone: ['Africa/Tunis'],
      pwaShortName: [''],
      invoiceBankName: [''],
      invoiceBankIban: [''],
      invoiceBankSwift: ['']
    });

    this.profileForm.disable();
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    const cached = this.companyProfileService.getProfileFromCache();
    if (cached?.legalName) {
      this.applyProfile(cached);
      this.loading = false;
      return;
    }

    this.companyProfileService.getProfile().subscribe({
      next: (res) => {
        this.loading = false;
        const profileData: CompanyProfile | null = Array.isArray(res) ? res[0] : res;
        if (profileData?.legalName) {
          this.applyProfile(profileData);
        } else {
          this.resetForm();
          this.enableForm();
        }
      },
      error: () => {
        this.loading = false;
        this.toastService.error('GENERAL_CONFIG.MESSAGES.LOAD_ERROR');
      }
    });
  }

  onSave(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    if (!this.profileForm.get('logoData')?.value) {
      this.toastService.error('COMPANY_PROFILE_UI.LOGO.REQUIRED');
      return;
    }

    this.loading = true;
    const formValue = this.profileForm.getRawValue();
    const creationDate = formValue.creationDate
      ? new Date(formValue.creationDate).toISOString().slice(0, 10)
      : null;
    const profileToSave: CompanyProfile = {
      ...formValue,
      creationDate,
      id: this.profile?.id,
      campaignStartAt: this.profile?.campaignStartAt,
      campaignEndAt: this.profile?.campaignEndAt,
      campaignStartMonth: this.profile?.campaignStartMonth,
      campaignStartDay: this.profile?.campaignStartDay,
      campaignEndMonth: this.profile?.campaignEndMonth,
      campaignEndDay: this.profile?.campaignEndDay
    };

    this.companyProfileService.saveProfile(profileToSave).subscribe({
      next: (saved) => {
        this.loading = false;
        this.formEnabled = false;
        this.profileForm.disable();
        this.applyProfile(saved);
        if (saved.defaultLanguage) {
          this.languageService.applyLanguage(saved.defaultLanguage, true);
        }
        this.toastService.success('CONTROLE_QUALITE.MESSAGES.SUCCESS.SAVE');
      },
      error: () => {
        this.loading = false;
        this.toastService.error('CONTROLE_QUALITE.MESSAGES.ERROR.SAVE');
      }
    });
  }

  enableForm(): void {
    this.formEnabled = true;
    this.profileForm.enable();
    this.profileForm.markAsPristine();
  }

  onReset(): void {
    if (this.hasProfileChanged()) {
      this.showResetConfirm = true;
      return;
    }
    this.revertChanges();
  }

  confirmReset(): void {
    this.showResetConfirm = false;
    this.revertChanges();
  }

  cancelReset(): void {
    this.showResetConfirm = false;
  }

  onFilePicked(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.handleFile(file);
      this.profileForm.get('logoData')?.markAsDirty();
      this.profileForm.markAsDirty();
    }
  }

  removeLogo(): void {
    this.logoPreview = null;
    this.profileForm.patchValue({ logoData: null, logoContentType: null });
    this.profileForm.markAsDirty();
  }

  private revertChanges(): void {
    if (this.originalProfile) {
      this.applyProfile(this.originalProfile);
    }
    this.formEnabled = false;
    this.profileForm.disable();
    this.profileForm.markAsPristine();
  }

  private resetForm(): void {
    this.profile = null;
    this.originalProfile = null;
    this.profileForm.reset();
    this.bankAccounts = [];
    this.logoPreview = null;
  }

  private applyProfile(profileData: CompanyProfile): void {
    this.profile = profileData;
    this.originalProfile = JSON.parse(JSON.stringify(profileData));

    this.profileForm.patchValue({
      legalName: profileData.legalName,
      registrationNumber: profileData.registrationNumber,
      taxId: profileData.taxId,
      cnssNumber: profileData.cnssNumber,
      legalForm: profileData.legalForm,
      capital: profileData.capital,
      creationDate: profileData.creationDate ? new Date(profileData.creationDate) : null,
      email: profileData.email,
      phone: profileData.phone,
      website: profileData.website,
      addressLine1: profileData.addressLine1,
      city: profileData.city,
      postalCode: profileData.postalCode,
      governorate: profileData.governorate,
      logoData: profileData.logoData,
      logoContentType: profileData.logoContentType,
      invoiceFooterNote: profileData.invoiceFooterNote ?? '',
      invoiceLegalMentions: profileData.invoiceLegalMentions ?? '',
      preferredThemeColor: profileData.preferredThemeColor ?? 'blue-theme',
      defaultLanguage: profileData.defaultLanguage ?? 'fr',
      timezone: profileData.timezone ?? 'Africa/Tunis',
      pwaShortName: profileData.pwaShortName ?? '',
      invoiceBankName: profileData.invoiceBankName ?? '',
      invoiceBankIban: profileData.invoiceBankIban ?? '',
      invoiceBankSwift: profileData.invoiceBankSwift ?? ''
    });

    if (profileData.logoData && profileData.logoContentType) {
      this.logoPreview = `data:${profileData.logoContentType};base64,${profileData.logoData}`;
    } else {
      this.logoPreview = null;
    }

    this.loadBankAccounts();
  }

  useBankForInvoices(acc: BankAccount): void {
    if (!this.formEnabled) {
      this.enableForm();
    }
    this.profileForm.patchValue({
      invoiceBankName: acc.bankName ?? '',
      invoiceBankIban: acc.iban || acc.rib || '',
      invoiceBankSwift: acc.bicSwift ?? ''
    });
    this.profileForm.markAsDirty();
  }

  private loadBankAccounts(): void {
    this.bankAccountService.getAllBanksList().subscribe({
      next: (res) => {
        const list = Array.isArray(res?.data) ? res.data : [];
        this.bankAccounts = list.filter((a) => a && (a.active ?? true));
      },
      error: () => {
        this.bankAccounts = [];
      }
    });
  }

  private handleFile(file: File): void {
    const maxBytes = 200 * 1024;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      this.toastService.error('GENERAL_CONFIG.MESSAGES.LOGO_FORMAT');
      return;
    }
    if (file.size > maxBytes) {
      this.toastService.error('GENERAL_CONFIG.MESSAGES.LOGO_TOO_LARGE');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.logoPreview = reader.result as string;
      const [, base64] = this.logoPreview!.split(',');
      this.profileForm.patchValue({
        logoData: base64,
        logoContentType: file.type
      });
    };
    reader.readAsDataURL(file);
  }

  private hasProfileChanged(): boolean {
    if (!this.originalProfile) {
      return this.profileForm.dirty;
    }
    const current = { ...this.profileForm.getRawValue(), id: this.profile?.id };
    return JSON.stringify(current) !== JSON.stringify({ ...this.originalProfile, id: this.profile?.id });
  }
}
