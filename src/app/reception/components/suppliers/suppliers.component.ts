// File: suppliers.component.ts
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { SharedModule } from '../../../demo/shared/shared.module';
import { MatTableModule } from '@angular/material/table';
import { BaseType } from '../../../shared/models/base-type';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { TypeCategory } from '../../../shared/models/type-category.enum';
import { GenericTypeService } from '../../../shared/services/generic-type.service';
import { Router } from '@angular/router';
import { SupplierType } from '../../../shared/models/supplier-type';
import { SupplierTypeService } from '../../../shared/services/supplier.service';
import { SUPPLIERS_DASHBOARD_CONFIG } from './suppliers-dashboard.config';
import { Action, DashboardConfig } from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import { OsmDashboard } from '../../../shared/modules/osm-dashboard/osm-dashboard';
import { MatCardModule } from '@angular/material/card';
import { ToastService } from '../../../shared/services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-suppliers',
  templateUrl: './suppliers.component.html',
  imports: [
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatExpansionModule, // Import the expansion module
    ReactiveFormsModule,
    MatSortModule,
    SharedModule,
      MatPaginatorModule,
    OsmDashboard,
    MatCardModule,
  ],
  standalone: true,
  styleUrls: ['./suppliers.component.scss']
})
export class SupplierComponent implements OnInit, OnDestroy {
  suppliers: SupplierType[] = [];
  message: string = '';
  supplierForm: FormGroup;
  supplierTypes: BaseType[] = [];
  regions: BaseType[] = [];
  editingRecordIndex: number = -1;
  formOpen: boolean = false;
  selectedSupplier: SupplierType | null = null;
  dashboardConfig: DashboardConfig = SUPPLIERS_DASHBOARD_CONFIG;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('input') input: any;
  private subs = new Subscription();

