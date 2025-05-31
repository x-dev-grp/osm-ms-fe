import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogRef } from '@angular/material/dialog';
import { MatFormField } from '@angular/material/form-field';
import { MatDatepicker, MatDatepickerInput, MatDatepickerToggle } from '@angular/material/datepicker';
import { SharedModule } from '../../../../demo/shared/shared.module';
import { GlobalLot, PlanItemType, PlanningItem } from '../planning.component';
import { DatePipe } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ChildLotWithRendement extends PlanningItem {
  calculatedRendement?: number;
}

@Component({
  selector: 'app-completion-details-dialog',
  templateUrl: './completion-details-dialog.component.html',
  standalone: true,
  imports: [MatDialogActions, MatFormField, MatDatepickerToggle, MatDatepicker, MatDatepickerInput, SharedModule, DatePipe, MatInputModule, MatButtonModule, MatDialogModule, CommonModule, FormsModule],
  styleUrls: ['./completion-details-dialog.component.scss']
})
export class CompletionDetailsDialogComponent {
  inputOilQuantity: number | null = null;
  finalObservation: string = '';
  completionDate: Date = new Date();
  childLotsWithRendement: ChildLotWithRendement[] = [];

  item: PlanningItem | GlobalLot;
  itemType: PlanItemType;

  constructor(
    public dialogRef: MatDialogRef<CompletionDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { item: PlanningItem | GlobalLot; itemType: PlanItemType }
  ) {
    this.item = data.item;
    this.itemType = data.itemType;
    if (this.itemType === PlanItemType.GLOBAL_LOT) {
      this.initializeChildLots();
    }
  }

  private initializeChildLots(): void {
    if (this.itemType === PlanItemType.GLOBAL_LOT) {
      const globalLot = this.item as GlobalLot;
      this.childLotsWithRendement = globalLot.items
        .filter(item => item.type === PlanItemType.LOT)
        .map(item => item.data as PlanningItem);
    }
  }

  get oliveWeight(): number | null {
    if (this.itemType === PlanItemType.LOT) {
      return (this.item as PlanningItem)?.oliveQuantity ?? null;
    } else if (this.itemType === PlanItemType.GLOBAL_LOT) {
      return (this.item as GlobalLot)?.totalKg ?? null;
    }
    return null;
  }

  get rendement(): number | null {
    if (this.inputOilQuantity != null && this.inputOilQuantity >= 0 && this.oliveWeight != null && this.oliveWeight > 0) {
      const calculatedRendement = (this.inputOilQuantity / this.oliveWeight) * 100;

      // If this is a global lot, calculate individual rendements for child lots
      if (this.itemType === PlanItemType.GLOBAL_LOT) {
        this.calculateChildLotsRendement(calculatedRendement);
      }

      return calculatedRendement;
    }
    return null;
  }

  private calculateChildLotsRendement(globalRendement: number): void {
    if (this.itemType === PlanItemType.GLOBAL_LOT) {
      const globalLot = this.item as GlobalLot;
      const totalWeight = globalLot.totalKg;

      this.childLotsWithRendement = this.childLotsWithRendement.map(lot => {
        const weightProportion = lot.oliveQuantity / totalWeight;
        const calculatedRendement = globalRendement * weightProportion;
        return {
          ...lot,
          calculatedRendement
        };
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.inputOilQuantity === null || this.inputOilQuantity < 0) {
      return;
    }

    this.dialogRef.close({
      confirmed: true,
      oilQuantity: this.inputOilQuantity,
      rendement: this.rendement,
      completionDate: this.completionDate,
      finalObservation: this.finalObservation.trim() || undefined,
      childLotsRendement: this.childLotsWithRendement.map(lot => ({
        lotNumber: lot.lotNumber,
        rendement: lot.calculatedRendement
      }))
    });
  }

  protected readonly PlanItemType = PlanItemType;
}
