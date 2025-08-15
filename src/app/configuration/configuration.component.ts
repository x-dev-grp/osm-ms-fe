import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatOption } from '@angular/material/core';
import { CardComponent } from '../theme/components/card/card.component';
import { MatTab, MatTabGroup, MatTabLabel, MatTabLink, MatTabNav, MatTabNavPanel } from '@angular/material/tabs';
import { MatIcon } from '@angular/material/icon';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatFormField, MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatInput } from '@angular/material/input';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
  MatTableDataSource
} from '@angular/material/table';
import { MatSelect } from '@angular/material/select';
import { MatTooltip } from '@angular/material/tooltip';
import { NgForOf, NgIf } from '@angular/common';
import { TypeCategory } from '../shared/models/type-category.enum';
import { BaseType } from '../shared/models/base-type';
import { GenericTypeService } from '../shared/services/generic-type.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [
    CardComponent,
    MatTab,
    MatTabGroup,
    MatIcon,
    MatButtonToggleGroup,
    MatButtonToggle,
    MatTabNav,
    MatTabLink,
    MatTabNavPanel,
    MatFormField,
    MatCheckbox,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButton,
    MatTabLabel,
    MatInput,
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatIconButton,
    MatOption,
    MatRow,
    MatRowDef,
    MatSelect,
    MatTable,
    MatTooltip,
    NgForOf,
    NgIf,
    TranslatePipe
  ],
  templateUrl: './configuration.component.html',
  styleUrl: './configuration.component.scss'
})
export class ConfigurationComponent implements OnInit {
  siteForm: FormGroup;
  logoPreview: string | ArrayBuffer | null = null;

  //config grneric

  recordForm: FormGroup;
  typeOptions = [
    { name: 'Waste Type', value: TypeCategory.WASTE_TYPE },
    { name: 'Region', value: TypeCategory.REGION },
     { name: 'Olive Variety', value: TypeCategory.OLIVE_VARIETY },
    { name: 'Production Method', value: TypeCategory.PRODUCTION_METHOD }, // e.g. Organic, Conventional
    { name: 'Oil Variety', value: TypeCategory.OIL_VARIETY }
  ];

  records: BaseType[] = [];
  displayedColumns: string[] = ['name', 'type', 'description', 'actions'];
  FilterSource: MatTableDataSource<BaseType> = new MatTableDataSource<BaseType>(this.records);
  selectedType: TypeCategory = this.typeOptions[0].value;
  editingRecordIndex: number = -1; // Keeps track of the record being edited

  constructor(
    private fb: FormBuilder,
    private genericTypeService: GenericTypeService
  ) {
    this.recordForm = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });

    this.siteForm = this.fb.group({
      societe: ['', Validators.required],
      numPatente: ['', Validators.required],
      bank: ['', Validators.required],
      rib: ['', Validators.required],
      adresse: [''],
      siteWeb: [''],
      tel1: ['', Validators.required],
      tel2: [''],
      logo: [null]
    });
  }

  ngOnInit(): void {
    // Load initial records based on the default selected type
    this.loadRecords(this.selectedType);
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.siteForm.patchValue({ logo: file });

      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  protected readonly onsubmit = onsubmit;

  ajouter() {}

  onTypeChange(selectedType: TypeCategory): void {
    this.selectedType = selectedType;
    this.loadRecords(selectedType);
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
      type: this.selectedType // Use the selected type
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
