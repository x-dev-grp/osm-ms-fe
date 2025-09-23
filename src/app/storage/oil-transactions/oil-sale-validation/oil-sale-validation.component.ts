// osm-ms-fe/src/app/finance/oil-sales/oil-sale-validation-dialog/oil-sale-validation-dialog.component.ts
import { Component, HostListener, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { StorageUnitDto } from '../../../shared/models/StorageUnitDto';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslateModule } from '@ngx-translate/core';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { transactionsHistoryList } from '../../../fake-data/transactions_history_list';

@Component({
  selector: 'app-oil-sale-validation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatInputModule,
     TranslateModule,
    MatProgressSpinnerModule,
    MatIcon
  ],
  templateUrl: './oil-sale-validation.component.html',
  styleUrl: './oil-sale-validation.component.scss'
})
export class OilSaleValidationDialogComponent implements OnInit {
  form = this.fb.group({
    storageUnitSourceId: new FormControl<StorageUnitDto | null>(null, [Validators.required]),
   });

  isLoading = false;

  // Quality grade options
  qualityGrades = [
    { value: 'vierge_extra', label: 'Extra Vierge' },
    { value: 'vierge', label: 'Vierge' },
    { value: 'lampante', label: 'Lampante' },
    { value: 'standard', label: 'Standard' }
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      storageUnits: StorageUnitDto[];
      oilSale: any;
      quantityKg: number;

    },
    private fb: FormBuilder,
    protected dialogRef: MatDialogRef<OilSaleValidationDialogComponent>
  ) {}

  ngOnInit(): void {

  }

  /** true if selected unit doesn't have enough oil for the requested quantity */
  get capacityError(): boolean {
    // Get the selected unit from the form
    const unit = this.form.get('storageUnitSourceId')?.value;
    if (!unit) return false;
    // If the selected unit's current volume is less than the requested quantity, return true
    return unit.currentVolume < this.data.quantityKg;
  }

  /** how much oil is available in the selected unit */
  get availableQuantity(): number {
    const unit = this.form.get('storageUnitSourceId')?.value as StorageUnitDto;
    return unit ? unit.currentVolume : 0;
  }

/**
 * Retrieves formatted information about a storage unit, including supplier details if available
 * @param u - The StorageUnitDto object containing storage unit information
 * @returns A formatted string containing storage unit details and optionally supplier information
 */
  getStorageUnitInfo(u: StorageUnitDto): string {
    // Include supplier info if available for better context
    if (u.supplier) {
      // Format the string to include name, current volume, max capacity, and supplier's full name
      return `${u.name} (${u.currentVolume.toFixed(2)}/${u.maxCapacity.toFixed(2)} kg) [${u.supplier?.name + " " + u.supplier?.lastname}]`;
    }
    // Return basic storage unit info without supplier details
    return `${u.name} (${u.currentVolume.toFixed(2)}/${u.maxCapacity.toFixed(2)} kg)`;
  }

  confirm(): void {
    if (this.form.invalid || this.isLoading) {
      return;
    }
    this.isLoading = true;

    const selectedStorageUnit = this.form.value.storageUnitSourceId as StorageUnitDto;

    if (!selectedStorageUnit  ) {
      this.isLoading = false;
      this.dialogRef.close(null);
      return;
    }

    const validationData = {
      storageUnitSourceId: selectedStorageUnit,
     };
console.log(validationData)
    this.dialogRef.close(validationData);
  }

  @HostListener('document:keydown.enter', ['$event']) onEnterKey(event: KeyboardEvent): void {
    if (!this.form.invalid && !this.isLoading) {
      this.confirm();
    }
  }

  @HostListener('document:keydown.escape', ['$event']) onEscapeKey(event: KeyboardEvent): void {
    this.dialogRef.close();
  }
}
