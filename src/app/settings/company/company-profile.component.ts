import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CompanyProfileService } from '../../shared/services/company-profile.service';
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
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { NgIf } from '@angular/common';
import { CommonModule } from '@angular/common';

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
    TranslateModule,
    MatTooltipModule,
    MatProgressSpinner,
    NgIf
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
    private snackBar: MatSnackBar,
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
    this.loadProfile();
    // this.profileForm.disable(); // Remove this line from ngOnInit
    this.profileForm.valueChanges.subscribe(val => {
      console.log('Form value changed:', val);
      console.log('Form valid:', this.profileForm.valid);
    });
  }

  loadProfile() {
    this.loading = true;
    // Try to load from localStorage first
    const cached = localStorage.getItem('company_profile');
    let parsed: CompanyProfile | null = null;
    if (cached) {
      try {
        parsed = JSON.parse(cached);
      } catch {
        parsed = null;
      }
    }
    if (parsed && typeof parsed === 'object' && parsed.legalName) {
      // Use cached profile
      this.loading = false;
      this.profile = parsed;
      this.originalProfile = JSON.parse(JSON.stringify(this.profile));
      this.profileForm.patchValue({
        legalName: this.profile.legalName,
        registrationNumber: this.profile.registrationNumber,
        taxId: this.profile.taxId,
        cnssNumber: this.profile.cnssNumber,
        legalForm: this.profile.legalForm,
        capital: this.profile.capital,
        email: this.profile.email,
        phone: this.profile.phone,
        website: this.profile.website,
        addressLine1: this.profile.addressLine1,
        city: this.profile.city,
        postalCode: this.profile.postalCode,
        governorate: this.profile.governorate,
        logoData: this.profile.logoData,
        logoContentType: this.profile.logoContentType
      });
      this.bankAccounts = this.profile.bankAccounts || [];
      if (this.profile.logoData && this.profile.logoContentType) {
        this.logoPreview = `data:${this.profile.logoContentType};base64,${this.profile.logoData}`;
      }
      this.profileForm.disable();
      return;
    }
    // If not in cache, fetch from backend
    this.companyProfileService.getProfile().subscribe(
      (res) => {
        this.loading = false;
        if (res && res.success && res.data && res.data.length > 0) {
          this.profile = res.data[0];
          this.originalProfile = JSON.parse(JSON.stringify(this.profile));
          localStorage.setItem('company_profile', JSON.stringify(this.profile));
          this.profileForm.patchValue({
            legalName: this.profile.legalName,
            registrationNumber: this.profile.registrationNumber,
            taxId: this.profile.taxId,
            cnssNumber: this.profile.cnssNumber,
            legalForm: this.profile.legalForm,
            capital: this.profile.capital,
            email: this.profile.email,
            phone: this.profile.phone,
            website: this.profile.website,
            addressLine1: this.profile.addressLine1,
            city: this.profile.city,
            postalCode: this.profile.postalCode,
            governorate: this.profile.governorate,
            logoData: this.profile.logoData,
            logoContentType: this.profile.logoContentType
          });
          this.bankAccounts = this.profile.bankAccounts || [];
          if (this.profile.logoData && this.profile.logoContentType) {
            this.logoPreview = `data:${this.profile.logoContentType};base64,${this.profile.logoData}`;
          }
          this.profileForm.disable();
        } else {
          this.profile = null;
          this.originalProfile = null;
          this.profileForm.reset();
          this.bankAccounts = [];
          this.logoPreview = null;
        }
      },
      () => {
        this.loading = false;
        this.snackBar.open(this.translate.instant('GENERAL_CONFIG.MESSAGES.LOAD_ERROR'), 'Close', { duration: 3000 });
      }
    );
  }

  enableForm() {
    this.formEnabled = true;
    this.profileForm.enable();
    this.profileForm.markAsPristine(); // Reset dirty state when entering edit mode
  }

  onSave(): void {
    console.log('onSave called');
    console.log('Form value:', this.profileForm.value);
    console.log('Form valid:', this.profileForm.valid);
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      console.log('Form is invalid, aborting save.');
      return;
    }
    if (!this.profileForm.get('logoData')?.value) {
      this.snackBar.open(this.translate.instant('GENERAL_CONFIG.MESSAGES.LOGO_REQUIRED'), 'Close', { duration: 3000 });
      console.log('Logo is missing, aborting save.');
      return;
    }
    this.loading = true;
    const formValue = this.profileForm.getRawValue();
    const profileToSave: CompanyProfile = {
      ...formValue,
      id: this.profile?.id,
      bankAccounts: this.profile?.bankAccounts || []
    };
    console.log('Saving profile:', profileToSave);
    this.companyProfileService.saveProfile(profileToSave).subscribe({
      next: () => {
        this.snackBar.open(this.translate.instant('GENERAL_CONFIG.MESSAGES.SAVE_SUCCESS'), 'Close', { duration: 3000 });
        this.loadProfile();
        this.profileForm.disable();
        this.formEnabled = false;
        this.loading = false;
        console.log('Profile saved successfully.');
      },
      error: (err) => {
        this.snackBar.open(this.translate.instant('GENERAL_CONFIG.MESSAGES.SAVE_ERROR'), 'Close', { duration: 3000 });
        this.loading = false;
        console.error('Error saving profile:', err);
      }
    });
  }

  onReset(): void {
    if (this.hasProfileChanged()) {
      this.showResetConfirm = true;
      return;
    }
    this.doReset();
  }

  doReset(): void {
    this.profileForm.reset();
    this.profileForm.disable();
    this.formEnabled = false;
    this.showResetConfirm = false;
    this.snackBar.open(this.translate.instant('GENERAL_CONFIG.MESSAGES.RESET'), 'Close', { duration: 2000 });
  }

  cancelReset(): void {
    this.showResetConfirm = false;
  }

  onLogoPicked(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const maxKb = 200 * 1024;
    if (file.size > maxKb) {
      this.snackBar.open(this.translate.instant('GENERAL_CONFIG.MESSAGES.LOGO_TOO_LARGE'), 'Close', { duration: 3000 });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.logoPreview = reader.result as string;
      const base64 = this.logoPreview.split(',')[1];
      this.profileForm.patchValue({
        logoData: base64,
        logoContentType: file.type
      });
    };
    reader.readAsDataURL(file);
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
      this.snackBar.open('Only PNG/JPEG allowed', 'Close', { duration: 3000 });
      return;
    }
    if (file.size > maxBytes) {
      this.snackBar.open(this.translate.instant('GENERAL_CONFIG.MESSAGES.LOGO_TOO_LARGE'), 'Close', { duration: 3000 });
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
    // If there is no original profile (first creation), allow saving
    if (!this.originalProfile) return true;
    const current = { ...this.profileForm.getRawValue(), id: this.profile?.id };
    const changed = JSON.stringify(current) !== JSON.stringify(this.originalProfile);
    console.log('hasProfileChanged:', changed, 'Current:', current, 'Original:', this.originalProfile);
    return changed;
  }

  get invalidControls(): string[] {
    const invalid = [];
    const controls = this.profileForm.controls;
    for (const name in controls) {
      if (controls[name].invalid) {
        invalid.push(name);
      }
    }
    return invalid;
  }
}
