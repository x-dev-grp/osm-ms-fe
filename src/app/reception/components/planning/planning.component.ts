import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
 import { UnifiedDeliveryService } from '../../../shared/services/delivery.service';
import { UnifiedDelivery } from '../../../shared/models/UnifiedDelivery';
 // Material Module Imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { CardComponent } from '../../../@theme/components/card/card.component';
import { BreakpointObserver } from '@angular/cdk/layout';

interface Item {
  type: 'reception' | 'lot';
  reception?: UnifiedDelivery;
  lotNumber?: string;
  receptions?: UnifiedDelivery[];
}

interface Mill {
  name: string;
  receptions: Item[];
}

@Component({
  selector: 'app-planning',
  templateUrl: './planning.component.html',
  styleUrls: ['./planning.component.scss'],
  standalone: true,
  imports: [
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatDialogModule,
    MatListModule,
    MatExpansionModule,
    DragDropModule,
    CommonModule,
    FormsModule,
    CardComponent
  ]
})
export class PlanningComponent implements OnInit {
  unassignedReceptions: Item[] = [];
  mills: Mill[] = [
    { name: 'Mill ', receptions: [] },
    { name: 'Mill extravierge', receptions: [] },
    {
      name: 'Mill base',
      receptions: []
    }
  ];
  newLotNumber: string = '';
  selectedReceptions: Item[] = [];
  @ViewChild('lotDialog') lotDialog!: TemplateRef<never>;
  isDesktop = true;                             // default
  allCardDropListIds: string[] = [];

  constructor(
     private deliveryService: UnifiedDeliveryService,
    private dialog: MatDialog,
    private bp: BreakpointObserver
  ) {}

  ngOnInit(): void {
    this.bp.observe('(min-width: 1024px)').subscribe(r => {
      this.isDesktop = r.matches;               // ≥1024 px ⇒ true
    });
    this.loadReceptions();
    this.buildDropListIds();
  }
  private buildDropListIds() {
    // Unassigned cards
    this.allCardDropListIds = this.unassignedReceptions
      .map(r => `card-${r.reception!.id}`)
      // plus every mill card
      .concat(
        this.mills.flatMap((mill, mi) =>
          mill.receptions.map(r => `card-${r.reception!.id}`)
        )
      );
  }

  onCardDropped(event: CdkDragDrop<Item[]>) {
    const src: Item = event.item.data;
    const destList: Item[] = event.container.data;
    const dest: Item      = destList[0];

    // if dropped onto itself or onto same container, ignore
    if (!dest || src === dest) return;

    // If both are receptions, create a new global lot
    if (src.type === 'reception' && dest.type === 'reception') {
      this.createGlobalLot([ src.reception!, dest.reception! ]);
    }

    // otherwise let the normal transfer logic run (e.g. into mills/unassigned)
    else {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }

  private createGlobalLot(selectedDeliveries: UnifiedDelivery[]) {
    // remove those 2 from wherever they were
    this.unassignedReceptions = this.unassignedReceptions.filter(
      it => !selectedDeliveries.find(d => d.id === it.reception?.id)
    );
    this.mills.forEach(mill => {
      mill.receptions = mill.receptions.filter(
        it => !selectedDeliveries.find(d => d.id === it.reception?.id)
      );
    });
    const newLotNumber = this.pickHighestLotNumber(selectedDeliveries);

    // now build a new "lot" Item with all selected deliveries
    const newLot: Item = {
      type: 'lot',
      lotNumber: newLotNumber,    // your logic to pick a new lot ID
      receptions: selectedDeliveries
    };

    // add it back to unassigned (or to lots column if you have one)
    this.unassignedReceptions.push(newLot);

    // rebuild drop-list IDs so this new lot can also accept merges if you like:
    this.buildDropListIds();
  }

  loadReceptions(): void {
    this.deliveryService.getAllDeliveriesList().subscribe({
      next: (response) => {
        const deliveries: UnifiedDelivery[] = Array.isArray(response.data)
          ? response.data
          : [response.data];

        this.unassignedReceptions = deliveries.map((delivery) => ({
          type: 'reception',
          reception: delivery
        }));
      },
      error: (err) => console.error('Error loading deliveries:', err)
    });
  }
  /**
   * Given an array of UnifiedDelivery, each of which
   * has either `lotNumber` or (fallback) `id`, parse
   * out the numeric value, and return the highest one
   * as a string.
   */
  private pickHighestLotNumber(deliveries: UnifiedDelivery[]): string {
    const nums = deliveries
      .map(d => {
        // assume d.lotNumber is a string of digits, else fallback to d.id
        const raw = d.lotNumber ?? d.id;
        const parsed = parseInt(raw, 10);
        return isNaN(parsed) ? 0 : parsed;
      });

    const max = nums.length ? Math.max(...nums) : 0;
    return max.toString();
  }

  filterReceptions(raw: string): void {
    const value = raw?.trim().toLowerCase();
    this.unassignedReceptions = this.unassignedReceptions.filter((item) => {
      if (!value) {
        return true;
      }
      if (item.type === 'reception') {
        return item.reception!.id.toLowerCase().includes(value);
      }
      return item.lotNumber!.toLowerCase().includes(value);
    });
  }
  drop(event: CdkDragDrop<Item[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }
  }

  openLotModal(): void {
    this.selectedReceptions = [];
    this.newLotNumber = '';
    this.dialog.open(this.lotDialog);
  }

  closeLotModal(): void {
    this.dialog.closeAll();
  }

  onSelectionChange(event: any): void {
    this.selectedReceptions = event.source.selectedOptions.selected.map((option: any) => option.value);
  }

  createLot(): void {
    const receptionsToGroup = this.selectedReceptions.filter((item) => item.type === 'reception');
    if (receptionsToGroup.length === 0 || !this.newLotNumber) return;

    const lot: Item = {
      type: 'lot',
      lotNumber: this.newLotNumber,
      receptions: receptionsToGroup.map((item) => item.reception!)
    };

    this.unassignedReceptions = this.unassignedReceptions.filter((item) => !receptionsToGroup.includes(item));
    this.unassignedReceptions.push(lot);

    this.closeLotModal();
  }

  savePlan(): void {
    const payload = {
      mills: this.mills.map((mill) => ({
        name: mill.name,
        receptions: mill.receptions.map((item) => ({
          type: item.type,
          receptionId: item.type === 'reception' ? item.reception?.id : undefined,
          lotNumber: item.type === 'lot' ? item.lotNumber : undefined,
          receptionIds: item.type === 'lot' ? item.receptions?.map((r) => r.id) : undefined
        }))
      }))
    };

    console.log('Saving plan:', payload);
    // TODO: Call PlanningService to save the plan
  }

  cancelPlan(): void {
    this.unassignedReceptions = [];
    this.mills.forEach((mill) => (mill.receptions = []));
    this.loadReceptions();
  }

  get totalAssigned(): number {
    return this.mills.reduce((sum, mill) => sum + mill.receptions.length, 0);
  }
}
