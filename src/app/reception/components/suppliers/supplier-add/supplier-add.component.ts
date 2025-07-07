import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs';

import { SupplierType } from '../../../../shared/models/supplier-type';
import { SupplierTypeService } from '../../../../shared/services/supplier.service';
import { GenericTypeService } from '../../../../shared/services/generic-type.service';
import { BaseType } from '../../../../shared/models/base-type';
import { TypeCategory } from '../../../../shared/models/type-category.enum';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatIcon } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

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
    MatProgressSpinner,
    MatIcon,
    TranslateModule
  ],
  templateUrl: './supplier-add.component.html',
  styleUrls: ['./supplier-add.component.scss']
})
export class SupplierAddComponent implements OnInit, OnDestroy {
  supplierForm: FormGroup;
  isEditMode = false;
  supplierId: string | null = null;
  supplierTypes: BaseType[] = [];
  regions: BaseType[] = [];
  loading = false;
  error: string | null = null;
  private subs = new Subscription();

  constructor(
    private fb: FormBuilder,
    private supplierService: SupplierTypeService,
    private genericTypeService: GenericTypeService,
    private snackBar: MatSnackBar,
    protected router: Router,
    private route: ActivatedRoute
  ) {
    this.supplierForm = this.fb.group({
      supplierInfo: this.fb.group({
        id: [''],
        name: ['', Validators.required],
        lastname: ['', Validators.required],
        phone: ['', Validators.required],
        email: ['', [Validators.email]], // <-- only email format, not required
        address: ['', Validators.required],
        region: [null, Validators.required],
        rib: [''],
        bankName: ['']
      }),
      genericSupplierType: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadRecords(TypeCategory.SUPPLIER_TYPE);
    this.loadRecords(TypeCategory.REGION);

    this.supplierId = this.route.snapshot.paramMap.get('id');
    if (this.supplierId) {
      this.isEditMode = true;
      this.loadSupplier(this.supplierId);
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  initializeForm(): void {
    this.supplierForm = this.fb.group({
      supplierInfo: this.fb.group({
        id: [''],
        name: ['', [Validators.required, Validators.minLength(2)]],
        lastname: ['', [Validators.required, Validators.minLength(2)]],
        phone: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
        email: ['', [Validators.email]], // <-- only email format, not required
        address: ['', [Validators.required, Validators.minLength(5)]],
        region: [null, Validators.required],
        rib: ['', Validators.pattern(/^[0-9]{15}$/)],
        bankName: ['']
      }),
      genericSupplierType: [null, Validators.required]
    });
  }

  loadRecords(type: TypeCategory): void {
    this.subs.add(
      this.genericTypeService.getAllTypes(type).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            if (type === TypeCategory.REGION) {
              this.regions = res.data;
            } else if (type === TypeCategory.SUPPLIER_TYPE) {
              this.supplierTypes = res.data;
            }
          }
        },
        error: (err) => {
          console.error('Error loading records:', err);
          this.toast('Erreur lors du chargement des données');
        }
      })
    );
  }

  loadSupplier(id: string): void {
    this.loading = true;
    this.error = null;

    this.subs.add(
      this.supplierService.getSupplier(id).subscribe({
        next: (res) => {
          if (res && res.success && res.data) {
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
    const payload: SupplierType = {
      supplierInfo: {
        id: formValue.supplierInfo.id,
        name: formValue.supplierInfo.name,
        lastname: formValue.supplierInfo.lastname,
        phone: formValue.supplierInfo.phone,
        email: formValue.supplierInfo.email,
        address: formValue.supplierInfo.address,
        region: formValue.supplierInfo.region,
        rib: formValue.supplierInfo.rib || '',
        bankName: formValue.supplierInfo.bankName || ''
      },
      genericSupplierType: formValue.genericSupplierType
    };

    if (this.isEditMode && this.supplierId) {
      this.subs.add(
        this.supplierService.updateSupplier(payload).subscribe({
          next: (res) => {
            if (res.success) {
              this.toast('Fournisseur modifié avec succès');
              this.router.navigate(['/reception/fournisseur']);
            } else {
              this.error = res.message || 'Erreur lors de la modification';
            }
            this.loading = false;
          },
          error: (err) => {
            console.error('Error updating supplier:', err);
            this.error = 'Erreur lors de la modification';
            this.loading = false;
          }
        })
      );
    } else {
      this.subs.add(
        this.supplierService.addSupplier(payload).subscribe({
          next: (res) => {
            if (res.success) {
              this.toast('Fournisseur créé avec succès');
              this.router.navigate(['/reception/fournisseur']);
            } else {
              this.error = res.message || 'Erreur lors de la création';
            }
            this.loading = false;
          },
          error: (err) => {
            console.error('Error adding supplier:', err);
            this.error = 'Erreur lors de la création';
            this.loading = false;
          }
        })
      );
    }
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  toast(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  objectComparisonFunction(option: BaseType | null, value: BaseType | null): boolean {
    return option && value ? option.id === value.id : option === value;
  }
}
