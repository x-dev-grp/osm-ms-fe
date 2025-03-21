import { Component, OnInit } from '@angular/core';
  import { DatePipe } from '@angular/common';
 import {BaseType} from "../models/base-type";
import {GenericTypeService} from "../services/generic-type.service";

@Component({
  selector: 'app-generic-type',
  templateUrl: './generic-type.component.html',
   styleUrls: ['./generic-type.component.scss']
})
export class GenericTypeComponent implements OnInit {
  // Define type categories as expected by your backend (lower-case)
  typeOptions: string[] = ['wastetype', 'region', 'suppliertype', 'variety', 'olivelotstatustype', 'olivevarietytype'];
  selectedType: string = 'wastetype';
  records: BaseType[] = [];
  // Initialize with empty properties; note that an id property may be added later
  selectedRecord: BaseType = { name: '', description: '', type: '' };
  isEditing: boolean = false;
  message: string = '';

  constructor(private genericTypeService: GenericTypeService) {}

  ngOnInit(): void {
    this.loadRecords();
  }

  // Loads records based on the selected type
  loadRecords(): void {
    this.genericTypeService.getAllTypes(this.selectedType).subscribe(
      (res: { success: any; data: BaseType[]; message: string; }) => {
        if (res && res.success) {
          // Unwrap nested array if necessary
          this.records = Array.isArray(res.data) && Array.isArray(res.data[0]) ? res.data[0] : res.data;
          this.message = res.message;
        } else {
          this.records = [];
          this.message = res.message;
        }
      },
      (err: any) => {
        console.error('Error loading records', err);
      }
    );
  }

  // Change type category and reload records
  changeType(): void {
    this.loadRecords();
  }

  // Create a new record, including the type property in the payload
  addRecord(): void {
    const payload = { ...this.selectedRecord, type: this.selectedType };
    this.genericTypeService.createType(this.selectedType, payload).subscribe(
      (res) => {
        if (res && res.success) {
          this.records.push(res.data);
          this.selectedRecord = { name: '', description: '', type: '' };
          this.message = res.message;
        }
      },
      (err) => {
        console.error('Error adding record', err);
      }
    );
  }

  // Prepare record for editing
  editRecord(record: BaseType): void {
    this.selectedRecord = { ...record };
    this.isEditing = true;
  }

  // Update the selected record, including the type property in the payload
  updateRecord(): void {
    if (!this.selectedRecord.id) return;
    const payload = { ...this.selectedRecord, type: this.selectedType };
    this.genericTypeService.updateType(this.selectedType, this.selectedRecord.id, payload).subscribe(
      (res) => {
        if (res && res.success) {
          this.loadRecords();
          this.selectedRecord = { name: '', description: '', type: '' };
          this.isEditing = false;
          this.message = res.message;
        }
      },
      (err) => {
        console.error('Error updating record', err);
      }
    );
  }

  // Delete a record (no payload type needed here, since it's passed via URL)
  deleteRecord(record: BaseType): void {
    if (!record.id) return;
    this.genericTypeService.deleteType(this.selectedType, record.id).subscribe(
      (res) => {
        if (res && res.success) {
          this.records = this.records.filter((r) => r.id !== record.id);
          this.message = res.message;
        }
      },
      (err) => {
        console.error('Error deleting record', err);
      }
    );
  }

  // Cancel editing mode
  cancelEdit(): void {
    this.selectedRecord = { name: '', description: '', type: '' };
    this.isEditing = false;
  }
}
