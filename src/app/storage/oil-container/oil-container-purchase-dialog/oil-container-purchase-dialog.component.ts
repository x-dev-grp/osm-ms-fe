import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { OilContainer } from '../../../shared/models/oil-container';
import { PaymentMethod } from '../../../finance/models/financial-transaction.model';
import { MaterielSupplier, materielSupplierDisplayName } from '../../../stock/models/materiel-supplier.model';
import { MaterielSupplierService } from '../../../stock/services/materiel-supplier.service';

export interface OilContainerPurchaseDialogData {
  container: OilContainer;
}

export interface OilContainerPurchaseFormValue {
  quantity: number;
  unitPrice: number;
  materielSupplierId: string;
  vendor: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}

@Component({
  selector: 'app-oil-container-purchase-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    TranslateModule
  ],
  templateUrl: './oil-container-purchase-dialog.component.html',
  styles: [
    `
      .dialog-hint {
        margin: 0 0 16px;
        color: #666;
        font-size: 0.9rem;
      }
      .purchase-form {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 360px;
      }
      .full-width {
        width: 100%;
      }
      .summary-box {
        margin-top: 8px;
        padding: 12px;
        border-radius: 8px;
        background: #f5f7fa;
        display: grid;
        gap: 6px;
      }
      .summary-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
      }
      .summary-row.total {
        font-weight: 600;
      }
    `
  ]
})
export class OilContainerPurchaseDialogComponent implements OnInit, OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<OilContainerPurchaseDialogComponent, OilContainerPurchaseFormValue | undefined>);
  readonly data = inject<OilContainerPurchaseDialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly materielSupplierService = inject(MaterielSupplierService);
  private readonly subscriptions = new Subscription();

  readonly paymentMethods = Object.values(PaymentMethod);
  step: 'form' | 'confirm' = 'form';
  pendingValue?: OilContainerPurchaseFormValue;
  suppliers: MaterielSupplier[] = [];
  filteredSuppliers$!: Observable<MaterielSupplier[]>;

  readonly form = this.fb.group({
    quantity: [1, [Validators.required, Validators.min(1)]],
    unitPrice: [this.data.container.buyPrice ?? 0, [Validators.required, Validators.min(0.01)]],
    materielSupplier: [null as MaterielSupplier | null, [Validators.required, this.requireSupplierSelection()]],
    paymentMethod: [PaymentMethod.CASH, Validators.required],
    notes: ['']
  });

  ngOnInit(): void {
    this.setupSupplierAutocomplete();
    this.subscriptions.add(
      this.materielSupplierService.getActive().subscribe({
        next: (suppliers) => {
          this.suppliers = suppliers ?? [];
        }
      })
    );
    this.subscriptions.add(
      this.form.valueChanges.subscribe(() => {
        if (this.step === 'confirm') {
          this.step = 'form';
          this.pendingValue = undefined;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get totalAmount(): number {
    const qty = Number(this.form.get('quantity')?.value ?? 0);
    const price = Number(this.form.get('unitPrice')?.value ?? 0);
    return qty * price;
  }

  get newStockQuantity(): number {
    const current = this.data.container.stockQuantity ?? 0;
    const qty = Number(this.form.get('quantity')?.value ?? 0);
    return current + qty;
  }

  displaySupplierFn(item: MaterielSupplier | string | null): string {
    if (!item || typeof item === 'string') {
      return item ?? '';
    }
    return materielSupplierDisplayName(item);
  }

  onSupplierSelected(event: MatAutocompleteSelectedEvent): void {
    const selected = event.option.value as MaterielSupplier;
    const ctrl = this.form.get('materielSupplier')!;
    ctrl.setValue(selected);
    ctrl.updateValueAndValidity();
  }

  markSupplierTouched(): void {
    const ctrl = this.form.get('materielSupplier')!;
    ctrl.markAsTouched();
    ctrl.updateValueAndValidity({ onlySelf: true });
  }

  selectActiveOption(auto: { options?: { active: boolean; select: () => void }[] }, trig: MatAutocompleteTrigger): void {
    const active = auto.options?.find((option) => option.active);
    if (active) {
      active.select();
      trig.closePanel();
    }
  }

  onCancel(): void {
    if (this.step === 'confirm') {
      this.step = 'form';
      this.pendingValue = undefined;
      return;
    }
    this.dialogRef.close(undefined);
  }

  onContinue(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const supplier = raw.materielSupplier as MaterielSupplier;
    this.pendingValue = {
      quantity: Number(raw.quantity),
      unitPrice: Number(raw.unitPrice),
      materielSupplierId: supplier.id!,
      vendor: this.displaySupplierFn(supplier),
      paymentMethod: raw.paymentMethod as PaymentMethod,
      notes: raw.notes?.trim() || undefined
    };
    this.step = 'confirm';
  }

  onConfirm(): void {
    if (!this.pendingValue) {
      return;
    }
    this.dialogRef.close(this.pendingValue);
  }

  private setupSupplierAutocomplete(): void {
    const supplierCtrl = this.form.get('materielSupplier')!;
    this.filteredSuppliers$ = supplierCtrl.valueChanges.pipe(
      startWith(supplierCtrl.value),
      map((value) => (typeof value === 'string' ? value : this.displaySupplierFn(value))),
      map((query) => {
        const q = (query ?? '').toLowerCase().trim();
        if (!q) {
          return this.suppliers;
        }
        return this.suppliers.filter((supplier) => this.containsSupplier(supplier, q));
      })
    );
  }

  private containsSupplier(supplier: MaterielSupplier, query: string): boolean {
    const nom = (supplier.nom ?? '').toLowerCase();
    const nomCommercial = (supplier.nomCommercial ?? '').toLowerCase();
    const code = (supplier.code ?? '').toLowerCase();
    return nom.includes(query) || nomCommercial.includes(query) || code.includes(query);
  }

  private requireSupplierSelection() {
    return (ctrl: AbstractControl): ValidationErrors | null => {
      const value = ctrl.value;
      const isObjectSelected = value && typeof value === 'object' && !!value.id;
      return isObjectSelected ? null : { selectionRequired: true };
    };
  }
}
