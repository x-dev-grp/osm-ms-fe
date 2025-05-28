import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
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
import { SharedModule } from '../../demo/shared/shared.module';
import { BankAccount } from '../../finance/models/BankAccount';
import { CompanyProfileService } from '../../shared/services/company-profile.service';
import { CompanyProfile } from '../../shared/models/CompanyProfile';

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
    SharedModule
  ],
  templateUrl: './general-config.component.html',
  styleUrl: './general-config.component.scss'
})
export class GeneralConfigComponent implements OnInit {
  /** Reactive‑form with all profile fields */
  millProfileForm!: FormGroup;
  logoPreview: string | null = null;
  fileOver = false;
  /** Governorate dropdown list */
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

  bankAccounts: BankAccount[] = [];
  private profile: CompanyProfile;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private companyProfileService: CompanyProfileService
  ) {}

  ngOnInit(): void {
    this.millProfileForm = this.fb.group({
      legalName: ['', Validators.required],
      registrationNumber: ['', Validators.required],
      taxId: ['', Validators.required],
      cnssNumber: [''],
      legalForm: ['SARL'],
      capital: [0],
      creationDate: [null],

      email: ['', [Validators.email]],
      phone: [''],
      website: [''],

      addressLine1: [''],
      city: [''],
      postalCode: [''],
      governorate: [''],

      // Logo fields
      logoData: [null],
      logoContentType: [null]
    });

    this.loadProfile();
  }

  onSave(): void {
    if (this.millProfileForm.invalid) {
      this.millProfileForm.markAllAsTouched();
      return;
    }

    const dto = {
      ...this.millProfileForm.value,
      bankAccounts: this.bankAccounts
    };

    this.companyProfileService.saveProfile(dto).subscribe({
      next: () => {
        this.snackBar.open('Profile saved successfully', 'Close', { duration: 3000 });
        this.loadProfile();
      },
      error: () => this.snackBar.open('Save failed', 'Close', { duration: 3000 })
    });
  }

  onReset(): void {
    this.millProfileForm.reset();
  }

  /** Handle file input, enforce <200KB, store base64   mime */
  onLogoPicked(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const maxKb = 200 * 1024; // 200 KB
    if (file.size > maxKb) {
      this.snackBar.open('Logo too large (max 200 KB)', 'Close', { duration: 3000 });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.logoPreview = reader.result as string;
      const base64 = this.logoPreview.split(',')[1];
      this.millProfileForm.patchValue({
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
  }

  removeLogo() {
    this.logoPreview = null;
    this.millProfileForm.patchValue({ logoData: null, logoContentType: null });
  }

  /** Pretend service call – replace with real API later */
  private loadProfile(): void {
    this.companyProfileService.getProfile().subscribe(
      (res) => {
        if (res && res.success) {
          this.profile = res.data[0];
          this.millProfileForm.patchValue({
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
        }
      },
      (err) => console.error('Error loading deliveries', err)
    );
  }

  private handleFile(file: File) {
    const maxBytes = 200 * 1024; // 200 KB
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      this.snackBar.open('Only PNG/JPEG allowed', 'Close', { duration: 3000 });
      return;
    }
    if (file.size > maxBytes) {
      this.snackBar.open('Logo too large (max 200 KB)', 'Close', { duration: 3000 });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.logoPreview = reader.result as string;
      const [, base64] = this.logoPreview.split(',');
      this.millProfileForm.patchValue({
        logoData: base64,
        logoContentType: file.type
      });
    };
    reader.readAsDataURL(file);
  }
}
