import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogActions, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormField } from '@angular/material/form-field';
import { MatDatepicker, MatDatepickerInput, MatDatepickerToggle } from '@angular/material/datepicker';
import { SharedModule } from '../../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { GlobalLot, PlanItemType, PlanningItem } from '../../../shared/models/planningDTOS';
import { SupplierType } from '../../../shared/models/supplier-type';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import {
  ConfirmationDialogData,
  ConfirmationDialogResult,
  ConfirmationType
} from '../../../shared/services/confirmation-dialog.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppParameterService } from '../../../shared/services/AppParameterService';
import { ToastService } from '../../../shared/services/toast.service';

interface ChildLotWithRendement extends PlanningItem {
  calculatedRendement?: number;
  calculatedTriturationPrice?: number;
  oilQuantity?: number; // Add oil quantity per child lot
}

@Component({
  selector: 'app-completion-details-dialog',
  templateUrl: './completion-details-dialog.component.html',
  standalone: true,
  imports: [
    MatDialogActions,
    MatFormField,
    MatDatepickerToggle,
    MatDatepicker,
    MatDatepickerInput,
    SharedModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    CommonModule,
    FormsModule,
    TranslateModule
  ],
  styleUrls: ['./completion-details-dialog.component.scss']
})
export class CompletionDetailsDialogComponent implements OnInit {
  inputOilQuantity: number | null = null;
  finalObservation: string = '';
  completionDate: Date = new Date();
  completionTime = this.toTimeInputValue(new Date());
  childLotsWithRendement: ChildLotWithRendement[] = [];
  autoSetStorage = false;

  triturationHours: number | null = null;
  triturationMinutes: number | null = null;
  triturationPricePerKg: number | null = null;

  item: PlanningItem | GlobalLot;
  itemType: PlanItemType;
  protected readonly PlanItemType = PlanItemType;
  private readonly prixtriturationkg = 'PRIX_TRITURATION_KG';

