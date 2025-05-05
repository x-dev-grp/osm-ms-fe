import { Component, OnInit } from '@angular/core';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {  MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { SharedModule } from '../../demo/shared/shared.module';
import {
  MatAccordion,
  MatExpansionModule,
  MatExpansionPanel,
  MatExpansionPanelTitle
} from '@angular/material/expansion';
import { TypeCategory } from '../../shared/models/type-category.enum';
import { BaseType } from '../../shared/models/base-type';
import { GenericTypeService } from '../../shared/services/generic-type.service';
 interface TypeOption {
  name: string;
  value: TypeCategory;
}
@Component({
  selector: 'app-generic-type',
  templateUrl: './generic-type.component.html',
  styleUrls: ['./generic-type.component.scss'],
  standalone: true,
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
    MatExpansionPanelTitle
  ]
})
export class GenericTypeComponent implements OnInit {
  recordForm: FormGroup;

  showDetails: boolean = false;


   typeOptions: TypeOption[] = [];

  // A mapping of TypeCategory to its loaded records.
  recordsByCategory: Record<TypeCategory, BaseType[]> = {} as Record<TypeCategory, BaseType[]>;

  // Currently selected records to display in the table.
  records: BaseType[] = [];
  displayedColumns: string[] = ['name', 'type', 'description', 'actions'];
  FilterSource: MatTableDataSource<BaseType> = new MatTableDataSource<BaseType>(this.records);

  // The currently selected type.
  selectedType!: TypeCategory;

  // This index is used when editing a record.
  editingRecordIndex: number = -1;

  constructor(private fb: FormBuilder, private genericTypeService: GenericTypeService) {
    this.recordForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
    });
  }

  ngOnInit(): void {
    // Dynamically build options based on the TypeCategory enum.
    // Object.keys returns an array of the enum keys.
    this.typeOptions = Object.keys(TypeCategory).map(key => {
      // Convert underscore names into a more readable format.
      const formattedName = key.replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase());
      return { name: formattedName, value: TypeCategory[key as keyof typeof TypeCategory] };
    });

    // Dynamically initialize the recordsByCategory object:
    Object.values(TypeCategory).forEach((cat: TypeCategory) => {
      this.recordsByCategory[cat] = [];
    });

    // Set the default selected type to the first option.
    this.selectedType = this.typeOptions[0].value;

    // Load records for the default selected type.
    this.loadRecords(this.selectedType);
  }


  /**
   * Handles the change of type selection from the dropdown.
   * Fetches and updates the records based on the selected type.
   *
   * @param selectedType - The type selected by the user.
   */
  onTypeChange(selectedType: TypeCategory): void {
    this.selectedType = selectedType;
    this.loadRecords(selectedType);
  }
  toggleDetails(): void {
    this.showDetails = !this.showDetails;
    // Optionally, reset the form or set initial values when showing details
  }
  /**
   * Fetches and loads records for the selected type.
   *
   * @param type - The selected type from the dropdown.
   */
  loadRecords(type: TypeCategory): void {
    this.genericTypeService.getAllTypes(type).subscribe(
      (res: { success: boolean; data: BaseType[]; message: string }) => {
        if (res.success && res.data) {
          this.records = res.data;
          this.FilterSource.data = this.records;
        } else {
          this.records = [];
          this.FilterSource.data = [];
        }
      },
      (err) => {
        console.error('Error loading records:', err);
        this.records = [];
        this.FilterSource.data = [];
      }
    );
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.FilterSource.filter = filterValue.trim().toLowerCase();
  }
  /**
   * Handles form submission to create or update records.
   */
  onSubmit(): void {
    if (this.recordForm.invalid) {
      this.recordForm.markAllAsTouched();
      return;
    }

    const recordData: BaseType = {
      ...this.recordForm.value,
      type: this.selectedType, // Use the selected type
    };

    if (this.editingRecordIndex >= 0) {
      // Update existing record
      recordData.id = this.records[this.editingRecordIndex].id;
      this.genericTypeService.updateType(recordData).subscribe(
        (res) => {
          if (res.success) {
            this.records[this.editingRecordIndex] = recordData;
            this.FilterSource.data = [...this.records];
            this.resetForm();
          }
        },
        (err) => {
          console.error('Error updating record:', err);
        }
      );
    } else {
      // Create new record
      this.genericTypeService.createType(recordData).subscribe(
        (res) => {
          if (res.success && res.data) {
            this.records.push(res.data[0]);
            this.FilterSource.data = [...this.records];
            this.resetForm();
          }
        },
        (err) => {
          console.error('Error creating record:', err);
        }
      );
    }
  }

  /**
   * Opens the form for editing a record.
   *
   * @param record - The record to be edited.
   */
  openDialog(record: BaseType): void {
    const index = this.records.findIndex((r) => r.id === record.id);
    if (index !== -1) {
      this.editingRecordIndex = index;
      this.recordForm.patchValue(record);
    this.showDetails=true;
    }
  }

  /**
   * Deletes a record and refreshes the table.
   *
   * @param record - The record to be deleted.
   */
  deleteRecord(record: BaseType): void {
    if (!record.id) return;

    this.genericTypeService.deleteType(this.selectedType, record.id).subscribe(
      (res) => {
        if (res.success) {
          this.records = this.records.filter((r) => r.id !== record.id);
          this.FilterSource.data = this.records;
        }
      },
      (err) => {
        console.error('Error deleting record:', err);
      }
    );
  }

  /**
   * Cancels editing and resets the form.
   */
  cancelEdit(): void {
    this.resetForm();
  }

  /**
   * Resets the form after submission or cancellation.
   */
  private resetForm(): void {
    this.recordForm.reset();
    this.recordForm.markAsPristine();
    this.recordForm.markAsUntouched();
    this.editingRecordIndex = -1;
  }
}
