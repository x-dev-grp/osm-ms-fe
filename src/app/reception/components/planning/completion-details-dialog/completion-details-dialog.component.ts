import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogActions, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormField } from '@angular/material/form-field';
import { MatDatepicker, MatDatepickerInput, MatDatepickerToggle } from '@angular/material/datepicker';
import { SharedModule } from '../../../../shared/shared.module';
import { CommonModule, DatePipe } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { GlobalLot, PlanItemType, PlanningItem } from '../../../../shared/models/planningDTOS';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import {
  ConfirmationDialogData,
  ConfirmationDialogResult,
  ConfirmationType
} from '../../../../shared/services/confirmation-dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { AppParameterService } from '../../../../shared/services/AppParameterService';

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
    DatePipe,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    CommonModule,
    FormsModule
  ],
  styleUrls: ['./completion-details-dialog.component.scss']
})
export class CompletionDetailsDialogComponent implements OnInit {
  inputOilQuantity: number | null = null;
  finalObservation: string = '';
  completionDate: Date = new Date();
  childLotsWithRendement: ChildLotWithRendement[] = [];
  autoSetStorage = false; // ← new flag

  triturationPricePerKg: number | null = null; // Only used for single lots
  item: PlanningItem | GlobalLot;
  itemType: PlanItemType;
  protected readonly PlanItemType = PlanItemType;


  constructor(
    public dialogRef: MatDialogRef<CompletionDetailsDialogComponent>,
    private dialog: MatDialog, // ← here
    private translate: TranslateService,
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

  // Call price calculation when child lots or oliveWeight changes
  ngOnInit(): void {
    this.loadTriturationPriceFromParam();
    this.calculateChildLotsPrice();
  }

  private readonly prixtriturationkg = 'PRIX_TRITURATION_KG';

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
      console.error('[DIALOG] Invalid oil quantity:', this.inputOilQuantity);
      return;
    }
    if (this.triturationPricePerKg != null && this.triturationPricePerKg < 0) {
      console.error('[DIALOG] Invalid trituration price:', this.triturationPricePerKg);
      return;
    }
    if (this.oliveWeight == null || this.oliveWeight <= 0) {
      console.error('[DIALOG] Invalid olive weight:', this.oliveWeight);
      return;
    }
    const calcRend = this.rendement;
    if (calcRend == null || calcRend < 0) {
      console.error('[DIALOG] Invalid rendement:', calcRend);
      return;
    }

    // Global-lot child checks
    if (this.itemType === PlanItemType.GLOBAL_LOT) {
      if (!this.childLotsWithRendement.length) {
        console.error('[DIALOG] No child lots found');
        return;
      }
      for (const lot of this.childLotsWithRendement) {
        if (lot.oilQuantity == null || lot.oilQuantity < 0) {
          console.error('[DIALOG] Invalid child lot oilQuantity:', lot.lotNumber, lot.oilQuantity);
          return;
        }
      }
    }

    this.calculateChildLotsPrice();

    // If single lot with storage, confirm first
    if (this.itemType === PlanItemType.LOT && (this.item as PlanningItem).operationType ===  "SIMPLE_RECEPTION"&& (this.item as PlanningItem).supplier!.hasStorage) {
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
          }else {
            this.autoSetStorage=false
            this.finalizeConfirmation()
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
      completionDate: this.completionDate,
      finalObservation: this.finalObservation.trim() || undefined,
      triturationPricePerKg: this.triturationPricePerKg,
      totalTriturationPrice: this.totalTriturationPrice,
      childLotsRendement: this.childLotsWithRendement.map((lot) => ({
        lotNumber: lot.lotNumber,
        oilQuantity: lot.oilQuantity!,
        rendement: lot.calculatedRendement!,
        triturationPrice: lot.calculatedTriturationPrice!
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
        calculatedTriturationPrice: (lot.oilQuantity ?? 0) * this.triturationPricePerKg!
      }));
    } else if (this.itemType === PlanItemType.GLOBAL_LOT) {
      this.childLotsWithRendement = this.childLotsWithRendement.map((lot) => ({
        ...lot,
        calculatedTriturationPrice: 0
      }));
    }
  }

  // When global rendement or oliveQuantity changes, recalculate oilQuantity for each child lot
  private calculateChildLotsOilQuantityFromGlobalRendement(globalRendement: number): void {
    if (this.itemType === PlanItemType.GLOBAL_LOT) {
      this.childLotsWithRendement = this.childLotsWithRendement.map((lot) => {
        const oilQuantity = lot.oliveQuantity * (globalRendement / 100);
        return {
          ...lot,
          oilQuantity,
          calculatedRendement: globalRendement // for display, but can be per-lot if needed
        };
      });
      this.calculateChildLotsPrice(); // Also update trituration price for all lots
    }
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

  private calculateChildLotsRendement(globalRendement: number): void {
    if (this.itemType === PlanItemType.GLOBAL_LOT) {
      const globalLot = this.item as GlobalLot;
      const totalWeight = globalLot.totalKg;

      this.childLotsWithRendement = this.childLotsWithRendement.map((lot) => {
        const weightProportion = lot.oliveQuantity / totalWeight;
        const calculatedRendement = globalRendement * weightProportion;
        return {
          ...lot,
          calculatedRendement
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
}
