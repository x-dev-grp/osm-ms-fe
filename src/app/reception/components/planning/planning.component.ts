import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CdkDragDrop, CdkDragEnter, CdkDragMove, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UnifiedDeliveryService } from '../../../shared/services/delivery.service';
import { UnifiedDelivery } from '../../../shared/models/UnifiedDelivery';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../@theme/components/card/card.component';
import { BreakpointObserver } from '@angular/cdk/layout';
import { debounceTime, Subject } from 'rxjs';
import { MillMachineService } from '../../../shared/services/mill-machine.service';
import { PlanningItem } from '../../../shared/models/planning-item.model';
import { MillMachine } from '../../../shared/models/millMachine';
import { LotCreationData } from './lot-creation-dialog/lot-creation-dialog.component';
import { Dialog } from '@angular/cdk/dialog';
import { PlanningSaveRequest, PlanningSaveResponse } from '../../../shared/models/planning-save.dto';
import { PlanningService } from '../../../shared/services/planning.service';
import { MatChip, MatChipRow } from '@angular/material/chips';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatExpansionPanel, MatExpansionPanelDescription, MatExpansionPanelHeader } from '@angular/material/expansion';
import { SharedModule } from '../../../demo/shared/shared.module';

interface BoardItem {
  type: 'reception';
  data: PlanningItem;
}

export interface GlobalLot {
  id?: string;
  number: string;                 // the global-lot number
  millMachineId?: string;
  totalKg: number;
  receptionIds: string[];
  childLotNumbers: string[];
}