  constructor(
    private supplierService: SupplierTypeService,
    private genericTypeService: GenericTypeService,
    private fb: FormBuilder,
    private router: Router,
    private toastService: ToastService,
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadRecords(TypeCategory.SUPPLIER_TYPE);
    this.loadRecords(TypeCategory.REGION);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  initializeForm(): void {
    this.supplierForm = this.fb.group({
      supplierInfo: this.fb.group({
        id: [''],
        name: ['', Validators.required],
        lastname: ['', Validators.required],
        phone: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        address: ['', Validators.required],
        region: [null, Validators.required],
        rib: [''],
        bankName: ['']
      }),
      genericSupplierType: [null, Validators.required]
    });
  }

  loadSuppliers(): void {
    this.subs.add(
      this.supplierService.getAllSuppliers().subscribe(
        (res) => {
          if (res && res.success) {
            this.suppliers = res.data;
          } else {
            this.suppliers = [];
            this.toastService.error(res.message || 'Erreur lors du chargement des fournisseurs');
          }
        },
        (err) => {
          console.error('Error loading suppliers:', err);
          this.suppliers = [];
          this.toastService.error('Erreur lors du chargement des fournisseurs');
        }
      )
    );
  }

  loadRecords(type: TypeCategory): void {
    this.genericTypeService.getAllTypes(type).subscribe(
      (res: { success: boolean; data: BaseType[]; message: string }) => {
        if (res.success && res.data) {
          if (type === TypeCategory.REGION) {
            this.regions = res.data;
          } else if (type === TypeCategory.SUPPLIER_TYPE) {
            this.supplierTypes = res.data;
          }
        } else {
          if (type === TypeCategory.REGION) {
            this.regions = [];
          } else if (type === TypeCategory.SUPPLIER_TYPE) {
            this.supplierTypes = [];
          }
        }
      },
      (err) => {
        console.error('Error loading records:', err);
        if (type === TypeCategory.REGION) {
          this.regions = [];
        } else if (type === TypeCategory.SUPPLIER_TYPE) {
          this.supplierTypes = [];
        }
      }
    );
  }

  onSubmit(): void {
    if (this.supplierForm.invalid) {
      console.log('Form is invalid. Submission prevented.');
      return;
    }

    const formValue = this.supplierForm.value;
    const payload: any = {
      supplierInfo: {
        id: formValue.supplierInfo.id,
        name: formValue.supplierInfo.name,
        lastname: formValue.supplierInfo.lastname,
        phone: formValue.supplierInfo.phone,
        email: formValue.supplierInfo.email,
        address: formValue.supplierInfo.address,
        region: formValue.supplierInfo.region,
        rib: formValue.supplierInfo.rib,
        bankName: formValue.supplierInfo.bankName
      },
      genericSupplierType: formValue.genericSupplierType
    };
    this.selectedSupplier = {
      ...this.selectedSupplier,
      supplierInfo: formValue.supplierInfo,
      genericSupplierType: formValue.genericSupplierType
    };

    console.log('Form Payload:', this.selectedSupplier);

    if (this.editingRecordIndex >= 0) {
      const supplierToUpdate = this.suppliers[this.editingRecordIndex];
      if (!supplierToUpdate.id) return;
      this.subs.add(
        this.supplierService.updateSupplier(this.selectedSupplier).subscribe(
          (res) => {
            if (res && res.success) {
              this.loadSuppliers();
              this.resetForm();
              this.editingRecordIndex = -1;
              this.message = res.message;
            }
          },
          (err) => {
            console.error('Error updating supplier', err);
          }
        )
      );
    } else {
      this.subs.add(
        this.supplierService.addSupplier(payload).subscribe(
          (res) => {
            if (res && res.success && res.data && res.data.length > 0) {
              this.suppliers = [...this.suppliers, res.data[0]];
              this.resetForm();
              this.message = res.message;
            }
          },
          (err) => {
            console.error('Error adding supplier', err);
          }
        )
      );
    }
    this.formOpen = false;
  }

  viewSupplier(supplier: SupplierType) {
    this.router.navigate(['/reception/fournisseur/details', supplier.id]);
  }

  onSelectRegion(selectedRegionId: string): void {
    this.supplierForm.get('supplierInfo')?.get('region')?.setValue(selectedRegionId);
  }

  onSelectSupType(selectedTypeId: string): void {
    this.supplierForm.get('genericSupplierType')?.setValue(selectedTypeId);
  }

  openDialog(selectedSupplier: SupplierType): void {
    this.selectedSupplier = selectedSupplier;
    console.log('openDialog - this.selectedSupplier:', this.selectedSupplier);

    const index = this.suppliers.findIndex((s) => s.id === selectedSupplier.id);
    if (index >= 0) {
      this.editingRecordIndex = index;
    }

    const supplierInfo = this.selectedSupplier?.supplierInfo;
    const genericSupplierType = this.selectedSupplier?.genericSupplierType;

    this.supplierForm.get('supplierInfo')?.get('id')?.setValue(supplierInfo?.id);
    this.supplierForm.get('supplierInfo')?.get('name')?.setValue(supplierInfo?.name);
    this.supplierForm.get('supplierInfo')?.get('lastname')?.setValue(supplierInfo?.lastname);
    this.supplierForm.get('supplierInfo')?.get('phone')?.setValue(supplierInfo?.phone);
    this.supplierForm.get('supplierInfo')?.get('email')?.setValue(supplierInfo?.email);
    this.supplierForm.get('supplierInfo')?.get('address')?.setValue(supplierInfo?.address);
    this.supplierForm
      .get('supplierInfo')
      ?.get('region')
      ?.setValue(supplierInfo?.region || null);
    this.supplierForm.get('supplierInfo')?.get('rib')?.setValue(supplierInfo?.rib);
    this.supplierForm.get('supplierInfo')?.get('bankName')?.setValue(supplierInfo?.bankName);
    this.supplierForm.get('genericSupplierType')?.setValue(genericSupplierType || null);
    console.log('Form value after setting individual controls:', this.supplierForm.value);
    console.log('Form validity after setting individual controls:', this.supplierForm.valid);
    this.formOpen = true;
  }

  deleteRecord(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) {
      this.subs.add(
        this.supplierService.deleteSupplier(id).subscribe({
          next: (res) => {
            if (res.success) {
              this.suppliers = this.suppliers.filter(s => s.id !== id);
              this.toastService.success('Fournisseur supprimé avec succès');
            } else {
              this.toastService.error(res.message || 'Erreur lors de la suppression');
            }
          },
          error: () => {
            this.toastService.error('Erreur lors de la suppression');
          }
        })
      );
    }
  }

  cancelEdit(): void {
    this.resetForm();
    this.editingRecordIndex = -1;
    this.formOpen = false;
  }

  resetForm(): void {
    this.supplierForm.reset();
    this.editingRecordIndex = -1;
    this.selectedSupplier = null;
    this.formOpen = false;
  }

  public objectComparisonFunction = function (option: any, value: any): boolean {
    return option.id === value.id;
  };

  handleAction(event: { row: SupplierType; action: string }): void {
    const { row, action } = event;
    switch (action) {
      case 'READ':
        const name =
          (row.supplierInfo.name + row.supplierInfo.lastname)

        this.router.navigate(['/reception/fournisseur/details', row.id!]);
        break;
      case 'UPDATE':
        if (row.id) {
          this.router.navigate(['/reception/fournisseur/edit', row.id]);
        }
        break;
      case 'DELETE':
        if (row.id) {
          this.deleteRecord(row.id);
        }
        break;
      default:
        console.warn('Unknown action:', action);
    }
  }

  toast(message: string): void {
    this.toastService.info(message);
  }
}
