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

@Component({
  selector: 'app-exchange-validation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    TranslateModule,
    MatProgressSpinnerModule,
    MatIcon
  ],
  templateUrl: './exchange-validation-dialog.component.html',
  styleUrl: './exchange-validation-dialog.component.scss'
})
export class ExchangeValidationDialogComponent implements OnInit {
  form = this.fb.group({
    storageUnitSourceId: new FormControl<StorageUnitDto | null>(null),
    storageUnitDestinationId: new FormControl<StorageUnitDto | null>(null)
  });
  isLoading = false;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      storageUnits: StorageUnitDto[];
      oilQ: any;
      isIn: boolean;
    },
    private fb: FormBuilder,
    protected dialogRef: MatDialogRef<ExchangeValidationDialogComponent>
  ) {}

  ngOnInit(): void {
    if(this.data?.isIn){

      this.form.get("storageUnitDestinationId")?.setValidators(Validators.required);
      this.form.get("storageUnitDestinationId")?.updateValueAndValidity()
      this.form.get("storageUnitSourceId")?.clearValidators()
      this.form.get("storageUnitSourceId")?.updateValueAndValidity()
    }else{
      this.form.get("storageUnitSourceId")?.setValidators(Validators.required);
      this.form.get("storageUnitSourceId")?.updateValueAndValidity()
      this.form.get("storageUnitDestinationId")?.clearValidators()
      this.form.get("storageUnitDestinationId")?.updateValueAndValidity()
    }
  }
  /** true if selected unit can't hold the requested `data.oilQ` */
  get capacityError(): boolean {
    const unit = this.form.get('storageUnitSourceId')?.value;
    if (!unit) return false;
    return unit.maxCapacity - unit.currentVolume < this.data.oilQ;
  }

  /** how much free space is left on the selected unit */
  get availableCapacity(): number {
    const unit = this.form.get('storageUnitSourceId')?.value as StorageUnitDto;
    return unit ? unit.maxCapacity - unit.currentVolume : 0;
  }

  getStorageUnitInfo(u: StorageUnitDto): string {
    // Include supplier info if available for better context
    if (u.supplier) {
      return `${u.name} (${u.currentVolume.toFixed(2)}/${u.maxCapacity.toFixed(2)} kg) [${u.supplier?.supplierInfo.name + " " + u.supplier?.supplierInfo.lastname}]`;
    }
    return `${u.name} (${u.currentVolume.toFixed(2)}/${u.maxCapacity.toFixed(2)} kg)`;
  }

  confirm(): void {
    if (this.form.invalid || this.isLoading) {
      return;
    }
    this.isLoading = true;
    let selectedId;
    if (this.data.isIn) {
      selectedId = this.form.value.storageUnitDestinationId as StorageUnitDto;
    } else {
      selectedId = this.form.value.storageUnitSourceId as StorageUnitDto;
    }
    if (!selectedId) {
      this.isLoading = false;
      this.dialogRef.close(null);
      return;
    }
    this.dialogRef.close(selectedId);
  }

  @HostListener('document:keydown.enter', ['$event']) onEnterKey(event: KeyboardEvent): void {
    if (!this.form.invalid && !this.isLoading) {
      this.confirm();
    }
  }

  @HostListener('document:keydown.escape', ['$event']) onEscapeKey(event: KeyboardEvent): void {
    this.dialogRef.close();
  }

  private capacityValidator(control: AbstractControl): ValidationErrors | null {
    const selectedId = control.value as string;
    const unit = this.data.storageUnits.find((u) => u.id === selectedId);
    if (!unit) return null;
    const available = unit.maxCapacity - unit.currentVolume;
    return available < this.data.oilQ ? { capacity: true } : null;
  }

}
