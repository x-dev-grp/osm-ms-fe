import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface LotCreationData {
  lotNumber: string;
  deliveryDate: string;
  deliveryNumber?: string;
  oliveQuantity: number;
}

@Component({
  selector: 'app-lot-creation-dialog',
  templateUrl: './lot-creation-dialog.component.html',
  styleUrls: ['./lot-creation-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class LotCreationDialogComponent {
  lotForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<LotCreationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { existingLotNumbers: string[] }
  ) {
    this.lotForm = this.fb.group({
      lotNumber: ['', [Validators.required, this.uniqueLotNumberValidator(data.existingLotNumbers)]],
      deliveryDate: ['', [Validators.required, this.futureDateValidator()]],
      deliveryNumber: [''],
      oliveQuantity: ['', [Validators.required, Validators.min(1), Validators.max(10000)]]
    });
  }

  uniqueLotNumberValidator(existingLotNumbers: string[]): any {
    return (control: any) => {
      return existingLotNumbers.includes(control.value) ? { nonUnique: true } : null;
    };
  }

  futureDateValidator(): any {
    return (control: any) => {
      const selectedDate = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today ? null : { pastDate: true };
    };
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.lotForm.valid) {
      this.dialogRef.close(this.lotForm.value);
    }
  }
}