  constructor(
    public dialogRef: MatDialogRef<CompletionDetailsDialogComponent>,
    private dialog: MatDialog, // ← here
    private translate: TranslateService,
    private toast: ToastService,
    private parameterService: AppParameterService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      item: PlanningItem | GlobalLot;
      itemType: PlanItemType;
    }
  ) {
    this.item = data.item;
    this.itemType = data.itemType;
    if (this.itemType === this.PlanItemType.GLOBAL_LOT) {
      this.initializeChildLots();
    }
  }

  /** Try to read the first child's operationType from a Global Lot object */
  private firstChildOpTypeFromGlobal(gl: any): any {
    if (!gl) return undefined;
    const candidates = [gl.childLots, gl.lots, gl.items, gl.receptions, gl.children];
    for (const arr of candidates) {
      if (Array.isArray(arr) && arr.length > 0) {
        return arr[0]?.data.operationType;
      }
    }
    return undefined;
  }

  shouldShowTriturationPrice(): boolean {
    const item: any = this.item;
    const rawOpSource =
      this.itemType === PlanItemType.GLOBAL_LOT
        ? this.firstChildOpTypeFromGlobal(item) ?? item?.operationType
        : item?.operationType;
    const rawOp = rawOpSource?.toString().toUpperCase();

    if (!rawOp) {
      return false;
    }

    const showOps = new Set(['SIMPLE_RECEPTION']);
    const hideOps = new Set(['OLIVE_PURCHASE', 'OIL_PURCHASE', 'EXCHANGE', 'PAYMENT', 'OIL_SALE']);

    if (showOps.has(rawOp)) {
      return true;
    }
    if (hideOps.has(rawOp)) {
      return false;
    }
    return false;
  }

  get totalTriturationPrice(): number {
    if (
      this.itemType === PlanItemType.LOT &&
      this.oliveWeight != null &&
      this.triturationPricePerKg != null &&
      this.triturationPricePerKg >= 0
    ) {
      return this.oliveWeight * this.triturationPricePerKg;
    } else if (this.itemType === PlanItemType.GLOBAL_LOT) {
      return this.childLotsWithRendement.reduce((sum, lot) => sum + (lot.calculatedTriturationPrice || 0), 0);
    }
    return 0;
  }

  // Remove setChildOilQuantity and oilQuantity input for child lots

  // Get total trituration duration in minutes
  get triturationDurationInMinutes(): number | null {
    if (this.triturationHours !== null && this.triturationMinutes !== null) {
      return this.triturationHours * 60 + this.triturationMinutes;
    }
    return null;
  }

  get oliveWeight(): number | null {
    if (this.itemType === PlanItemType.LOT) {
      const planningItem = this.item as PlanningItem;
      return planningItem?.oliveQuantity ?? null;
    } else if (this.itemType === PlanItemType.GLOBAL_LOT) {
      const globalLot = this.item as GlobalLot;
      return globalLot?.totalKg ?? null;
    }
    return null;
  }

  get rendement(): number | null {
    if (this.inputOilQuantity != null && this.inputOilQuantity >= 0 && this.oliveWeight != null && this.oliveWeight > 0) {
      const calculatedRendement = (this.inputOilQuantity / this.oliveWeight) * 100;

      // If this is a global lot, calculate oilQuantity for each child lot
      if (this.itemType === PlanItemType.GLOBAL_LOT) {
        this.calculateChildLotsOilQuantityFromGlobalRendement(calculatedRendement);
      }

      return calculatedRendement;
    }
    return null;
  }

  get lotItem(): PlanningItem | null {
    return this.itemType === PlanItemType.LOT ? (this.item as PlanningItem) : null;
  }

  get durationSummary(): string {
    const total = this.triturationDurationInMinutes;
    if (total == null || total <= 0) {
      return '';
    }
    const hours = Math.floor(total / 60);
    const minutes = total % 60;
    if (hours > 0 && minutes > 0) {
      return this.translate.instant('RECEPTION.PLANNING.COMPLETION.DURATION_TOTAL_HM', { hours, minutes });
    }
    if (hours > 0) {
      return this.translate.instant('RECEPTION.PLANNING.COMPLETION.DURATION_TOTAL_H', { hours });
    }
    return this.translate.instant('RECEPTION.PLANNING.COMPLETION.DURATION_TOTAL_M', { minutes });
  }

  formatDateTime(value: Date | string | null | undefined): string {
    if (!value) {
      return '—';
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  }

  getSupplierName(supplier?: SupplierType): string {
    if (!supplier) {
      return '—';
    }
    return [supplier.name, supplier.lastname].filter(Boolean).join(' ').trim() || '—';
  }

  getCompletionDateTime(): Date {
    const result = new Date(this.completionDate);
    const [hours, minutes] = (this.completionTime || '00:00').split(':').map((part) => parseInt(part, 10));
    result.setHours(Number.isNaN(hours) ? 0 : hours, Number.isNaN(minutes) ? 0 : minutes, 0, 0);
    return result;
  }

  ngOnInit(): void {
    this.completionTime = this.toTimeInputValue(this.completionDate);
    this.loadTriturationPriceFromParam();
    this.calculateChildLotsPrice();
  }

  loadTriturationPriceFromParam(): void {
    this.parameterService.getByCode(this.prixtriturationkg).subscribe({
      next: (param) => {
        const value = parseFloat(param.value);
        if (!isNaN(value)) {
          this.triturationPricePerKg = value;
        }
      },
      error: () => {
        console.warn('Prix de trituration introuvable');
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.inputOilQuantity == null || this.inputOilQuantity < 0) {
      this.toast.warning(this.translate.instant('RECEPTION.PLANNING.COMPLETION.INVALID_OIL_QUANTITY'));
      return;
    }
    if (!this.isDurationValid()) {
      this.toast.warning(this.translate.instant('RECEPTION.PLANNING.COMPLETION.INVALID_DURATION'));
      return;
    }

    if (this.triturationPricePerKg != null && this.triturationPricePerKg < 0) {
      this.toast.warning(this.translate.instant('RECEPTION.PLANNING.COMPLETION.INVALID_TRITURATION_PRICE'));
      return;
    }
    if (this.oliveWeight == null || this.oliveWeight <= 0) {
      this.toast.warning(this.translate.instant('RECEPTION.PLANNING.COMPLETION.INVALID_OLIVE_WEIGHT'));
      return;
    }
    const calcRend = this.rendement;
    if (calcRend == null || calcRend < 0) {
      this.toast.warning(this.translate.instant('RECEPTION.PLANNING.COMPLETION.INVALID_YIELD'));
      return;
    }

    if (this.itemType === PlanItemType.GLOBAL_LOT) {
      if (!this.childLotsWithRendement.length) {
        this.toast.warning(this.translate.instant('RECEPTION.PLANNING.COMPLETION.NO_CHILD_LOTS'));
        return;
      }
      for (const lot of this.childLotsWithRendement) {
        if (lot.oilQuantity == null || lot.oilQuantity < 0) {
          this.toast.warning(
            this.translate.instant('RECEPTION.PLANNING.COMPLETION.INVALID_CHILD_OIL', { lotNumber: lot.lotNumber })
          );
          return;
        }
      }
    }

    this.calculateChildLotsPrice();

    // If single lot with storage, confirm first
    if (
      this.itemType === PlanItemType.LOT &&
      (this.item as PlanningItem).operationType === 'SIMPLE_RECEPTION' &&
      (this.item as PlanningItem).supplier!.hasStorage
    ) {
      const dialogData: ConfirmationDialogData = {
        title: this.translate.instant('STANDARD.CONFIRMATION.OIL_TRANSACTION.TITLE'),
        message: this.translate.instant('STANDARD.CONFIRMATION.OIL_TRANSACTION.MESSAGE'),
        confirmText: this.translate.instant('STANDARD.CONFIRMATION.OIL_TRANSACTION.CONFIRM'),
        cancelText: this.translate.instant('STANDARD.CONFIRMATION.OIL_TRANSACTION.CANCEL'),
        type: ConfirmationType.WARNING,
        destructive: false,
        showIcon: true
      };

      this.dialog
        .open(ConfirmationDialogComponent, { data: dialogData })
        .afterClosed()
        .subscribe((res: ConfirmationDialogResult) => {
          if (res?.confirmed) {
            this.autoSetStorage = true;
            this.finalizeConfirmation();
          } else {
            this.autoSetStorage = false;
            this.finalizeConfirmation();
          }
        });
      return;
    }
    this.autoSetStorage = false;
    this.finalizeConfirmation();
  }

  // For *ngFor trackBy
  trackByLotNumber(index: number, lot: ChildLotWithRendement) {
    return lot.lotNumber;
  }

  // Call price calculation when price per kg changes
  setTriturationPricePerKg(value: number | null) {
    this.triturationPricePerKg = value;
    this.calculateChildLotsPrice();
  }

  private finalizeConfirmation(): void {
    const completionData = {
      autoSetStorage: this.autoSetStorage,
      confirmed: true,
      oilQuantity: this.inputOilQuantity!,
      rendement: this.rendement!,
      completionDate: this.getCompletionDateTime(),
      trtDate: this.getCompletionDateTime().toISOString(),
      finalObservation: this.finalObservation.trim() || undefined,
      triturationPricePerKg: this.triturationPricePerKg,
      totalTriturationPrice: this.totalTriturationPrice,
      triturationHours: this.triturationHours,
      triturationMinutes: this.triturationMinutes,
      triturationDurationInMinutes: this.triturationDurationInMinutes,
      childLotsRendement: this.childLotsWithRendement.map((lot) => ({
        lotNumber: lot.lotNumber,
        oilQuantity: lot.oilQuantity!,
        rendement: lot.calculatedRendement!,
        triturationPrice: lot.calculatedTriturationPrice!,
        // Add trituration duration data for child lots
        triturationHours: this.triturationHours,
        triturationMinutes: this.triturationMinutes,
        triturationDurationInMinutes: this.triturationDurationInMinutes
      }))
    };

    console.log('[DIALOG] Confirming completion with data:', completionData);
    this.dialogRef.close(completionData);
  }

  // Calculate trituration price for each child lot in a global lot
  private calculateChildLotsPrice(): void {
    if (this.itemType === PlanItemType.GLOBAL_LOT && this.triturationPricePerKg != null && this.triturationPricePerKg >= 0) {
      this.childLotsWithRendement = this.childLotsWithRendement.map((lot) => ({
        ...lot,
        calculatedTriturationPrice: (lot.oliveQuantity ?? 0) * this.triturationPricePerKg!
      }));
    } else if (this.itemType === PlanItemType.GLOBAL_LOT) {
      this.childLotsWithRendement = this.childLotsWithRendement.map((lot) => ({
        ...lot,
        calculatedTriturationPrice: (lot.oliveQuantity ?? 0) * this.triturationPricePerKg!
      }));
    }
  }


  // When global rendement or oliveQuantity changes, recalculate oilQuantity for each child lot
  private calculateChildLotsOilQuantityFromGlobalRendement(globalRendement: number): void {
    if (this.itemType !== PlanItemType.GLOBAL_LOT) return;

    const globalLot = this.item as GlobalLot;
    const totalKg = Number(globalLot.totalKg) || 0;
    if (totalKg <= 0) {
      // No weight -> zero everything
      this.childLotsWithRendement = this.childLotsWithRendement.map(lot => ({
        ...lot,
        oilQuantity: 0,
        calculatedRendement: 0
      }));
      this.calculateChildLotsPrice();
      return;
    }

    // Target total oil from the global rendement
    const targetTotal = +(totalKg * (globalRendement / 100)).toFixed(2);

    // First pass: proportional distribution with 2-decimal rounding
    let running = 0;
    const updated = this.childLotsWithRendement.map(lot => {
      const olive = Number(lot.oliveQuantity) || 0;
      const rawOil = olive * (globalRendement / 100);
      const oil = +rawOil.toFixed(2);
      running += oil;
      return { ...lot, oilQuantity: oil };
    });

    // Fix rounding drift on the last nonzero lot so sums match exactly
    const drift = +(targetTotal - running).toFixed(2);
    if (drift !== 0) {
      const idx = [...updated].reverse().findIndex(l => (Number(l.oliveQuantity) || 0) > 0);
      if (idx !== -1) {
        const k = updated.length - 1 - idx;
        updated[k].oilQuantity = +(((updated[k].oilQuantity ?? 0) + drift).toFixed(2));
      }
    }

    // Compute per-child rendement from oil/olive (more explicit)
    this.childLotsWithRendement = updated.map(lot => {
      const olive = Number(lot.oliveQuantity) || 0;
      const oil = Number(lot.oilQuantity) || 0;
      const rend = olive > 0 ? (oil / olive) * 100 : 0;
      return { ...lot, calculatedRendement: rend };
    });

    this.calculateChildLotsPrice();
  }


  private initializeChildLots(): void {
    if (this.itemType === PlanItemType.GLOBAL_LOT) {
      const globalLot = this.item as GlobalLot;
      this.childLotsWithRendement = globalLot.items
        .filter((item) => item.type === PlanItemType.LOT)
        .map((item) => {
          const planningItem = item.data as PlanningItem;
          return {
            ...planningItem,
            oilQuantity: planningItem.oilQuantity ?? 0,
            triturationPricePerKg: 0,
            calculatedRendement: undefined,
            calculatedTriturationPrice: 0
          };
        });
    }
  }

  // Recalculate rendement for each child lot in a global lot
  private calculateChildLotsRendementForGlobal(): void {
    if (this.itemType === PlanItemType.GLOBAL_LOT) {
      this.childLotsWithRendement = this.childLotsWithRendement.map((lot) => {
        const rendement = lot.oliveQuantity > 0 && lot.oilQuantity != null ? (lot.oilQuantity / lot.oliveQuantity) * 100 : 0;
        return {
          ...lot,
          calculatedRendement: rendement
        };
      });
    }
  }

  isDurationValid(): boolean {
    const h = this.triturationHours;
    const m = this.triturationMinutes;
    const hasH = h !== null && h !== undefined && h !== 0;
    const hasM = m !== null && m !== undefined && m !== 0;
    if (!hasH && !hasM) {
      return false;
    }
    if (hasH && (Number.isNaN(Number(h)) || Number(h) < 0)) {
      return false;
    }
    if (hasM) {
      const mm = Number(m);
      if (Number.isNaN(mm) || mm < 0 || mm > 59) {
        return false;
      }
    }
    return true;
  }

  onPricePerKgChange(value: number | string | null): void {
    const num = value === null ? null : Number(value);
    this.triturationPricePerKg = Number.isFinite(num as number) ? (num as number) : null;
    this.calculateChildLotsPrice();
  }

  private toTimeInputValue(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

}
