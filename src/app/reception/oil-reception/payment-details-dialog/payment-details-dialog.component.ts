import { Component, Inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidatorFn } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe } from '@ngx-translate/core';

export interface PaymentDetailsDialogData {
  /** Max oil quantity allowed (from original olive reception: oilQuantity or fallback to poidsNet) */
  maxQty: number;
  /** Max total amount allowed (the “original olive delivery price” / unpaid to allocate) */
  maxTotal: number;
  /** Optional initial values */
  initialUnitPrice?: number | null;
  initialQuantity?: number | null;
  /** Optional labels if you need to localize outside templates */
  labels?: {
    title?: string;
    desc?: string;
    unitPrice?: string;
    qty?: string;
    total?: string;
    cancel?: string;
    confirm?: string;
  };
}

function toNum(v: any, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}
function r2(v: number): number { return Math.round((v + Number.EPSILON) * 100) / 100; }
function r3(v: number): number { return Math.round((v + Number.EPSILON) * 1000) / 1000; }

/** Cross-field validator enforcing total ≤ maxTotal and quantity ≤ maxQty */
/** only enforce caps; do NOT force total = unitPrice * quantity */
function capValidator(maxQty: number, maxTotal: number): ValidatorFn {
  return (g: AbstractControl) => {
    const quantity = toNum(g.get('quantity')?.value);
    const total    = toNum(g.get('total')?.value);
    const errs: any = {};
    if (quantity > maxQty) errs.maxQty = { quantity, maxQty };
    if (total > maxTotal) errs.maxTotal = { total, maxTotal };
    return Object.keys(errs).length ? errs : null;
  };
}

@Component({
  selector: 'app-payment-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    TranslatePipe
  ],
  templateUrl: './payment-details-dialog.component.html',
  styleUrl: './payment-details-dialog.component.scss'
})
export class PaymentDetailsDialogComponent implements OnInit {
  form!: FormGroup;
  private syncing = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PaymentDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PaymentDetailsDialogData
  ) {}

  ngOnInit(): void {
    const maxQty   = Math.max(0, toNum(this.data.maxQty));
    const maxTotal = Math.max(0, toNum(this.data.maxTotal));

    const unitPrice0 = toNum(this.data.initialUnitPrice);
    const quantity0  = Math.min(toNum(this.data.initialQuantity), maxQty);
    const total0     = r2(unitPrice0 * quantity0);

    this.form = this.fb.group({
      unitPrice: [unitPrice0 || null, [Validators.required, Validators.min(0.0001)]],
      quantity:  [quantity0  || null, [Validators.required, Validators.min(0)]],
      total:     [total0],
    }, { validators: capValidator(maxQty, maxTotal) });
  }

  // — sync rules (no back-propagation to other inputs except total) —
  onUnitPriceInput(): void {
    if (this.syncing) return; this.syncing = true;
    const p = toNum(this.form.get('unitPrice')?.value);
    let q   = toNum(this.form.get('quantity')?.value);
    // recompute total only; keep quantity as-is but cap its effect by maxTotal
    let total = r2(p * q);
    total = Math.min(total, toNum(this.data.maxTotal));
    this.form.get('total')?.patchValue(total, { emitEvent: false });
    this.form.updateValueAndValidity({ emitEvent: false });
    this.syncing = false;
  }

  onQuantityInput(): void {
    if (this.syncing) return; this.syncing = true;
    let q = toNum(this.form.get('quantity')?.value);
    q = Math.min(q, toNum(this.data.maxQty));               // hard cap quantity
    const p = toNum(this.form.get('unitPrice')?.value);
    let total = r2(p * q);                                  // recompute total only
    total = Math.min(total, toNum(this.data.maxTotal));     // cap total
    this.form.get('quantity')?.patchValue(r2(q), { emitEvent: false });
    this.form.get('total')?.patchValue(total, { emitEvent: false });
    this.form.updateValueAndValidity({ emitEvent: false });
    this.syncing = false;
  }

  onTotalInput(): void {
    if (this.syncing) return; this.syncing = true;
    let t = toNum(this.form.get('total')?.value);
    t = Math.min(t, toNum(this.data.maxTotal));             // cap total
    this.form.get('total')?.patchValue(r2(t), { emitEvent: false });
    this.form.updateValueAndValidity({ emitEvent: false });
    this.syncing = false;
  }

  confirm(): void {
    if (this.form.invalid) return;
    const unitPrice = toNum(this.form.get('unitPrice')?.value);
    const quantity  = toNum(this.form.get('quantity')?.value);
    const total     = toNum(this.form.get('total')?.value);
    this.dialogRef.close({ unitPrice, quantity, total });
  }

  close(): void {
    this.dialogRef.close();
  }
}
