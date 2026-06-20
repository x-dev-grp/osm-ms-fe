import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterielSupplierService } from '../../../services/materiel-supplier.service';
import {
  Currency,
  MATERIEL_SUPPLIER_CURRENCIES,
  MaterielSupplier,
  MaterielSupplierCategory,
  materielSupplierCategoryLabels
} from '../../../models/materiel-supplier.model';
import { TranslateModule } from '@ngx-translate/core';
import { ToastService } from '../../../../shared/services/toast.service';

const URL_PATTERN = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*)?$/i;

@Component({
  selector: 'app-materiel-supplier-form',
  standalone: true,
  imports: [TranslateModule, CommonModule, ReactiveFormsModule],
  templateUrl: './materiel-supplier-form.component.html',
  styleUrls: ['./materiel-supplier-form.component.scss']
})
export class MaterielSupplierFormComponent implements OnInit {
  private readonly toastService = inject(ToastService);

  supplierForm: FormGroup;
  categories = Object.values(MaterielSupplierCategory);
  categoryLabels = materielSupplierCategoryLabels;
  currencies = MATERIEL_SUPPLIER_CURRENCIES;
  isEditMode = false;
  supplierId?: string;
  submitted = false;
  submitting = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private materielSupplierService: MaterielSupplierService
  ) {
    this.supplierForm = this.fb.group({
      code: [''],
      nom: ['', [Validators.required, Validators.maxLength(255)]],
      nomCommercial: ['', Validators.maxLength(255)],
      email: ['', Validators.email],
      telephone: ['', Validators.maxLength(50)],
      fax: ['', Validators.maxLength(50)],
      siteWeb: ['', Validators.pattern(URL_PATTERN)],
      numeroTva: ['', Validators.maxLength(50)],
      adresse: ['', Validators.maxLength(500)],
      ville: ['', Validators.maxLength(100)],
      codePostal: ['', Validators.maxLength(20)],
      pays: ['', Validators.maxLength(100)],
      contactNom: ['', Validators.maxLength(100)],
      contactPrenom: ['', Validators.maxLength(100)],
      contactEmail: ['', Validators.email],
      contactTelephone: ['', Validators.maxLength(50)],
      category: ['', Validators.required],
      delaiLivraisonMoyen: [0, [Validators.min(0)]],
      conditionsPaiement: ['', Validators.maxLength(255)],
      currency: [Currency.TND, Validators.required],
      actif: [true]
    });
  }

  ngOnInit(): void {
    this.supplierId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.supplierId;
    if (this.isEditMode) {
      this.loadSupplier();
    }
  }

  loadSupplier(): void {
    this.loading = true;
    this.materielSupplierService.getById(this.supplierId!).subscribe({
      next: (supplier) => {
        this.supplierForm.patchValue({
          code: supplier.code ?? '',
          nom: supplier.nom ?? '',
          nomCommercial: supplier.nomCommercial ?? '',
          email: supplier.email ?? '',
          telephone: supplier.telephone ?? '',
          fax: supplier.fax ?? '',
          siteWeb: supplier.siteWeb ?? '',
          numeroTva: supplier.numeroTva ?? '',
          adresse: supplier.adresse ?? '',
          ville: supplier.ville ?? '',
          codePostal: supplier.codePostal ?? '',
          pays: supplier.pays ?? '',
          contactNom: supplier.contactNom ?? '',
          contactPrenom: supplier.contactPrenom ?? '',
          contactEmail: supplier.contactEmail ?? '',
          contactTelephone: supplier.contactTelephone ?? '',
          category: supplier.category ?? '',
          delaiLivraisonMoyen: supplier.delaiLivraisonMoyen ?? 0,
          conditionsPaiement: supplier.conditionsPaiement ?? '',
          currency: supplier.currency ?? Currency.TND,
          actif: supplier.actif ?? true
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.error('MATERIEL_SUPPLIER.ERRORS.LOAD_FAILED');
        void this.router.navigate(['/stock/materiel-suppliers']);
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;
    this.normalizeOptionalFields();

    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      this.toastService.error('MATERIEL_SUPPLIER.ERRORS.INVALID_FORM');
      document.querySelector('.is-invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    this.submitting = true;
    const supplier = this.buildPayload();

    if (this.isEditMode) {
      this.materielSupplierService.update(this.supplierId!, supplier).subscribe({
        next: () => void this.router.navigate(['/stock/materiel-suppliers', this.supplierId]),
        error: (error) => this.handleSubmitError('MATERIEL_SUPPLIER.ERRORS.UPDATE_FAILED', error)
      });
      return;
    }

    this.materielSupplierService.create(supplier).subscribe({
      next: (created) => void this.router.navigate(['/stock/materiel-suppliers', created.id]),
      error: (error) => this.handleSubmitError('MATERIEL_SUPPLIER.ERRORS.CREATE_FAILED', error)
    });
  }

  onCancel(): void {
    if (this.isEditMode) {
      void this.router.navigate(['/stock/materiel-suppliers', this.supplierId]);
      return;
    }
    void this.router.navigate(['/stock/materiel-suppliers']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.supplierForm.get(fieldName);
    return !!control && control.invalid && (control.touched || this.submitted);
  }

  getFieldErrorKey(fieldName: string): string | null {
    const control = this.supplierForm.get(fieldName);
    if (!control?.errors || !this.isFieldInvalid(fieldName)) {
      return null;
    }

    if (control.errors['required']) {
      return this.requiredErrorKey(fieldName);
    }
    if (control.errors['email']) {
      return 'MATERIEL_SUPPLIER.ERRORS.EMAIL_INVALID';
    }
    if (control.errors['min']) {
      return 'MATERIEL_SUPPLIER.ERRORS.DELIVERY_DELAY_MIN';
    }
    if (control.errors['maxlength']) {
      return 'MATERIEL_SUPPLIER.ERRORS.MAX_LENGTH';
    }
    if (control.errors['pattern']) {
      return fieldName === 'siteWeb' ? 'MATERIEL_SUPPLIER.ERRORS.URL_INVALID' : 'MATERIEL_SUPPLIER.ERRORS.INVALID_VALUE';
    }

    return 'MATERIEL_SUPPLIER.ERRORS.INVALID_VALUE';
  }

  get f(): { [key: string]: AbstractControl } {
    return this.supplierForm.controls;
  }

  private requiredErrorKey(fieldName: string): string {
    switch (fieldName) {
      case 'nom':
        return 'MATERIEL_SUPPLIER.ERRORS.NAME_REQUIRED';
      case 'category':
        return 'MATERIEL_SUPPLIER.ERRORS.CATEGORY_REQUIRED';
      case 'currency':
        return 'MATERIEL_SUPPLIER.ERRORS.CURRENCY_REQUIRED';
      default:
        return 'MATERIEL_SUPPLIER.ERRORS.INVALID_VALUE';
    }
  }

  private normalizeOptionalFields(): void {
    ['email', 'contactEmail', 'siteWeb'].forEach((field) => {
      const control = this.supplierForm.get(field);
      const value = control?.value?.trim?.() ?? control?.value;
      if (control && (value === '' || value == null)) {
        control.setValue('');
        control.updateValueAndValidity({ emitEvent: false });
      }
    });
  }

  private buildPayload(): MaterielSupplier {
    const raw = this.supplierForm.getRawValue();
    const trim = (value: unknown): string | undefined => {
      if (typeof value !== 'string') {
        return undefined;
      }
      const trimmed = value.trim();
      return trimmed.length ? trimmed : undefined;
    };

    return {
      nom: raw.nom.trim(),
      nomCommercial: trim(raw.nomCommercial),
      email: trim(raw.email),
      telephone: trim(raw.telephone),
      fax: trim(raw.fax),
      siteWeb: trim(raw.siteWeb),
      numeroTva: trim(raw.numeroTva),
      adresse: trim(raw.adresse),
      ville: trim(raw.ville),
      codePostal: trim(raw.codePostal),
      pays: trim(raw.pays),
      contactNom: trim(raw.contactNom),
      contactPrenom: trim(raw.contactPrenom),
      contactEmail: trim(raw.contactEmail),
      contactTelephone: trim(raw.contactTelephone),
      category: raw.category,
      delaiLivraisonMoyen: raw.delaiLivraisonMoyen ?? 0,
      conditionsPaiement: trim(raw.conditionsPaiement),
      currency: raw.currency,
      actif: raw.actif ?? true,
      code: this.isEditMode ? (trim(raw.code) ?? '') : ''
    };
  }

  private handleSubmitError(defaultKey: string, error: { error?: { error?: string; message?: string } }): void {
    this.submitting = false;
    const serverMessage = error?.error?.error || error?.error?.message;
    if (serverMessage) {
      this.toastService.error(serverMessage);
      return;
    }
    this.toastService.error(defaultKey);
  }
}
