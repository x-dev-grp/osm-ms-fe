import { Component } from '@angular/core';
import {CommonModule} from "@angular/common";
import {SharedModule} from "../../../demo/shared/shared.module";
import {MatExpansionModule, MatExpansionPanel, MatExpansionPanelTitle} from "@angular/material/expansion";
import {Supplier} from "../../../osm/models/supplier";
import {MatTableDataSource} from "@angular/material/table";
import {BaseType} from "../../../osm/models/base-type";
import {SupplierService} from "../../../osm/services/supplier.service";
import {GenericTypeService} from "../../../osm/services/generic-type.service";
import {TypeCategory} from "../../../osm/models/type-category.enum";


@Component({
  selector: 'app-fournisseurs',
  imports: [CommonModule, SharedModule, MatExpansionPanelTitle, MatExpansionPanel,MatExpansionModule,],
  standalone: true,
  templateUrl: './fournisseurs.component.html',
  styleUrl: './fournisseurs.component.scss'
})
export class FournisseursComponent {
  suppliers: Supplier[] = [];
  isEditing: boolean = false;
  message: string = '';
  displayedColumns: string[] = ['name', 'lastname', 'phone', 'email', 'address',  'supplierType', 'actions'];
  selectedSupplier: Supplier = {} as Supplier;
  formOpen = false;
  FilterSource: MatTableDataSource<Supplier> = new MatTableDataSource(this.suppliers);
  supplierTypes: BaseType[] = [];

  constructor(
    private supplierService: SupplierService,
    private genericTypeService: GenericTypeService
  ) {}

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadRecords(TypeCategory.SUPPLIER_TYPE);
  }
  loadRecords(type: TypeCategory): void {
    this.genericTypeService.getAllTypes(type).subscribe(
      (res: { success: boolean; data: BaseType[]; message: string }) => {
        if (res.success && res.data) {
          this.supplierTypes = res.data;
        } else {
          this.supplierTypes = [];
          this.FilterSource.data = [];
        }
      },
      (err) => {
        console.error('Error loading records:', err);
        this.supplierTypes = [];
        this.FilterSource.data = [];
      }
    );
  }
  deleteSupplier(supplier: Supplier): void {
    // Simple in-memory delete
    this.suppliers = this.suppliers.filter(s => s.id !== supplier.id);
    this.message = 'Supplier deleted successfully!';
  }
  // Loads all suppliers from the back-end
  loadSuppliers(): void {
    this.supplierService.getAllSuppliers().subscribe(
      (res) => {
        if (res && res.success) {
          this.suppliers =  res.data;
          this.FilterSource.data = this.suppliers;
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
  onSubmit(): void {
    if (this.isEditing) {
      if (!this.selectedSupplier.id) return;
      this.supplierService.updateSupplier(this.selectedSupplier.id, this.selectedSupplier).subscribe(
        (res) => {
          if (res && res.success) {
            this.loadSuppliers();
            this.resetSelectedSupplier();
            this.isEditing = false;
            this.message = res.message;
          }
        },
        (err) => {
          console.error('Error updating supplier', err);
        }
      );} else {
      if (!this.selectedSupplier.suppliertype) {
        this.selectedSupplier.suppliertype = {
          type: TypeCategory.SUPPLIER_TYPE, // Default to SUPPLIERTYPE
          name: 'Default Supplier Type',
          description: 'Default supplier type description'
        };
      }

      this.supplierService.addSupplier(this.selectedSupplier).subscribe(
        (res) => {
          if (res && res.success) {
            this.suppliers.push(res.data[0]);
            this.loadSuppliers();
            this.resetSelectedSupplier();
            this.message = res.message;
          }
        },
        (err) => {
          console.error('Error adding supplier', err);
        }
      );   }
    this.formOpen = false; // Collapse the panel
  }

  // Prepares a supplier for editing
  editSupplier(supplier: Supplier): void {
    this.selectedSupplier = { ...supplier };
    this.isEditing = true;
    this.formOpen=true
  }
  // Resets the selected supplier to default values
  private resetSelectedSupplier(): void {
    this.selectedSupplier = {
      name: '',
      lastname: '',
      phone: '',
      email: '',
      address: '',
      suppliertype: {
        type: TypeCategory.SUPPLIER_TYPE, // Default to SUPPLIERTYPE
        name: '',
        description: ''
      }
    };
  }
}
