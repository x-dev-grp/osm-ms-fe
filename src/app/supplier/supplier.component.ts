import { Component, OnInit } from '@angular/core';
import { SupplierService } from '../services/supplier.service';
import { Supplier } from '../models/supplier';

@Component({
  selector: 'app-supplier',
  templateUrl: './supplier.component.html',
  styleUrls: ['./supplier.component.scss']
})
export class SupplierComponent implements OnInit {
  suppliers: Supplier[] = [];
  // Initialize with empty fields for a new supplier
  selectedSupplier: Supplier = { name: '', lastname: '', phone: '', email: '', address: '' };
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
          // Unwrap nested array if necessary
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
    this.supplierService.addSupplier(this.selectedSupplier).subscribe(
      res => {
        if (res && res.success) {
          this.suppliers.push(res.data);
          this.selectedSupplier = { name: '', lastname: '', phone: '', email: '', address: '' };
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
          this.selectedSupplier = { name: '', lastname: '', phone: '', email: '', address: '' };
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
    this.selectedSupplier = { name: '', lastname: '', phone: '', email: '', address: '' };
    this.isEditing = false;
  }

  // If delete functionality is implemented in the back-end, add a method like this:
  // deleteSupplier(id: number): void {
  //   this.supplierService.deleteSupplier(id).subscribe(
  //     res => {
  //       if (res && res.success) {
  //         this.suppliers = this.suppliers.filter(s => s.id !== id);
  //         this.message = res.message;
  //       }
  //     },
  //
}
