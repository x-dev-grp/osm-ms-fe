import { Component, OnInit, TemplateRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UnifiedDeliveryService } from '../../../shared/services/delivery.service';
import { UnifiedDelivery } from '../../../shared/models/UnifiedDelivery';

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
import { debounceTime, Subject } from 'rxjs';
import { Pipe, PipeTransform } from '@angular/core';
import { MatSelectionListChange } from '@angular/material/list';
import { MillMachineService } from '../../../shared/services/mill-machine.service';

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

@Pipe({ name: 'filterByType', standalone: true })
export class FilterByTypePipe implements PipeTransform {
  transform(items: Item[], type: string): Item[] {
    return items.filter((item) => item.type === type);
  }
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
    CardComponent,
    MatSnackBarModule,
    FilterByTypePipe
  ]
})
export class PlanningComponent implements OnInit {
  unassignedReceptions: Item[] = [];
  filteredReceptions: Item[] = [];
  mills: Mill[] = [];
  newLotNumber: string = '';
  selectedReceptions: Item[] = [];
   isDesktop = true;
  private filterSubject = new Subject<string>();

  @ViewChild('lotDialog') lotDialog!: TemplateRef<never>;

  constructor(
    private deliveryService: UnifiedDeliveryService,
    private millService: MillMachineService,
    // private planningService: PlanningService,
    private dialog: MatDialog,
    private bp: BreakpointObserver,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {}

  get totalAssigned(): number {
    return this.mills.reduce((sum, mill) => sum + mill.receptions.length, 0);
  }

  ngOnInit(): void {
    this.bp.observe('(min-width: 1024px)').subscribe((r) => {
      this.isDesktop = r.matches;
      this.cdr.detectChanges();
    });
    this.filterSubject.pipe(debounceTime(300)).subscribe((value) => {
      this.applyFilter(value);
    });
    this.loadMills();
    this.loadReceptions();
  }

  private loadMills(): void {
    this.millService.getAllMillMachines().subscribe({
      next: (mills) => {
        this.mills = mills.map((mill) => ({ name: mill.name, receptions: [] }));
       },
      error: (err) => {
        console.error('Error loading mills:', err);
        this.snackBar.open('Failed to load mills. Please try again.', 'Close', { duration: 3000 });
      }
    });
  }

  loadReceptions(): void {
    this.deliveryService.getAllDeliveriesList().subscribe({
      next: (response) => {
        const deliveries: UnifiedDelivery[] = Array.isArray(response.data) ? response.data : [response.data];
        this.unassignedReceptions = deliveries.map((delivery) => ({
          type: 'reception',
          reception: delivery
        }));
        this.filteredReceptions = [...this.unassignedReceptions];
       },
      error: (err) => {
        console.error('Error loading deliveries:', err);
        this.snackBar.open('Failed to load receptions. Please try again.', 'Close', { duration: 3000 });
      }
    });
  }

  filterReceptions(raw: string): void {
    this.filterSubject.next(raw);
  }

  private applyFilter(value: string): void {
    const search = value?.trim().toLowerCase() ?? '';
    this.filteredReceptions = search
      ? this.unassignedReceptions.filter((item) => {
        if (item.type === 'reception' && item.reception) {
          return item.reception.id.toLowerCase().includes(search);
        }
        if (item.type === 'lot' && item.lotNumber) {
          return item.lotNumber.toLowerCase().includes(search);
        }
        return false;
      })
      : [...this.unassignedReceptions];
  }

  drop(event: CdkDragDrop<Item[]>): void {
    const srcItem: Item = event.item.data;
    const destArray: Item[] = event.container.data;
    const destItem: Item | undefined = destArray[event.currentIndex];

    // ── 1. Same list → reorder
    if (event.previousContainer === event.container) {
      moveItemInArray(destArray, event.previousIndex, event.currentIndex);
    }
    // ── 2. Reception dropped onto another reception-olive → create global lot
    else if (srcItem.type === 'reception' && destItem?.type === 'reception') {
      this.createGlobalLot([srcItem.reception!, destItem.reception!]);
    }
    // ── 3. Move reception-olive between lists
    else if (srcItem.type === 'reception') {
      transferArrayItem(
        event.previousContainer.data,
        destArray,
        event.previousIndex,
        event.currentIndex
      );
    }
    // ── 4. Block dragging complete lots to a mill
    else {
      this.snackBar.open('Lots cannot be dragged to mills directly.', 'Close', { duration: 3000 });
      return;
    }

    // Refresh lists and UI
    this.filteredReceptions = [...this.unassignedReceptions];
     this.cdr.detectChanges();
  }

  openLotModal(): void {
    this.selectedReceptions = [];
    this.newLotNumber = '';
    this.dialog.open(this.lotDialog);
  }

  closeLotModal(): void {
    this.dialog.closeAll();
  }

  onSelectionChange(event: MatSelectionListChange): void {
    this.selectedReceptions = event.options
      .filter((option) => option.selected)
      .map((option) => option.value as Item)
      .filter((item) => item.type === 'reception');
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
    this.filteredReceptions = [...this.unassignedReceptions];
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

    // this.planningService.savePlan(payload).subscribe({
    //   next: () => this.snackBar.open('Plan saved successfully!', 'Close', { duration: 3000 }),
    //   error: (err) => this.snackBar.open('Failed to save plan. Please try again.', 'Close', { duration: 3000 })
    // });
  }

  cancelPlan(): void {
    this.unassignedReceptions = [];
    this.filteredReceptions = [];
    this.mills.forEach((mill) => (mill.receptions = []));
    this.loadReceptions();
   }

  /** Recompute the list of drop-list IDs so every list can talk to every other list */


  private createGlobalLot(selectedDeliveries: UnifiedDelivery[]): void {
    this.unassignedReceptions = this.unassignedReceptions.filter(
      (it) => !selectedDeliveries.find((d) => d.id === it.reception?.id)
    );
    this.mills.forEach((mill) => {
      mill.receptions = mill.receptions.filter(
        (it) => !selectedDeliveries.find((d) => d.id === it.reception?.id)
      );
    });
    const newLotNumber = this.pickHighestLotNumber(selectedDeliveries);

    const newLot: Item = {
      type: 'lot',
      lotNumber: newLotNumber,
      receptions: selectedDeliveries
    };

    this.unassignedReceptions.push(newLot);
    this.filteredReceptions = [...this.unassignedReceptions];
   }

  private pickHighestLotNumber(deliveries: UnifiedDelivery[]): string {
    const nums = deliveries.map((d) => {
      const raw = d.lotNumber ?? d.id;
      const parsed = parseInt(raw, 10);
      return isNaN(parsed) ? 0 : parsed;
    });

    const max = nums.length ? Math.max(...nums) : 0;
    return max.toString();
  }

  onDragStart(event: any): void {
    event.source.element.nativeElement.setAttribute('aria-grabbed', 'true');
  }

  onDragEnd(event: any): void {
    event.source.element.nativeElement.setAttribute('aria-grabbed', 'false');
  }
}