type Mill = MillMachine & { receptions: BoardItem[] };

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
    DragDropModule,
    CommonModule,
    FormsModule,
    CardComponent,
    MatSnackBarModule,SharedModule,CommonModule,
    MatChip,
    MatChipRow,
    MatCheckbox,
    MatExpansionPanelDescription,
    MatExpansionPanelHeader,
    MatExpansionPanel
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlanningComponent implements OnInit, AfterViewInit {
  unassignedReceptions: BoardItem[] = [];
  filteredReceptions: BoardItem[] = [];
  mills: Mill[] = [];
  isDesktop = true;
  private filterSubject = new Subject<string>();
  connectedDropLists: string[] = [];
  selection: Record<string, boolean> = {};
  /* ---------- autoscroll constants ---------- */
  private readonly autoScrollPadding = 80; // px from edge to trigger scroll
  private readonly autoScrollSpeed = 1; // px per frame
  /* ---------- template reference ---------- */
  @ViewChild('scrollContainer', { static: true, read: ElementRef })
  private scrollContainer!: ElementRef<HTMLElement>;

  constructor(
    private deliveryService: UnifiedDeliveryService,
    private millService: MillMachineService,
    private bp: BreakpointObserver,
    private cdr: ChangeDetectorRef,
    private planningService: PlanningService,
    private snackBar: MatSnackBar,
    private dialog: Dialog
  ) {}

  selectedIds(): string[] {
    return Object.keys(this.selection).filter((id) => this.selection[id]);
  }

  hasSelection(): boolean {
    return this.selectedIds().length > 0;
  }
  get totalAssigned(): number {
    return this.mills.reduce((sum, mill) => sum + mill.receptions.length, 0);
  }

  /* ---------- new handler ---------- */
  onDragMove(event: CdkDragMove): void {
    const scroller = this.scrollContainer.nativeElement;
    const { x: pointerX } = event.pointerPosition; // ✅ use x here
    const { left, right } = scroller.getBoundingClientRect();

    // scroll left
    if (pointerX - left < this.autoScrollPadding && scroller.scrollLeft > 0) {
      scroller.scrollLeft -= this.autoScrollSpeed;
    }
    // scroll right
    else if (right - pointerX < this.autoScrollPadding && scroller.scrollLeft < scroller.scrollWidth - scroller.clientWidth) {
      scroller.scrollLeft += this.autoScrollSpeed;
    }
  }
  ngOnInit(): void {
    this.bp.observe('(min-width: 1024px)').subscribe((r) => {
      this.isDesktop = r.matches;
      this.cdr.markForCheck();
    });

    this.filterSubject.pipe(debounceTime(300)).subscribe((value) => {
      this.applyFilter(value);
    });

    this.loadMills();
    this.loadReceptions();
  }

  ngAfterViewInit(): void {
    this.refreshConnectedDropLists();
  }

  drop(event: CdkDragDrop<BoardItem[]>): void {
    console.log('[DND] Drop event:', {
      previousContainerId: event.previousContainer.id,
      containerId: event.container.id,
      previousIndex: event.previousIndex,
      currentIndex: event.currentIndex,
      item: event.item.data,
      destArrayLength: event.container.data.length,
      destMill: this.millByDropId(event.container.id)?.name || 'unassigned'
    });

    const srcItem = event.item.data as BoardItem;
    const destArray = event.container.data as BoardItem[];
    const srcArray = event.previousContainer.data as BoardItem[];
    const destMill = this.millByDropId(event.container.id);

    /* ---- 1. Same-list re-order ---- */
    if (event.previousContainer === event.container) {
      moveItemInArray(destArray, event.previousIndex, event.currentIndex);
    } else {
      /* ---- 2. Transfer between lists ---- */
      // Validate mill capacity if moving to a mill
      if (destMill) {
        const remainingCapacity = this.getMillRemainingCapacity(destMill);
        const itemQuantity = srcItem.data.oliveQuantity;

        if (itemQuantity > remainingCapacity) {
          this.snackBar.open(`Cannot assign to ${destMill.name}: Exceeds remaining capacity (${remainingCapacity} kg).`, 'Close', {
            duration: 5000
          });
          return;
        }
      }

      try {
        const adjustedIndex = Math.min(event.currentIndex, destArray.length);
        transferArrayItem(srcArray, destArray, event.previousIndex, adjustedIndex);

        // Assign millMachineId
        srcItem.data.millMachineId = destMill?.id;

        // Update unassigned receptions
        if (event.previousContainer.id === 'unassigned-list') {
          this.unassignedReceptions = this.unassignedReceptions.filter((i) => i !== srcItem);
        }
      } catch (err) {
        console.error('[DND] Transfer failed:', err);
        this.snackBar.open('Failed to move item. Please try again.', 'Close', { duration: 3000 });
        return;
      }
    }

    this.logCurrentState();
    this.cdr.markForCheck();
  }

  onSelectChange(item: BoardItem): void {
    console.debug('[select] id:', item.data.id, 'checked:', this.selection[item.data.id]);
  }

  onDropListEntered(event: CdkDragEnter<BoardItem[]>): void {
    console.log('[DND] Entered drop list:', {
      containerId: event.container.id,
      item: event.item.data
    });
  }

  filterReceptions(raw: string): void {
    this.filterSubject.next(raw);
  }

  groupSelected(): void {
    const ids = this.selectedIds();

    // 1️⃣ Collect the board items
    const items: BoardItem[] = [];
    this.mills.forEach((m) =>
      m.receptions.forEach((r) => {
        if (ids.includes(r.data.id)) items.push(r);
      })
    );
    this.unassignedReceptions.filter((r) => ids.includes(r.data.id)).forEach((r) => items.push(r));

    // 2️⃣ Enforce “same mill” rule
    const millIds = new Set(items.map((i) => (i.data as PlanningItem).millMachineId ?? 'UNASSIGNED'));
    if (millIds.size !== 1) {
      this.snackBar.open('All selected receptions must be in the same column.', 'Close', { duration: 4000 });
      return;
    }
    const millMachineId = [...millIds][0] === 'UNASSIGNED' ? undefined : [...millIds][0];

    // 3️⃣ Send to back-end
    const req = { millMachineId, receptionIds: ids };
    console.log('req ' + req);
  }

  onDragStart(event: any): void {
    event.source.element.nativeElement.setAttribute('aria-grabbed', 'true');
    this.cdr.detectChanges();
  }

  onDragEnd(event: any): void {
    event.source.element.nativeElement.setAttribute('aria-grabbed', 'false');
    // Restore responsive state
    this.bp.observe('(min-width: 1024px)').subscribe((r) => {
      this.isDesktop = r.matches;
      this.cdr.markForCheck();
    });
  }

  trackByItem(_: number, item: BoardItem): string {
    return item.data.id;
  }

  savePlan(): void {
    const request: PlanningSaveRequest = {
      mills: this.mills.map((m) => ({
        millMachineId: m.id!,
        receptionIds: m.receptions.map((r) => r.data.id)
      }))
    };

    this.planningService.save(request).subscribe({
      next: (res) => this.handleSaveSuccess(res),
      error: () => this.snackBar.open('Save failed', 'Close', { duration: 4000 })
    });
  }

  cancelPlan(): void {
    this.unassignedReceptions = [];
    this.filteredReceptions = [];
    this.mills.forEach((mill) => (mill.receptions = []));
    this.loadReceptions();
  }

  getMillUsedCapacity(mill: Mill): number {
    return mill.receptions.reduce((sum, item) => sum + item.data.oliveQuantity, 0);
  }

  getMillRemainingCapacity(mill: Mill): number {
    return (mill.capacity ?? 1000) - this.getMillUsedCapacity(mill);
  }

  getMillCapacityClass(mill: Mill): string {
    const used = this.getMillUsedCapacity(mill);
    const capacity = mill.capacity ?? 1000;
    const percentage = (used / capacity) * 100;

    if (used >= capacity) {
      return 'at-capacity';
    } else if (percentage > 80) {
      return 'near-capacity';
    }
    return '';
  }

  // planning.component.ts
  toPlanningItem(d: UnifiedDelivery): PlanningItem {
    return {
      id: d.id || `temp-${Date.now()}`,
      lotNumber: d.lotNumber ?? d.id ?? `LOT-${Date.now()}`,
      deliveryDate: new Date(d.deliveryDate!), // Ensure Date type
      millMachineId: undefined, // Set during drag-and-drop
      deliveryNumber: d.deliveryNumber,
      oliveQuantity: d.poidsNet ?? 0 // Required
    };
  }

  private handleSaveSuccess(res: PlanningSaveResponse): void {
    /* 1️⃣  Annotate each board item with the lot that was just created */
    res.globalLots.forEach((gl) => {
      gl.receptionIds.forEach((rid) => {
        const item = this.findItemById(rid);
        if (item) item.data.globalLotNumber = gl.number;
      });
    });

    /* 2️⃣  Visual feedback */
    this.snackBar.open(`${res.globalLots.length} global lot(s) created successfully`, 'Close', { duration: 4000 });

    /* 3️⃣  Refresh colours / badges */
    this.cdr.markForCheck();
  }

  private findItemById(id: string): BoardItem | undefined {
    return this.unassignedReceptions.find((i) => i.data.id === id) ?? this.mills.flatMap((m) => m.receptions).find((i) => i.data.id === id);
  }

  // planning.component.ts
  private loadMills(): void {
    this.millService.getAllMillMachines().subscribe({
      next: (machines) => {
        this.mills = machines.map((m) => ({
          ...m,
          receptions: [],
          capacity: m.capacity ?? 1000 // Default to 1000 kg
        }));
        this.refreshConnectedDropLists();
        console.log('[MILLS] Loaded:', this.mills);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading mills:', err);
        this.snackBar.open('Failed to load mills. Please try again.', 'Close', {
          duration: 3000
        });
      }
    });
  }

  private loadReceptions(): void {
    this.deliveryService.getAllDeliveriesList().subscribe({
      next: (response) => {
        const deliveries: UnifiedDelivery[] = Array.isArray(response.data) ? response.data : [response.data];

        this.unassignedReceptions = deliveries.map((delivery) => ({
          type: 'reception',
          data: this.toPlanningItem(delivery)
        }));

        this.filteredReceptions = [...this.unassignedReceptions];
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading deliveries:', err);
        this.snackBar.open('Failed to load receptions. Please try again.', 'Close', {
          duration: 3000
        });
      }
    });
  }

  private applyFilter(value: string): void {
    const search = value?.trim().toLowerCase() ?? '';
    this.filteredReceptions = search
      ? this.unassignedReceptions.filter(
          (item) => item.data.id.toLowerCase().includes(search) || item.data.lotNumber.toLowerCase().includes(search)
        )
      : [...this.unassignedReceptions];
    this.cdr.markForCheck();
  }

  private millByDropId(listId: string): Mill | undefined {
    if (listId === 'unassigned-list') return undefined;
    const match = listId.match(/mill-list-(\d+)/);
    if (!match) {
      console.warn('[DND] Invalid mill list ID:', listId);
      return undefined;
    }
    const idx = Number(match[1]);
    const mill = this.mills[idx];
    if (!mill) {
      console.warn('[DND] Mill not found for index:', idx);
    }
    return mill;
  }

  private refreshConnectedDropLists(): void {
    this.connectedDropLists = ['unassigned-list', ...this.mills.map((_, i) => `mill-list-${i}`)];
    console.log('[DND] Connected drop lists:', this.connectedDropLists);
    this.cdr.markForCheck();
  }

  private logCurrentState(): void {
    console.group('🛠 Current planning');
    console.table(
      this.mills.map((m) => ({
        mill: m.name,
        receptions: m.receptions.map((r) => r.data.lotNumber).join(', ')
      }))
    );
    console.groupEnd();
  }

  private createLot(lotData: LotCreationData): void {
    const newDelivery: any = {
      id: `temp-${Date.now()}`,
      lotNumber: lotData.lotNumber,
      deliveryDate: lotData.deliveryDate,
      deliveryNumber: lotData.deliveryNumber,
      oliveQuantity: lotData.oliveQuantity,
      deliveryType: 'REGULAR', // Default
      status: 'PENDING', // Default
      qualityControlResults: [], // Required
      globalLotNumber: `GLOT-${Date.now()}` // Optional, auto-generated if needed
    };

    this.deliveryService.updateDelivery(newDelivery).subscribe({
      next: (createdDelivery) => {
        const newItem: BoardItem = {
          type: 'reception',
          data: this.toPlanningItem(createdDelivery.data[0])
        };
        this.unassignedReceptions.push(newItem);
        this.filteredReceptions = [...this.unassignedReceptions];
        this.cdr.markForCheck();
        this.snackBar.open('Olive lot created successfully!', 'Closematically generated if needed', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error creating lot:', err);
        let errorMessage = 'Failed to create lot. Please try again.';
        if (err.status === 400 && err.error?.message) {
          errorMessage = err.error.message;
        }
        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
      }
    });
  }
}
