import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ToastService } from '../../../../shared/services/toast.service';
import { SupplierTypeService } from '../../../../shared/services/supplier.service';
import { GenericTypeService } from '../../../../shared/services/generic-type.service';
import { BaseTypeComponent } from '../../../../shared/modules/base-type/base-type.component';
import { TypeCategory } from '../../../../shared/models/type-category.enum';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { BaseType } from '../../../../shared/models/base-type';

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
    BaseTypeComponent
  ],
  templateUrl: './supplier-add.component.html',
  styleUrls: ['./supplier-add.component.scss']
})
export class SupplierAddComponent implements OnInit, OnDestroy {
  public TypeCategory = TypeCategory;
  supplierForm: FormGroup;
  isEditMode = false;
  supplierId: string | null = null;
  loading = false;
  error: string | null = null;
  private subs = new Subscription();

  constructor(
    private fb: FormBuilder,
    private supplierService: SupplierTypeService,
    private genericTypeService: GenericTypeService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.supplierForm = this.fb.group({
      supplierInfo: this.fb.group({
        id: [''],
        name: ['', [Validators.required, Validators.minLength(2)]],
        lastname: ['', [Validators.required, Validators.minLength(2)]],
        phone: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
        email: ['', [Validators.email]],
        address: ['', [Validators.required, Validators.minLength(5)]],
        region: [null, Validators.required],
        rib: ['', [Validators.pattern(/^[0-9]{15}$/)]],
        bankName: ['']
      }),
      genericSupplierType: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.supplierId = this.route.snapshot.paramMap.get('id');
    // Préchargement des types pour BaseTypeComponent
    this.genericTypeService.getAllTypes(TypeCategory.SUPPLIER_TYPE).subscribe();

    if (this.supplierId) {
      this.isEditMode = true;
      this.loadSupplier(this.supplierId);
    }
  }

  loadSupplier(id: string): void {
    this.loading = true;
    this.error = null;

    this.subs.add(
      this.supplierService.getSupplier(id).subscribe({
        next: (res) => {
          if (res?.success && res.data) {
            const supplier = Array.isArray(res.data) ? res.data[0] : res.data;
            this.supplierForm.patchValue({
              supplierInfo: {
                id: supplier.supplierInfo?.id || '',
                name: supplier.supplierInfo?.name || '',
                lastname: supplier.supplierInfo?.lastname || '',
                phone: supplier.supplierInfo?.phone || '',
                email: supplier.supplierInfo?.email || '',
                address: supplier.supplierInfo?.address || '',
                region: supplier.supplierInfo?.region || null,
                rib: supplier.supplierInfo?.rib || '',
                bankName: supplier.supplierInfo?.bankName || ''
              },
              genericSupplierType: supplier.genericSupplierType || null
            });
          } else {
            this.error = 'Fournisseur non trouvé';
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading supplier:', err);
          this.error = 'Erreur lors du chargement du fournisseur';
          this.loading = false;
        }
      })
    );
  }

  onSubmit(): void {
    if (this.supplierForm.invalid) {
      this.markFormGroupTouched(this.supplierForm);
      return;
    }

    this.loading = true;
    this.error = null;

    const formValue = this.supplierForm.value;
    const payload: any = {
      supplierInfo: { ...formValue.supplierInfo },
      genericSupplierType: formValue.genericSupplierType
    };

    const op = this.isEditMode
      ? this.supplierService.updateSupplier(payload)
      : this.supplierService.addSupplier(payload);

    this.subs.add(
      op.subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.success(
              this.isEditMode ? 'Fournisseur modifié avec succès' : 'Fournisseur créé avec succès'
            );
            this.router.navigate(['/reception/fournisseur']);
          } else {
            this.error = res.message || 'Erreur lors de l\'opération';
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error saving supplier:', err);
          this.error = 'Erreur lors de l\'opération';
          this.loading = false;
        }
      })
    );
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if ((control as FormGroup).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
