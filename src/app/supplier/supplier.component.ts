// File: supplier.component.ts

import { Component, OnInit } from '@angular/core';
import { SupplierService } from '../services/supplier.service';
import { Supplier } from '../models/supplier';
import { TypeCategory } from '../models/type-category.enum';

@Component({
  selector: 'app-supplier',
  templateUrl: './supplier.component.html',
  styleUrls: ['./supplier.component.scss']
})
export class SupplierComponent implements OnInit {
  suppliers: Supplier[] = [];
  selectedSupplier!: Supplier;
  isEditing: boolean = false;
  message: string = '';

  constructor(private supplierService: SupplierService) {}

  ngOnInit(): void {
    this.loadSuppliers();
  }

  // Loads all suppliers from the back-end
  loadSuppliers(): void {
    this.supplierService.getAllSuppliers().subscribe(
      res => {
        if (res && res.success) {
          this.suppliers = Array.isArray(res.data) && Array.isArray(res.data[0])
            ? res.data[0]
            : res.data;
          this.message = res.message;
        } else {
          this.suppliers = [];
          this.message = res.message;
        }
      },
      err => {
        console.error('Error loading suppliers', err);
      }
    );
  }

  // Adds a new supplier
  addSupplier(): void {
    // Initialize suppliertype with a default BaseType
    if (!this.selectedSupplier.suppliertype) {
      this.selectedSupplier.suppliertype = {
        type: TypeCategory.SUPPLIERTYPE, // Default to SUPPLIERTYPE
        name: 'Default Supplier Type',
        description: 'Default supplier type description'
      };
    }

    this.supplierService.addSupplier(this.selectedSupplier).subscribe(
      res => {
        if (res && res.success) {
          this.suppliers.push(res.data[0]);
          this.resetSelectedSupplier();
          this.message = res.message;
        }
      },
      err => {
        console.error('Error adding supplier', err);
      }
    );
  }

  // Prepares a supplier for editing
  editSupplier(supplier: Supplier): void {
    this.selectedSupplier = { ...supplier };
    this.isEditing = true;
  }

  // Updates an existing supplier
  updateSupplier(): void {
    if (!this.selectedSupplier.id) return;
    this.supplierService.updateSupplier(this.selectedSupplier.id, this.selectedSupplier).subscribe(
      res => {
        if (res && res.success) {
          this.loadSuppliers();
          this.resetSelectedSupplier();
          this.isEditing = false;
          this.message = res.message;
        }
      },
      err => {
        console.error('Error updating supplier', err);
      }
    );
  }

  // Cancels editing mode
  cancelEdit(): void {
    this.resetSelectedSupplier();
    this.isEditing = false;
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
        type: TypeCategory.SUPPLIERTYPE, // Default to SUPPLIERTYPE
        name: '',
        description: ''
      }
    };
  }
}
