import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CompanyProfileService } from '../../shared/services/company-profile.service';
import { ToastService } from '../../shared/services/toast.service';
import { CompanyProfile } from '../../shared/models/CompanyProfile';
import { BankAccount } from '../../finance/models/BankAccount';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
    MatCardModule,
    MatListModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    TranslateModule
  ]
})
export class CompanyProfileComponent implements OnInit {
  profileForm!: FormGroup;
  logoPreview: string | null = null;
  fileOver = false;
  loading = false;
  bankAccounts: BankAccount[] = [];
  protected profile: CompanyProfile | null = null;
  private originalProfile: CompanyProfile | null = null;
  private translate = inject(TranslateService);

  governorates: string[] = [
    'Ariana', 'Beja', 'Ben Arous', 'Bizerte', 'Gabes', 'Gafsa', 'Jendouba',
    'Kairouan', 'Kasserine', 'Kebili', 'Kef', 'Mahdia', 'Manouba',
    'Medenine', 'Monastir', 'Nabeul', 'Sfax', 'Sidi Bouzid', 'Siliana',
    'Sousse', 'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan'
  ];

  formEnabled = false;
  showResetConfirm = false;

  constructor(
    private fb: FormBuilder,
    private toastService: ToastService,
    private companyProfileService: CompanyProfileService
  ) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      legalName: ['', Validators.required],
      registrationNumber: ['', Validators.required],
      taxId: ['', Validators.required],
      cnssNumber: [''],
      legalForm: ['SARL', Validators.required],
      capital: [0, Validators.required],
      creationDate: [null, Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      website: ['', Validators.required],
      addressLine1: ['', Validators.required],
      city: ['', Validators.required],
      postalCode: ['', Validators.required],
      governorate: ['', Validators.required],
      logoData: [null, Validators.required],
      logoContentType: [null, Validators.required]
    });

    this.profileForm.valueChanges.subscribe(val => {
      console.log('Form value changed:', val);
      console.log('Form valid:', this.profileForm.valid);
    });

    this.loadProfile();
  }

  loadProfile() {
    this.loading = true;
    const cached = localStorage.getItem('company_profile');
    let parsed: any = null;
    if (cached) {
      try {
        parsed = JSON.parse(cached);
      } catch {
        parsed = null;
      }
    }
    let profileObj: CompanyProfile | null = null;
    if (parsed && typeof parsed === 'object') {
      profileObj = Array.isArray(parsed) ? parsed[0] : parsed;
    }
    if (profileObj && profileObj.legalName) {
      this.applyProfile(profileObj);
      this.profileForm.disable();
      this.loading = false;
      return;
    }
    this.companyProfileService.getProfile().subscribe(
      res => {
        this.loading = false;
        const data: any = res.data;
        const profileData: CompanyProfile | null = Array.isArray(data) ? data[0] : data;
        if (profileData && profileData.legalName) {
          this.applyProfile(profileData);
          this.profileForm.disable();
        } else {
          this.resetForm();
        }
      },
      () => {
        this.loading = false;
        this.toastService.error('GENERAL_CONFIG.MESSAGES.LOAD_ERROR');
      }
    );
  }

  private applyProfile(profileData: CompanyProfile) {
    this.profile = profileData;
    this.originalProfile = JSON.parse(JSON.stringify(profileData));
    localStorage.setItem('company_profile', JSON.stringify(profileData));

    this.profileForm.patchValue({
      legalName: profileData.legalName,
      registrationNumber: profileData.registrationNumber,
      taxId: profileData.taxId,
      cnssNumber: profileData.cnssNumber,
      legalForm: profileData.legalForm,
      capital: profileData.capital,
      email: profileData.email,
      phone: profileData.phone,
      website: profileData.website,
      addressLine1: profileData.addressLine1,
      city: profileData.city,
      postalCode: profileData.postalCode,
      governorate: profileData.governorate,
      logoData: profileData.logoData,
      logoContentType: profileData.logoContentType
    });

    this.bankAccounts = profileData.bankAccounts || [];
    if (profileData.logoData && profileData.logoContentType) {
      this.logoPreview = `data:${profileData.logoContentType};base64,${profileData.logoData}`;
    }
  }

  private resetForm() {
    this.profile = null;
    this.originalProfile = null;
    this.profileForm.reset();
    this.bankAccounts = [];
    this.logoPreview = null;
  }

  enableForm() {
    this.formEnabled = true;
    this.profileForm.enable();
    this.profileForm.markAsPristine();
  }

  onSave(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    if (!this.profileForm.get('logoData')?.value) {
      this.toastService.error('GENERAL_CONFIG.MESSAGES.LOGO_REQUIRED');
      return;
    }
    this.loading = true;
    const formValue = this.profileForm.getRawValue();
    const profileToSave: CompanyProfile = {
      ...formValue,
      id: this.profile?.id,
      bankAccounts: this.profile?.bankAccounts || []
    };
    this.companyProfileService.saveProfile(profileToSave).subscribe({
      next: () => {
        this.toastService.success('GENERAL_CONFIG.MESSAGES.SAVE_SUCCESS');
        this.loadProfile();
      },
      error: () => {
        this.loading = false;
        this.toastService.error('GENERAL_CONFIG.MESSAGES.SAVE_ERROR');
      }
    });
  }

  onReset(): void {
    if (this.hasProfileChanged()) {
      this.showResetConfirm = true;
    } else {
      this.doReset();
    }
  }

  doReset(): void {
    this.resetForm();
    this.profileForm.disable();
    this.formEnabled = false;
    this.showResetConfirm = false;
    this.toastService.info('GENERAL_CONFIG.MESSAGES.RESET');
  }

  cancelReset(): void {
    this.showResetConfirm = false;
  }

  onLogoPicked(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.handleFile(file);
      this.profileForm.get('logoData')?.markAsDirty();
      this.profileForm.markAsDirty();
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.fileOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.fileOver = false;
  }

  onFileDropped(event: DragEvent) {
    event.preventDefault();
    this.fileOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.handleFile(file);
  }
  onFilePicked(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.handleFile(file);
    this.profileForm.get('logoData')?.markAsDirty();
    this.profileForm.markAsDirty();
  }
  removeLogo() {
    this.logoPreview = null;
    this.profileForm.patchValue({ logoData: null, logoContentType: null });
  }

  private handleFile(file: File) {
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
      const [, base64] = this.logoPreview.split(',');
      this.profileForm.patchValue({
        logoData: base64,
        logoContentType: file.type
      });
    };
    reader.readAsDataURL(file);
  }

  hasProfileChanged(): boolean {
    if (!this.originalProfile) return true;
    const current = { ...this.profileForm.getRawValue(), id: this.profile?.id };
    return JSON.stringify(current) !== JSON.stringify(this.originalProfile);
  }

  get invalidControls(): string[] {
    const invalid = [];
    for (const name in this.profileForm.controls) {
      if (this.profileForm.controls[name].invalid) {
        invalid.push(name);
      }
    }
    return invalid;
  }
}
