// File: suppliers.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatAccordion, MatExpansionModule, MatExpansionPanel, MatExpansionPanelTitle } from '@angular/material/expansion';
import { SharedModule } from '../../../demo/shared/shared.module';
 import { MatTableDataSource, MatTableModule } from '@angular/material/table';
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
import {Router} from "@angular/router";
import { SupplierType } from '../../../shared/models/supplier-type';
import { SupplierTypeService } from '../../services/supplier-type.service';

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
    MatPaginatorModule
  ],
  standalone: true,
  styleUrls: ['./suppliers.component.scss']
})
export class SupplierComponent implements OnInit {
  suppliers: SupplierType[] = [];
  message: string = '';
  displayedColumns: string[] = ['fullName', 'phone', 'email', 'address', 'supplierType', 'region', 'actions'];
  supplierForm: FormGroup;
  FilterSource: MatTableDataSource<SupplierType> = new MatTableDataSource(this.suppliers);
  supplierTypes: BaseType[] = [];
  regions: BaseType[] = [];
  editingRecordIndex: number = -1;
  formOpen: boolean = false;
  selectedSupplier: SupplierType;
  // Filtres
  filterFullName: string = '';
  filterPhone: string = '';
  filterSupplierType: string = '';

  // Pagination et Tri

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('input') input: any;

  constructor(
    private supplierService: SupplierTypeService    ,
    private genericTypeService: GenericTypeService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadSuppliers();
    this.loadRecords(TypeCategory.SUPPLIER_TYPE);
    this.loadRecords(TypeCategory.REGION);
    this.FilterSource.sort = this.sort;
    this.FilterSource.paginator = this.paginator;

    // Log the initial form value and validity for debugging
    console.log('Initial Form Value:', this.supplierForm.value);
    console.log('Initial Form Valid:', this.supplierForm.valid);
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
          this.FilterSource.data = this.suppliers;
          this.FilterSource.sort = this.sort;
          this.FilterSource.paginator = this.paginator;
          console.log('Loaded Suppliers:', this.suppliers);
          console.log("liste des suppliers ",res)
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
            this.FilterSource.data = this.suppliers; // Update the data source
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

  // Filters the table by the given input.
  // applyFilter(event: Event): void {
  //   const filterValue = (event.target as HTMLInputElement).value;
  //   this.FilterSource.filter = filterValue.trim().toLowerCase();
  //
  //   if (this.FilterSource.paginator) {
  //     this.FilterSource.paginator.firstPage();
  //   }
  // }

// Appliquer les filtres
  applyFilters(): void {
    let filtered = this.suppliers;

    // Filtre par Nom Complet
    if (this.filterFullName) {
      const fullName = this.filterFullName.toLowerCase();
      filtered = filtered.filter(supplier =>
        `${supplier.supplierInfo?.name} ${supplier.supplierInfo?.lastname}`.toLowerCase().includes(fullName)
      );
    }

    // Filtre par Téléphone
    if (this.filterPhone) {
      filtered = filtered.filter(supplier =>
        supplier.supplierInfo?.phone.includes(this.filterPhone)
      );
    }

    // Filtre par Type de Fournisseur
    if (this.filterSupplierType) {
      filtered = filtered.filter(supplier =>
        supplier.genericSupplierType?.name === this.filterSupplierType
      );
    }

    // Mettre à jour les données filtrées
    this.FilterSource.data = filtered;
  }
  getUniqueSupplierTypes(): string[] {
    const types = this.suppliers.map(supplier => supplier.genericSupplierType?.name);
    return [...new Set(types)].filter(type => type); // Supprimer les doublons et valeurs nulles
  }

  // Réinitialiser les filtres
  resetFilters(): void {
    this.filterFullName = '';
    this.filterPhone = '';
    this.filterSupplierType = '';
    this.FilterSource.data = this.suppliers; // Réinitialiser les données
  }
  editSupplier(supplier: SupplierType): void {
    console.log('Éditer fournisseur :', supplier);
    // Logique pour ouvrir une boîte de dialogue d'édition
  }

// Méthode pour supprimer un fournisseur
  deleteSupplier(supplier: SupplierType): void {
    console.log('Supprimer fournisseur :', supplier);
    // Logique pour confirmer la suppression
  }

  viewSupplier(supplier:SupplierType){
    // Rediriger vers la route avec l'ID  du supplier
    this.router.navigate(['reception/supplier-details', supplier.id]);

  }

  onSelectRegion(selectedRegionId: string): void {
    // Type should match the value emitted by mat-select
    // Update the supplierInfo.region in the form
    this.supplierForm.get('supplierInfo')?.get('region')?.setValue(selectedRegionId);
  }

  onSelectSupType(selectedTypeId: string): void {
    // Type should match the value emitted by mat-select
    // Update the genericSupplierType in the form
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
            this.FilterSource.data = this.suppliers;
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
}
