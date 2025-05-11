// File: suppliers.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatAccordion, MatExpansionModule, MatExpansionPanel, MatExpansionPanelTitle } from '@angular/material/expansion';
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
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelTitle,
    MatPaginatorModule,
    OsmDashboard
  ],
  standalone: true,
  styleUrls: ['./suppliers.component.scss']
})
export class SupplierComponent implements OnInit {
  suppliers: SupplierType[] = [];
  message: string = '';
  supplierForm: FormGroup;
  supplierTypes: BaseType[] = [];
  regions: BaseType[] = [];
  editingRecordIndex: number = -1;
  formOpen: boolean = false;
  selectedSupplier: SupplierType;
  dashboardConfig: DashboardConfig = SUPPLIERS_DASHBOARD_CONFIG;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('input') input: any;

  constructor(
    private supplierService: SupplierTypeService,
    private genericTypeService: GenericTypeService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadSuppliers();
    this.loadRecords(TypeCategory.SUPPLIER_TYPE);
    this.loadRecords(TypeCategory.REGION);
  }

  // Initialize the reactive form.
  initializeForm(): void {
    this.supplierForm = this.fb.group({
      supplierInfo: this.fb.group({
        id: [''],
        name: ['', Validators.required],
        lastname: ['', Validators.required],
        phone: [''],
        email: ['', [Validators.required, Validators.email]],
        address: ['', Validators.required],
        region: [null, Validators.required], // Expecting the ID directly
        rib: [''],
        bankName: ['']
      }),
      genericSupplierType: [null, Validators.required] // Expecting the ID directly
    });

    // Log form changes for debugging
    this.supplierForm.valueChanges.subscribe((value) => {
      console.log('Form Value Changed:', value);
      console.log('Form Valid:', this.supplierForm.valid);
    });
  }

  // Loads BaseType records (for supplier types or regions).
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

  // Loads suppliers from the back end and assigns them to the table data source.
  loadSuppliers(): void {
    this.supplierService.getAllSuppliers().subscribe(
      (res) => {
        if (res && res.success) {
          this.suppliers = res.data;

          console.log('Loaded Suppliers:', this.suppliers);
          console.log('liste des suppliers ', res);
          this.message = res.message;
        } else {
          this.suppliers = [];
          this.message = res.message;
        }
      },
      (err) => {
        console.error('Error loading suppliers', err);
      }
    );
  }

  // Called when the form is submitted. Builds a payload matching the working JSON.
  onSubmit(): void {
    if (this.supplierForm.invalid) {
      console.log('Form is invalid. Submission prevented.');
      return;
    }

    const formValue = this.supplierForm.value;
    //Build the payload with the keys 'supplier' and 'genericSupplierType'.
    const payload: any = {
      supplierInfo: {
        id: formValue.supplierInfo.id,
        name: formValue.supplierInfo.name,
        lastname: formValue.supplierInfo.lastname,
        phone: formValue.supplierInfo.phone,
        email: formValue.supplierInfo.email,
        address: formValue.supplierInfo.address,
        region: formValue.supplierInfo.region, // Object with id as required
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

    // If editing, update; else add.
    if (this.editingRecordIndex >= 0) {
      const supplierToUpdate = this.suppliers[this.editingRecordIndex];
      if (!supplierToUpdate.id) return;
      this.supplierService.updateSupplier(this.selectedSupplier).subscribe(
        // Include the ID for update
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
      );
    } else {
      this.supplierService.addSupplier(payload).subscribe(
        (res) => {
          if (res && res.success && res.data && res.data.length > 0) {
            this.suppliers = [...this.suppliers, res.data[0]]; // Update the local array
            this.resetForm();
            this.message = res.message;
          }
        },
        (err) => {
          console.error('Error adding supplier', err);
        }
      );
    }
    // Collapse the form panel.
    this.formOpen = false;
  }

  viewSupplier(supplier: SupplierType) {
    this.router.navigate(['reception/supplier-details', supplier.id]);
  }

  onSelectRegion(selectedRegionId: string): void {
    this.supplierForm.get('supplierInfo')?.get('region')?.setValue(selectedRegionId);
  }

  onSelectSupType(selectedTypeId: string): void {
    this.supplierForm.get('genericSupplierType')?.setValue(selectedTypeId);
  }

  // Opens the form for editing a supplier.
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

  // Deletes a supplier record.
  deleteRecord(supplier: SupplierType): void {
    if (confirm('Are you sure you want to delete this supplier?')) {
      this.supplierService.deleteSupplier(supplier.id!).subscribe(
        (res) => {
          if (res && res.success) {
            this.suppliers = this.suppliers.filter((s) => s.id !== supplier.id);
            this.message = res.message;
          }
        },
        (err) => {
          console.error('Error deleting supplier', err);
        }
      );
    }
  }

  // Cancels editing mode.
  cancelEdit(): void {
    this.resetForm();
    this.editingRecordIndex = -1;
    this.formOpen = false; // Ensure the form collapses on cancel
  }

  // Resets the form and collapses the panel.
  resetForm(): void {
    this.supplierForm.reset();
    this.editingRecordIndex = -1;
    this.formOpen = false;
  }

  public objectComparisonFunction = function (option: any, value: any): boolean {
    return option.id === value.id;
  };

  handleAction(event: { action: Action; row: SupplierType }): void {
    switch (event.action.label?.toUpperCase()) {
      case 'CONSULTER':
      case 'VIEW':
        this.viewSupplier(event.row);
        break;

      case 'MODIFIER':
      case 'EDIT':
        this.openDialog(event.row);
        break;

      case 'SUPPRIMER':
      case 'DELETE':
        this.deleteRecord(event.row);
        break;
    }
  }
}
