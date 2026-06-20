import { Component, Inject, OnDestroy, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SupplierTypeService } from '../../../shared/services/supplier.service';
import { GenericTypeService } from '../../../shared/services/generic-type.service';
import { BaseTypeComponent } from '../../../shared/modules/base-type/base-type.component';
import { TypeCategory } from '../../../shared/models/type-category.enum';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { getCustomerCategories, PartnerCategory } from '../../../finance/models/PartnerCategory';
import { ToastService } from '../../../shared/services/toast.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SupplierType } from '../../../shared/models/supplier-type';
import { BaseType } from '../../../shared/models/base-type';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-supplier-add',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatIconModule,
    TranslateModule,
    BaseTypeComponent,
    MatCheckboxModule
  ],
  templateUrl: './supplier-add.component.html',
  styleUrls: ['./supplier-add.component.scss']
})
export class SupplierAddComponent implements OnInit, OnDestroy {
  public TypeCategory = TypeCategory;
  category: PartnerCategory = PartnerCategory.INDIVIDUAL;
  customerCategories = getCustomerCategories();
  supplierForm: FormGroup;
  isEditMode = false;
  supplierId: string | null = null;
  loading = false;
  error: string | null = null;
  /** Opened inside MatDialog (not as a routed page). */
  readonly inDialog: boolean;
  private subs = new Subscription();
  private created: SupplierType;

  constructor(
    private fb: FormBuilder,
    private supplierService: SupplierTypeService,
    private genericTypeService: GenericTypeService,
    private toastService: ToastService,
    private translateService: TranslateService,
    protected router: Router,
    private route: ActivatedRoute,
    @Optional() public dialogRef?: MatDialogRef<SupplierAddComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public dialogData?: any
  ) {
    this.supplierForm = this.fb.group({
      id: [null],
      name: ['', [Validators.required, Validators.minLength(2)]],
      lastname: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]{6,}$/)]],
      email: [''],
      address: [''],
      genericSupplierType: [null as BaseType | null, Validators.required],
      region: [null as BaseType | null, Validators.required], // BaseType
      hasStorage: [false],
      matriculeFiscal: [''],
      rib: [''],
      bankName: ['']
    });
    this.inDialog = !!this.dialogRef || !!this.dialogData?.fromDialog;
  }

  ngOnInit(): void {
    if (this.inDialog) {
      this.supplierForm.get('address')?.setValidators([Validators.required, Validators.minLength(5)]);
      this.supplierForm.get('address')?.updateValueAndValidity();
      return;
    }

    this.supplierId = this.route.snapshot.paramMap.get('id');

    if (this.supplierId && this.supplierId !== 'new') {
      this.isEditMode = true;
      this.loadSupplier(this.supplierId);
    }
  }

  /** Shared dialog options when opening this component from another screen. */
  static dialogConfig = {
    width: '720px',
    maxWidth: '95vw',
    maxHeight: '90vh',
    autoFocus: 'first-tapable' as const,
    panelClass: 'supplier-add-dialog',
    data: { fromDialog: true }
  };

  onSubmit(): void {
    if (this.supplierForm.invalid) {
      this.markFormGroupTouched(this.supplierForm);
      return;
    }

    this.loading = true;
    this.error = null;

    const v = this.supplierForm.value;

    const payload: SupplierType = {
      id: v.id ?? undefined,
      name: v.name,
      lastname: v.lastname,
      phone: v.phone,
      email: v.email,
      address: v.address,
      region: v.region,
      genericSupplierType: v.genericSupplierType,
      hasStorage: !!v.hasStorage,
      matriculeFiscal: v.matriculeFiscal,
      rib: v.rib,
      bankName: v.bankName
    } as SupplierType;

    const op = this.isEditMode ? this.supplierService.updateSupplier(payload) : this.supplierService.addSupplier(payload);

    this.subs.add(
      op.subscribe({
        next: (res) => {
          if (res?.success) {
            this.toastService.success(
              this.isEditMode
                ? this.translateService.instant('OSM_DASHBOARD.ACTIONS.SUCCESS') || 'Fournisseur modifié avec succès'
                : this.translateService.instant('OSM_DASHBOARD.ACTIONS.SUCCESS') || 'Fournisseur créé avec succès'
            );
            this.close(Array.isArray(res.data) ? res.data[0] : res.data);
          } else {
            this.error = res?.message || this.translateService.instant('LOGIN.UNEXPECTED_ERROR') || "Erreur lors de l'opération";
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error saving supplier:', err);
          this.error = this.translateService.instant('LOGIN.UNEXPECTED_ERROR') || "Erreur lors de l'opération";
          this.loading = false;
        }
      })
    );
  }

  onCancel(): void {
    if (this.loading) return;
    this.close(null);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  getErrorMessage(controlName: string): string {
    const control = this.supplierForm.get(controlName);
    if (control?.hasError('required')) {
      return this.translateService.instant('COMMON.VALIDATION.REQUIRED');
    }
    if (control?.hasError('email')) {
      return this.translateService.instant('COMMON.VALIDATION.EMAIL');
    }
    if (control?.hasError('maxlength')) {
      const maxLength = control.getError('maxlength').requiredLength;
      return this.translateService.instant('COMMON.VALIDATION.MAX_LENGTH', { maxLength });
    }
    if (control?.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return this.translateService.instant('COMMON.VALIDATION.MIN_LENGTH', { minLength });
    }
    if (control?.hasError('pattern')) {
      return this.translateService.instant('COMMON.VALIDATION.PATTERN');
    }
    return '';
  }

  /** Centralized close: dialog → close(result), page → navigate back */
  private close(result: SupplierType | null = null): void {
    if (this.inDialog) {
      this.dialogRef?.close(result);
    } else {
      this.router.navigate(['/reception/fournisseur']);
    }
  }

  private loadSupplier(id: string): void {
    this.loading = true;
    this.error = null;

    this.subs.add(
      this.supplierService.getSupplier(id).subscribe({
        next: (res) => {
          if (res?.success && res.data) {
            const supplier = (Array.isArray(res.data) ? res.data[0] : res.data) as SupplierType;

            this.supplierForm.patchValue({
              id: supplier.id ?? '',
              name: supplier.name ?? '',
              lastname: supplier.lastname ?? '',
              phone: supplier.phone ?? '',
              email: supplier.email ?? '',
              address: supplier.address ?? '',
              region: supplier.region ?? null,
              genericSupplierType: supplier.genericSupplierType ?? null,
              hasStorage: supplier.hasStorage ?? false,
              matriculeFiscal: supplier.matriculeFiscal ?? '',
              rib: supplier.rib ?? '',
              bankName: supplier.bankName ?? ''
            });
          } else {
            this.error = this.translateService.instant('SUPPLIER.ERRORS.NOT_FOUND') || 'Fournisseur non trouvé';
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading supplier:', err);
          this.error = this.translateService.instant('SUPPLIER.ERRORS.LOAD') || 'Erreur lors du chargement du fournisseur';
          this.loading = false;
        }
      })
    );
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control: any) => {
      control.markAsTouched?.();
      if (control?.controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }
}
