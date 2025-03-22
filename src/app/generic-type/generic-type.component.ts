import { Component, OnInit } from '@angular/core';
import { BaseType } from '../models/generic/base-type';
import { GenericTypeService } from '../services/generic-type.service';

@Component({
  selector: 'app-generic-type',
  templateUrl: './generic-type.component.html',
  styleUrls: ['./generic-type.component.scss']
})
export class GenericTypeComponent implements OnInit {
  // Define type categories as expected by your backend (lower-case)
  typeOptions = [
    { name: 'Waste Type', value: 'wasteType' },
    { name: 'Region', value: 'region' },
    { name: 'Supplier Type', value: 'supplierType' },
    { name: 'Olive Variety Type', value: 'oliveVariety' }
  ];

  selectedType: string = this.typeOptions[0].value.toLowerCase(); // Default to the first option's value

   records: BaseType[] = [];
  selectedRecord: BaseType = {
    id: undefined,
    name: '',
    description: '',
    type: this.selectedType, // Initialize with the default type
    createdAt: undefined,
    updatedAt: undefined
  };
  isEditing: boolean = false;
  message: string = '';

  constructor(private genericTypeService: GenericTypeService) {}

  ngOnInit(): void {
    this.loadRecords();
  }

  // Loads records based on the selected type
  loadRecords(): void {
    this.genericTypeService.getAllTypes(this.selectedType).subscribe(
      (res: { success: boolean; data: BaseType[]; message: string }) => {
        if (res && res.success) {
          // Unwrap nested array if necessary
          this.records = Array.isArray(res.data) && Array.isArray(res.data[0]) ? res.data[0] : res.data;
          this.message = res.message || 'Records loaded successfully.';
        } else {
          this.records = [];
          this.message = res.message || 'Failed to load records.';
        }
      },
      (err: any) => {
        console.error('Error loading records', err);
        this.message = 'An error occurred while loading records.';
      }
    );
  }

  // Change type category and reload records
  changeType(): void {
    // Update the selectedRecord's type to match the selected type
    this.selectedRecord.type = this.selectedType;

    // Reset the form and reload records for the new type
    this.resetForm();
    this.isEditing = false;
    this.loadRecords();
  }

  // Create a new record, including the type property in the payload
  addRecord(): void {
    // Ensure the type property is set in the payload
    const payload = { ...this.selectedRecord, type: this.selectedType };

    this.genericTypeService.createType(payload).subscribe(
      (res: { success: boolean; data: BaseType; message: string }) => {
        if (res && res.success) {
          this.records.push(res.data);
          this.resetForm();
          this.message = res.message || 'Record added successfully.';
        } else {
          this.message = res.message || 'Failed to add record.';
        }
      },
      (err: any) => {
        console.error('Error adding record', err);
        this.message = 'An error occurred while adding the record.';
      }
    );
  }

  // Prepare record for editing
  editRecord(record: BaseType): void {
    this.selectedRecord = { ...record }; // Copy the record to avoid direct mutation
    this.isEditing = true;
  }

  // Update the selected record, including the type property in the payload
  updateRecord(): void {
    if (!this.selectedRecord.id) {
      console.error('Cannot update record: ID is missing.');
      this.message = 'Failed to update record: ID is missing.';
      return;
    }

    // Ensure the type property is set in the payload
    const payload = { ...this.selectedRecord, type: this.selectedType };

    // Call the service to update the record
    this.genericTypeService.updateType( payload).subscribe(
      (res: { success: boolean; message: string }) => {
        if (res && res.success) {
          this.loadRecords(); // Reload records after successful update
          this.resetForm();
          this.isEditing = false;
          this.message = res.message || 'Record updated successfully.';
        } else {
          this.message = res.message || 'Failed to update record.';
        }
      },
      (err: any) => {
        console.error('Error updating record', err);
        this.message = 'An error occurred while updating the record.';
      }
    );
  }
  // Delete a record (no payload type needed here, since it's passed via URL)
  deleteRecord(record: BaseType): void {
    if (!record.id) return;

    this.genericTypeService.deleteType(this.selectedType, record.id).subscribe(
      (res: { success: boolean; message: string }) => {
        if (res && res.success) {
          this.records = this.records.filter((r) => r.id !== record.id);
          this.message = res.message || 'Record deleted successfully.';
        } else {
          this.message = res.message || 'Failed to delete record.';
        }
      },
      (err: any) => {
        console.error('Error deleting record', err);
        this.message = 'An error occurred while deleting the record.';
      }
    );
  }

  // Cancel editing mode
  cancelEdit(): void {
    this.resetForm();
    this.isEditing = false;
  }

  // Helper method to reset the form
  private resetForm(): void {
    this.selectedRecord = {
      id: undefined,
      name: '',
      description: '',
      type: this.selectedType, // Reset type to the currently selected type
      createdAt: undefined,
      updatedAt: undefined
    };
  }
}
