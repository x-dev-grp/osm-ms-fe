import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { OilSaleDeliveryRequest } from '../oil-sale-delivery.request';
import { toLocalDateTimeString } from '../oil-sale-add/oil-sale.mapper';

export interface OilSaleDeliverDialogData {
  defaultAddress?: string;
}

@Component({
  selector: 'app-oil-sale-deliver-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    TranslateModule
  ],
  templateUrl: './oil-sale-deliver-dialog.component.html',
  styles: [`
    .dialog-hint { margin: 0 0 16px; color: #666; font-size: 0.9rem; }
    .deliver-form { display: flex; flex-direction: column; gap: 8px; min-width: 320px; }
    .full-width { width: 100%; }
    .address-toggle { margin-bottom: 8px; }
  `]
})
export class OilSaleDeliverDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<OilSaleDeliverDialogComponent, OilSaleDeliveryRequest | undefined>);
  private readonly data = inject<OilSaleDeliverDialogData>(MAT_DIALOG_DATA, { optional: true });
  private readonly fb = inject(FormBuilder);

  readonly clientAddress = (this.data?.defaultAddress ?? '').trim();
  readonly hasClientAddress = this.clientAddress.length > 0;

  readonly form = this.fb.group({
    useClientAddress: [this.hasClientAddress],
    deliveryDate: [new Date(), Validators.required],
    deliveryAddress: [this.clientAddress, Validators.required],
    deliveryNotes: ['']
  });

  ngOnInit(): void {
    this.updateAddressState();
    this.form.get('useClientAddress')!.valueChanges.subscribe(() => this.updateAddressState());
  }

  onCancel(): void {
    this.dialogRef.close(undefined);
  }

  onConfirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const address = value.useClientAddress
      ? this.clientAddress
      : value.deliveryAddress?.trim();

    if (!address) {
      this.form.get('deliveryAddress')?.setErrors({ required: true });
      this.form.get('deliveryAddress')?.markAsTouched();
      return;
    }

    this.dialogRef.close({
      deliveryDate: toLocalDateTimeString(value.deliveryDate as Date),
      deliveryAddress: address,
      deliveryNotes: value.deliveryNotes?.trim() || undefined
    });
  }

  private updateAddressState(): void {
    const useClient = !!this.form.get('useClientAddress')?.value;
    const addressCtrl = this.form.get('deliveryAddress')!;

    if (useClient && this.hasClientAddress) {
      addressCtrl.setValue(this.clientAddress, { emitEvent: false });
      addressCtrl.disable({ emitEvent: false });
    } else {
      addressCtrl.enable({ emitEvent: false });
      if (!useClient) {
        addressCtrl.setValue('', { emitEvent: false });
      }
    }
  }
}
