// planning.component.ts
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  CdkDragDrop,
  CdkDragEnter,
  CdkDragMove,
  DragDropModule,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {UnifiedDeliveryService} from '../../../shared/services/delivery.service';
import {UnifiedDelivery} from '../../../shared/models/UnifiedDelivery';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {CardComponent} from '../../../@theme/components/card/card.component';
import {BreakpointObserver} from '@angular/cdk/layout';
import {debounceTime, filter, map, Observable, Subject} from 'rxjs';
import {MillMachineService} from '../../../shared/services/mill-machine.service';
import {MillMachine} from '../../../shared/models/millMachine';
import {MatDialog} from '@angular/material/dialog';
import {MatChip, MatChipRow} from '@angular/material/chips';
import {MatCheckbox} from '@angular/material/checkbox';
import {MatExpansionPanel, MatExpansionPanelDescription, MatExpansionPanelHeader} from '@angular/material/expansion';
import {SharedModule} from '../../../demo/shared/shared.module';
import {DialogModule} from '@angular/cdk/dialog';
import {PlanningService} from '../../../shared/services/planning.service';
// import { ConfirmDialogComponent } from '../../../shared/component/confirm-dialog/confirm-dialog.component';

// Interfaces
export interface BoardItem {
  type: PlanItemType;
  data: PlanningItem | GlobalLot;
}

export interface PlanningItem {
  completed?: boolean; // Added to track completion status
  id: string;
  lotNumber: string;
  deliveryDate: Date;
  millMachineId?: string;
  deliveryNumber?: string;
  oliveQuantity: number;
  globalLotNumber?: string | null | undefined;
}

export interface GlobalLot {
  id?: string;
  globalLotNumber: string;
  millMachineId?: string;
  totalKg: number;
  childLotNumbers: string[];
  receptionIds: string[];
  items: BoardItem[];
  completed?: boolean; // Added to track completion status

}

export interface GlobalLotGroup {
  globalLotNumber: string | null;
  items: BoardItem[];
}

export enum PlanItemType {
  LOT = 'LOT',
  GLOBAL_LOT = 'GLOBAL_LOT'
}

export interface PlanItemDTO {
  type: PlanItemType;
  id: string;
  lot?: LotDTO;
}

export interface MillPlanDTO {
  millMachineId: string;
  items: PlanItemDTO[];
}

export interface LotDTO {
  lotNumber: string;
  oliveQuantity: number;
  deliveryDate: string;
  millMachineId?: string;
  globalLotNumber?: string | null;
  completed?: boolean; // Added to track completion status

}

export interface GlobalLotDTO {
  globalLotNumber: string;
  totalKg: number;
  lots: LotDTO[];
  completed?: boolean; // Added to track completion status

}

export interface PlanningSaveRequest {
  mills: MillPlanDTO[];
  globalLots: GlobalLotDTO[];
}

export type Mill = MillMachine & { receptions: BoardItem[] };
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
    MatSnackBarModule,
    SharedModule,
    MatChip,
    MatChipRow,
    MatCheckbox,
    MatExpansionPanelDescription,
    MatExpansionPanelHeader,
    MatExpansionPanel,
    DialogModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlanningComponent implements OnInit, OnDestroy ,AfterViewInit {
  unassignedReceptions: BoardItem[] = [];
  filteredReceptions: BoardItem[] = [];
  mills: Mill[] = [];
  globalLots: GlobalLot[] = [];
  isDesktop = true;
  connectedDropLists: string[] = [];
  selection: Record<string, boolean> = {};
  private filterSubject = new Subject<string>();
  private readonly autoScrollPadding = 80;
  private readonly autoScrollSpeed = 100;
  @ViewChild('scrollContainer', { static: true, read: ElementRef }) private scrollContainer!: ElementRef<HTMLElement>;
  readonly LOT = PlanItemType.LOT;
  readonly GLOBAL_LOT = PlanItemType.GLOBAL_LOT;
  isFullScreen = false;
  dirty        = false;                // tracks unsaved edits

  private destroy$ = new Subject<void>();
  constructor(
    private deliveryService: UnifiedDeliveryService,
    private millService: MillMachineService,
    private bp: BreakpointObserver,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
     private planningService: PlanningService
  ) {}
  ngOnDestroy(): void {
    this.destroy$.next(); this.destroy$.complete();
  }
  get totalAssigned(): number {
    return this.mills.reduce((sum, mill) => {
      return (
        sum +
        mill.receptions.reduce((count, item) => {
          if (item.type === PlanItemType.LOT) {
            return count + 1;
          } else {
            return count + (item.data as GlobalLot).receptionIds.length;
          }
        }, 0)
      );
    }, 0);
  }

  hasSelection(): boolean {
    return this.selectedIds().length > 0;
  }

  selectedIds(): string[] {
    return Object.keys(this.selection).filter((id) => {
      const item = this.findItemById(id);
      return item && item.type === PlanItemType.LOT;
    });
  }
  savePlan(): void {
    this.confirm('Save this planning ?')
      .pipe(filter(ok => ok))
      .subscribe(() => {
        this._savePlan();      // the old body moved to a private method
        this.dirty = false;
      });
  }

  groupSelected(): void {
    this.confirm('Group selected lots ?')
      .pipe(filter(ok => ok))
      .subscribe(() => {
        this._groupSelected(); // old logic here
        this.dirty = true;
      });
  }

  ungroupLot(gl: GlobalLot): void {     // called from the menu
    this.confirm(`Ungroup global lot ${gl.globalLotNumber} ?`)
      .pipe(filter(ok => ok))
      .subscribe(() => {
        this._ungroupLot(gl);  // old logic here
        this.dirty = true;
      });
  }
  getGlobalLotGroups(items: BoardItem[]): GlobalLotGroup[] {
    const groups: { [key: string]: BoardItem[] } = {};
    items.forEach((item) => {
      const key = item.type === PlanItemType.LOT ? (item.data as PlanningItem).globalLotNumber || 'ungrouped' : (item.data as GlobalLot).globalLotNumber;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return Object.entries(groups).map(([globalLotNumber, items]) => ({
      globalLotNumber: globalLotNumber === 'ungrouped' ? null : globalLotNumber,
      items
    }));
  }

  onDragMove(event: CdkDragMove): void {
    this.dirty = true;
    const scroller = this.scrollContainer.nativeElement;
    const { x: pointerX } = event.pointerPosition;
    const { left, right } = scroller.getBoundingClientRect();
    if (pointerX - left < this.autoScrollPadding && scroller.scrollLeft > 0) {
      scroller.scrollLeft -= this.autoScrollSpeed;
    } else if (right - pointerX < this.autoScrollPadding && scroller.scrollLeft < scroller.scrollWidth - scroller.clientWidth) {
      scroller.scrollLeft += this.autoScrollSpeed;
    }
  }
  private confirm(message: string): Observable<boolean> {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { message }
    });
    return ref.afterClosed().pipe(map(Boolean));
  }
  ngOnInit(): void {
    this.bp.observe('(min-width: 1024px)').subscribe((r) => {
      this.isDesktop = r.matches;
      this.cdr.markForCheck();
    });
    this.filterSubject.pipe(debounceTime(300)).subscribe((value) => {
      this.applyFilter(value);
    });

     this.loadPlanning(); // Fetch planning from backend
  }

  ngAfterViewInit(): void {
    this.refreshConnectedDropLists();
  }

  drop(event: CdkDragDrop<BoardItem[]>): void {
    this.dirty = true;

    /* 0 ─ context ----------------------------------------------------------- */
    const srcItem  = event.item.data as BoardItem;
    const srcArray = event.previousContainer.data as BoardItem[];

    const intoUnassigned = event.container.id === 'unassigned-list';
    const destMill       = this.millByDropId(event.container.id);
    const destArray      = intoUnassigned
      ? this.unassignedReceptions              // always the real array
      : (event.container.data as BoardItem[]);

    /* 1 ─ just re-order inside same column ---------------------------------- */
    if (event.previousContainer === event.container) {
      moveItemInArray(destArray, event.previousIndex, event.currentIndex);
      return;
    }

    /* 2 ─ payload & kg ------------------------------------------------------ */
    let itemsToMove: BoardItem[] = [srcItem];
    let totalKg = 0;

    if (srcItem.type === PlanItemType.LOT) {
      totalKg = (srcItem.data as PlanningItem).oliveQuantity;
    } else {                             // GLOBAL_LOT
      const gl = srcItem.data as GlobalLot;
      itemsToMove = [srcItem, ...gl.items];      // ★ include parent too
      totalKg     = gl.totalKg;
    }

    /* 3 ─ capacity check ---------------------------------------------------- */
    if (destMill) {
      const remaining = this.getMillRemainingCapacity(destMill);
      if (totalKg > remaining) {
        this.snackBar.open(
          `Cannot assign to ${destMill.name}: exceeds ${remaining} kg left.`,
          undefined, { duration: 4500 }
        );
        return;
      }
    }

    /* 4 ─ transfer ---------------------------------------------------------- */
    const idxTarget = Math.min(event.currentIndex, destArray.length);
    transferArrayItem(srcArray, destArray, event.previousIndex, idxTarget);

    /* 5 ─ mutate models ----------------------------------------------------- */
    if (srcItem.type === PlanItemType.GLOBAL_LOT) {
      const gl = srcItem.data as GlobalLot;
      gl.millMachineId = destMill ? destMill.id : '';
      this.globalLots = this.globalLots.map(g =>
        g.globalLotNumber === gl.globalLotNumber ? { ...g, millMachineId: gl.millMachineId } : g
      );
      gl.items.forEach(it => (it.data as PlanningItem).millMachineId = destMill ? destMill.id : '');
    } else {
      (srcItem.data as PlanningItem).millMachineId = destMill ? destMill.id : '';
    }

    /* 6 ─ keep Un-assigned source-of-truth in sync -------------------------- */
    if (event.previousContainer.id === 'unassigned-list') {
      this.unassignedReceptions =
        this.unassignedReceptions.filter(i => !itemsToMove.includes(i));
    }
    if (intoUnassigned) {
      this.filteredReceptions = [...this.unassignedReceptions];
    }

    /* 7 ─ refresh ----------------------------------------------------------- */
    this.cdr.markForCheck();
  }
  @HostListener('window:beforeunload', ['$event'])
  _unload($event: BeforeUnloadEvent): void {
    if (this.dirty) {
      $event.preventDefault();
      $event.returnValue = '';
    }
  }

  onSelectChange(item: BoardItem): void {
    if (item.type === PlanItemType.LOT) {
      const id = (item.data as PlanningItem).id;
      console.debug('[select] id:', id, 'checked:', this.selection[id]);
    }
  }

  onDropListEntered(event: CdkDragEnter<BoardItem[]>): void {
    console.log('[DND] Entered drop list:', {
      containerId: event.container.id,
      item: event.item.data
    });
  }


  _groupSelected(): void {
    const ids = this.selectedIds();
    if (!ids.length) {
      this.snackBar.open('Please select at least one reception to group.', 'Close', { duration: 4000 });
      return;
    }

    // 1) Collect matching items and remember their original container/indices
    const itemsToGroup: { item: BoardItem; container: BoardItem[]; index: number }[] = [];
    for (const mill of this.mills) {
      mill.receptions.forEach((r, idx) => {
        if (r.type === PlanItemType.LOT && ids.includes((r.data as PlanningItem).id)) {
          itemsToGroup.push({ item: r, container: mill.receptions, index: idx });
        }
      });
    }
    this.unassignedReceptions.forEach((r, idx) => {
      if (r.type === PlanItemType.LOT && ids.includes((r.data as PlanningItem).id)) {
        itemsToGroup.push({ item: r, container: this.unassignedReceptions, index: idx });
      }
    });

    // 2) Ensure all in same column
    const millsInvolved = new Set(itemsToGroup.map((o) => (o.item.data as PlanningItem).millMachineId ?? 'UNASSIGNED'));
    if (millsInvolved.size > 1) {
      this.snackBar.open('All selected receptions must be in the same column.', 'Close', { duration: 4000 });
      return;
    }
    const millMachineId = [...millsInvolved][0] === 'UNASSIGNED' ? undefined : [...millsInvolved][0];

    // 3) Compute new lot number
    const lotNumbers = itemsToGroup.map((o) => (o.item.data as PlanningItem).lotNumber);
    const largestLot = lotNumbers.reduce((max, cur) => {
      const n1 = parseInt(max, 10),
        n2 = parseInt(cur, 10);
      return n2 > n1 ? cur : max;
    }, lotNumbers[0]);
    const globalLotNumber = `G${largestLot.padStart(4, '0')}`; // Ensure format matches backend validation

    // 4) Build the GlobalLot
    const globalLot: GlobalLot = {
      id: globalLotNumber, // Generate a unique ID
      globalLotNumber: globalLotNumber,
      millMachineId,
      totalKg: itemsToGroup.reduce((sum, o) => sum + (o.item.data as PlanningItem).oliveQuantity, 0),
      receptionIds: ids,
      childLotNumbers: lotNumbers,
      items: itemsToGroup.map((o) => o.item)
    };

    // 5) Remove each original from its container
    itemsToGroup.forEach(({ container, item }) => {
      const idx = container.indexOf(item);
      if (idx >= 0) container.splice(idx, 1);
    });

    // 6) Insert the new "global-lot" card
    const globalLotItem: BoardItem = { type: PlanItemType.GLOBAL_LOT, data: globalLot };
    if (millMachineId) {
      const mill = this.mills.find((m) => m.id === millMachineId)!;
      mill.receptions.push(globalLotItem);
    } else {
      this.unassignedReceptions.push(globalLotItem);
    }

    // 7) Tag each PlanningItem so UI can show it grouped
    itemsToGroup.forEach((o) => {
      (o.item.data as PlanningItem).globalLotNumber = globalLotNumber;
    });

    // 8) Reset UI state
    this.globalLots.push(globalLot);
    this.selection = {};
    this.filteredReceptions = [...this.unassignedReceptions];
    this.cdr.markForCheck();
    this.snackBar.open(`Global lot ${globalLotNumber} created successfully!`, 'Close', { duration: 4000 });
  }

  _ungroupLot(globalLot: GlobalLot): void {
    // 1) Find where the global-lot card sits
    const isUnassigned = this.unassignedReceptions.some((i) => i.type === PlanItemType.GLOBAL_LOT && (i.data as GlobalLot).globalLotNumber === globalLot.globalLotNumber);
    let list: BoardItem[];
    if (isUnassigned) {
      list = this.unassignedReceptions;
    } else {
      const mill = this.mills.find((m) => m.receptions.some((i) => i.type === PlanItemType.GLOBAL_LOT && (i.data as GlobalLot).globalLotNumber === globalLot.globalLotNumber));
      list = mill ? mill.receptions : [];
    }

    const glIdx = list.findIndex((i) => i.type === PlanItemType.GLOBAL_LOT && (i.data as GlobalLot).globalLotNumber === globalLot.globalLotNumber);
    if (glIdx < 0) {
      this.snackBar.open('Global lot not found.', 'Close', { duration: 4000 });
      return;
    }

    // Remove the global lot card
    list.splice(glIdx, 1);

    // 2) Drop it from our tracking list
    this.globalLots = this.globalLots.filter((gl) => gl.globalLotNumber !== globalLot.globalLotNumber);

    // 3) Rebuild the lists using the full deliveries list
    this.deliveryService.getAllDeliveriesList().subscribe({
      next: (deliveryResponse) => {
        const deliveries: UnifiedDelivery[] = Array.isArray(deliveryResponse.data) ? deliveryResponse.data : [deliveryResponse.data];

        // Get all assigned IDs (both LOT and GLOBAL_LOT items)
        const assignedIds = this.mills.flatMap((m) => m.receptions.map((r) =>
          r.type === PlanItemType.LOT ? (r.data as PlanningItem).id : (r.data as GlobalLot).receptionIds
        )).flat();

        // Rebuild unassigned receptions
        this.unassignedReceptions = deliveries
          .filter((d) => !assignedIds.includes(d.id || '') && !assignedIds.includes(d.lotNumber || ''))
          .map((delivery) => ({
            type: PlanItemType.LOT,
            data: this.toPlanningItem(delivery)
          }));

        // Update filtered receptions
        this.filteredReceptions = [...this.unassignedReceptions];

        // Update global lot items to ensure they reference the correct BoardItem objects
        this.globalLots.forEach((gl) => {
          gl.items = gl.receptionIds
            .map((rid) => this.unassignedReceptions.find((i) => (i.data as PlanningItem).id === rid) ||
              this.mills.flatMap((m) => m.receptions).find((i) => (i.data as PlanningItem).id === rid))
            .filter((item): item is BoardItem => item !== undefined);
        });

        // Reset UI state
        this.selection = {};
        this.refreshConnectedDropLists();
        this.cdr.markForCheck();
        this.snackBar.open(`Global lot ${globalLot.globalLotNumber} ungrouped successfully!`, 'Close', { duration: 4000 });
      },
      error: (err) => {
        console.error('Error rebuilding lists:', err);
        this.snackBar.open('Failed to rebuild lists. Please try again.', 'Close', { duration: 3000 });
      }
    });
  }
  cancelPlan(): void {
    this.loadPlanning(); // Reload planning from backend to reset
  }

  onDragStart(event: any): void {
    event.source.element.nativeElement.setAttribute('aria-grabbed', 'true');
    this.cdr.detectChanges();
  }

  onDragEnd(event: any): void {
    this.dirty = true;
    event.source.element.nativeElement.setAttribute('aria-grabbed', 'false');
    this.bp.observe('(min-width: 1024px)').subscribe((r) => {
      this.isDesktop = r.matches;
      this.cdr.markForCheck();
    });
  }
  toggleFullScreen(): void {
    const el = document.documentElement;

    if (!this.isFullScreen) {
      (el.requestFullscreen ||
        (el as any).webkitRequestFullscreen ||
        (el as any).mozRequestFullScreen ||
        (el as any).msRequestFullscreen).call(el);
    } else {
      (document.exitFullscreen ||
        (document as any).webkitExitFullscreen ||
        (document as any).mozCancelFullScreen ||
        (document as any).msExitFullscreen).call(document);
    }
  }

  /** Keep icon state in sync with user pressing Esc/F11 */
  @HostListener('document:fullscreenchange')
  onFsChange(): void {
    this.isFullScreen = !!document.fullscreenElement;
  }
  trackByItem(_: number, item: BoardItem): string {
    return item.type === PlanItemType.LOT ? (item.data as PlanningItem).id : (item.data as GlobalLot).globalLotNumber;
  }

  _savePlan(): void {
    console.log('[SavePlan] Mills before saving:', this.mills.map(m => ({
      id: m.id,
      receptions: m.receptions.map(r => ({
        type: r.type,
        id: r.type === PlanItemType.LOT ? (r.data as PlanningItem).lotNumber : (r.data as GlobalLot).globalLotNumber,
        millMachineId: r.type === PlanItemType.LOT ? (r.data as PlanningItem).millMachineId : (r.data as GlobalLot).millMachineId
      }))
    })));
    console.log('[SavePlan] Global lots before saving:', this.globalLots.map(gl => ({
      globalLotNumber: gl.globalLotNumber,
      millMachineId: gl.millMachineId,
      lots: gl.items.map(i => ({
        lotNumber: (i.data as PlanningItem).lotNumber,
        millMachineId: (i.data as PlanningItem).millMachineId,
        globalLotNumber: (i.data as PlanningItem).globalLotNumber
      }))
    })));

    // Track all LOT items in globalLots to avoid duplicates in millsPayload
    const globalLotLotNumbers = new Set(
      this.globalLots.flatMap(gl => gl.items.map(i => (i.data as PlanningItem).lotNumber))
    );

    /* 1 ─ mill lines */
    const millsPayload: MillPlanDTO[] = this.mills.map(mill => ({
      millMachineId: mill.id!,
      items: mill.receptions
        .filter(card => {
          // Exclude LOT items that are part of a GlobalLot to avoid duplicates
          if (card.type === PlanItemType.LOT) {
            const lotNumber = (card.data as PlanningItem).lotNumber;
            return !globalLotLotNumbers.has(lotNumber);
          }
          return true; // Include all GlobalLot items
        })
        .map(card => ({
          type: card.type,
          id: card.type === PlanItemType.LOT ? (card.data as PlanningItem).lotNumber : (card.data as GlobalLot).globalLotNumber,
          lot: card.type === PlanItemType.LOT ? {
            lotNumber: (card.data as PlanningItem).lotNumber,
            oliveQuantity: (card.data as PlanningItem).oliveQuantity,
            deliveryDate: (card.data as PlanningItem).deliveryDate.toISOString(),
            millMachineId: (card.data as PlanningItem).millMachineId,
            globalLotNumber: (card.data as PlanningItem).globalLotNumber
          } : undefined
        }))
    }));

    /* 2 ─ build the GlobalLotDTO.lots[] array */
    const globalLotsPayload: GlobalLotDTO[] = this.globalLots.map(gl => {
      const lots: LotDTO[] = gl.items
        .filter(item => item.type === PlanItemType.LOT)
        .map(item => {
          const p = item.data as PlanningItem;
          return {
            lotNumber: p.lotNumber,
            oliveQuantity: p.oliveQuantity,
            deliveryDate: p.deliveryDate.toISOString(),
            millMachineId: p.millMachineId || gl.millMachineId || undefined, // Use GlobalLot's millMachineId as fallback
            globalLotNumber: gl.globalLotNumber // Include globalLotNumber
          };
        });

      return {
        globalLotNumber: gl.globalLotNumber,
        totalKg: gl.totalKg,
        lots
      };
    });

    /* 3 ─ POST to backend */
    const request: PlanningSaveRequest = {
      mills: millsPayload,
      globalLots: globalLotsPayload
    };

    console.log('[SavePlan] Payload:', JSON.stringify(request, null, 2));

    this.planningService.savePlanning(request).subscribe({
      next: () => {
        this.snackBar.open('Planning saved successfully!', 'Close', { duration: 4000 });
        this.cdr.markForCheck();
      },
      error: err => {
        console.error('[SavePlan] Error saving planning:', err);
        this.snackBar.open('Failed to save planning. Please try again.', 'Close', { duration: 5000 });
      }
    });
  }

  getMillUsedCapacity(mill: Mill): number {
    return mill.receptions.reduce((sum, item) => {
      if (item.type === PlanItemType.LOT) {
        return sum + (item.data as PlanningItem).oliveQuantity;
      } else {
        return sum + (item.data as GlobalLot).totalKg;
      }
    }, 0);
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

  toPlanningItem(d: UnifiedDelivery): PlanningItem {
    return {
      id: d.id || `temp-${Date.now()}`,
      lotNumber: d.lotNumber ?? d.id ?? `LOT-${Date.now()}`,
      deliveryDate: new Date(d.deliveryDate!),
      millMachineId: undefined,
      deliveryNumber: d.deliveryNumber,
      oliveQuantity: d.poidsNet ?? 0
    };
  }

  private applyFilter(value: string): void {
    const search = value?.trim().toLowerCase() ?? '';
    this.filteredReceptions = search
      ? this.unassignedReceptions.filter((item) => {
        if (item.type === PlanItemType.LOT) {
          const data = item.data as PlanningItem;
          return data.id.toLowerCase().includes(search) || data.lotNumber.toLowerCase().includes(search);
        } else {
          const data = item.data as GlobalLot;
          return data.globalLotNumber.toLowerCase().includes(search) || data.childLotNumbers.some((lot) => lot.toLowerCase().includes(search));
        }
      })
      : [...this.unassignedReceptions];
    this.cdr.markForCheck();
  }

  private findItemById(id: string): BoardItem | undefined {
    return (
      this.unassignedReceptions.find((i) => {
        if (i.type === PlanItemType.LOT) {
          return (i.data as PlanningItem).id === id;
        } else {
          return (i.data as GlobalLot).id === id;
        }
      }) ??
      this.mills
        .flatMap((m) => m.receptions)
        .find((i) => {
          if (i.type === PlanItemType.LOT) {
            return (i.data as PlanningItem).id === id;
          } else {
            return (i.data as GlobalLot).id === id;
          }
        })
    );
  }
  private loadMills(): void {
    this.millService.getAllMillMachines().subscribe({
      next: (machines) => {
        this.mills = machines.map((m) => ({
          ...m,
          receptions: [],
          capacity: m.capacity ?? 1000
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
  private loadPlanning(): void {
    this.planningService.getPlanning().subscribe({
      next: (response: PlanningSaveRequest) => {
        // Initialize mills
        this.millService.getAllMillMachines().subscribe({
          next: (machines) => {
            this.mills = machines.map((m) => ({
              ...m,
              receptions: [],
              capacity: m.capacity ?? 1000
            }));

            // First, process global lots to avoid duplicates
            this.globalLots = response.globalLots.map(gl => ({
              id: gl.globalLotNumber, // Use globalLotNumber as ID
              globalLotNumber: gl.globalLotNumber,
              millMachineId: undefined, // Will be set when we process mill assignments
              totalKg: gl.totalKg,
              childLotNumbers: gl.lots.map(lot => lot.lotNumber),
              receptionIds: gl.lots.map(lot => lot.lotNumber),
              items: gl.lots.map(lot => ({
                type: PlanItemType.LOT,
                data: {
                  id: lot.lotNumber, // Use lotNumber as ID
                  lotNumber: lot.lotNumber,
                  oliveQuantity: lot.oliveQuantity,
                  deliveryDate: new Date(lot.deliveryDate),
                  millMachineId: lot.millMachineId,
                  globalLotNumber: gl.globalLotNumber
                } as PlanningItem
              }))
            }));

            // Map mills from backend response
            if (response.mills && response.mills.length > 0) {
              response.mills.forEach((millPlan) => {
                const mill = this.mills.find((m) => m.id === millPlan.millMachineId);
                if (mill) {
                  millPlan.items.forEach((item) => {
                    if (item.type === PlanItemType.LOT && item.lot) {
                      // Only add LOT items that are not part of a global lot
                      const isPartOfGlobalLot = this.globalLots.some(gl =>
                        gl.childLotNumbers.includes(item.lot?.lotNumber || '')
                      );

                      if (!isPartOfGlobalLot) {
                        const planningItem: PlanningItem = {
                          id: item.id,
                          lotNumber: item.lot.lotNumber,
                          oliveQuantity: item.lot.oliveQuantity,
                          deliveryDate: new Date(item.lot.deliveryDate),
                          millMachineId: item.lot.millMachineId,
                          globalLotNumber: item.lot.globalLotNumber
                        };
                        mill.receptions.push({ type: PlanItemType.LOT, data: planningItem });
                      }
                    } else if (item.type === PlanItemType.GLOBAL_LOT) {
                      const globalLot = this.globalLots.find((gl) => gl.globalLotNumber === item.id);
                      if (globalLot) {
                        // Update the millMachineId for the global lot
                        globalLot.millMachineId = millPlan.millMachineId;
                        // Add the global lot to the mill's receptions
                        mill.receptions.push({ type: PlanItemType.GLOBAL_LOT, data: globalLot });
                      }
                    }
                  });
                }
              });
            }

            // Map unassigned receptions
            const assignedIds = this.mills.flatMap((m) => m.receptions.map((r) =>
              r.type === PlanItemType.LOT ? (r.data as PlanningItem).lotNumber : (r.data as GlobalLot).receptionIds
            )).flat();

            this.deliveryService.getAllDeliveriesList().subscribe({
              next: (deliveryResponse) => {
                const deliveries: UnifiedDelivery[] = Array.isArray(deliveryResponse.data) ? deliveryResponse.data : [deliveryResponse.data];
                this.unassignedReceptions = deliveries
                  .filter((d) => !assignedIds.includes(d.id || '') && !assignedIds.includes(d.lotNumber || ''))
                  .map((delivery) => ({
                    type: PlanItemType.LOT,
                    data: this.toPlanningItem(delivery)
                  }));
                this.filteredReceptions = [...this.unassignedReceptions];

                // Update global lot items to ensure they reference the correct BoardItem objects
                this.globalLots.forEach((gl) => {
                  gl.items = gl.receptionIds
                    .map((rid) => this.unassignedReceptions.find((i) => (i.data as PlanningItem).lotNumber === rid) ||
                      this.mills.flatMap((m) => m.receptions).find((i) => (i.data as PlanningItem).lotNumber === rid))
                    .filter((item): item is BoardItem => item !== undefined);
                });

                this.refreshConnectedDropLists();
                this.cdr.markForCheck();
              },
              error: (err) => {
                console.error('Error loading deliveries:', err);
                this.snackBar.open('Failed to load receptions. Please try again.', 'Close', { duration: 3000 });
              }
            });
          },
          error: (err) => {
            console.error('Error loading mills:', err);
            this.snackBar.open('Failed to load mills. Please try again.', 'Close', { duration: 3000 });
          }
        });
      },
      error: (err) => {
        console.error('Error loading planning:', err);
        this.snackBar.open('Failed to load planning. Please try again.', 'Close', { duration: 3000 });
        this.loadReceptions();
      }
    });
  }
  private loadReceptions(): void {
    this.deliveryService.getAllDeliveriesList().subscribe({
      next: (response) => {
        const deliveries: UnifiedDelivery[] = Array.isArray(response.data) ? response.data : [response.data];
        this.unassignedReceptions = deliveries.map((delivery) => ({
          type: PlanItemType.LOT,
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

  private millByDropId(listId: string): Mill | undefined {
    if (listId === 'unassigned-list') return undefined;
    const match = listId.match(/mill-list-(\d+)/);
    if (!match) {
      console.warn('[DND] Invalid mill list ID:', listId);
      return undefined;
    }
    const idx = Number(match[1]);
    return this.mills[idx];
  }

  private refreshConnectedDropLists(): void {
    this.connectedDropLists = ['unassigned-list', ...this.mills.map((_, i) => `mill-list-${i}`)];
    this.cdr.markForCheck();
  }

  private logCurrentState(): void {
    console.group('🛠 Current planning');
    console.table(
      this.mills.map((m) => ({
        mill: m.name,
        receptions: m.receptions
          .map((r) => {
            if (r.type === PlanItemType.LOT) {
              return (r.data as PlanningItem).lotNumber;
            } else {
              return (r.data as GlobalLot).globalLotNumber;
            }
          })
          .join(', ')
      }))
    );
    console.groupEnd();
  }
  markAsCompleted(item: BoardItem): void {

    const label = item.type === PlanItemType.LOT
      ? (item.data as PlanningItem).lotNumber
      : (item.data as GlobalLot).globalLotNumber;

    this.confirm(`Mark ${label} as completed?`)
      .pipe(filter(ok => ok))
      .subscribe(() => {

        /* 1 ─ hit the backend */
        const req$ = item.type === PlanItemType.LOT
          ? this.planningService.completeLot(label)
          : this.planningService.completeGlobalLot(label);

        req$.subscribe({
          next: () => {
            /* 2 ─ update UI only after success */
            this.removeFromBoard(item);
            this.snackBar.open('Marked completed!', undefined, { duration: 3000 });
            this.dirty = true;
            this.cdr.markForCheck();
          },
          error: () => {
            this.snackBar.open('Server error – not completed', 'Close', { duration: 4000 });
          }
        });
      });
  }


  /* helper removes card from whichever column it’s in */
  private removeFromBoard(item: BoardItem): void {
    const mill = this.mills.find(m => m.receptions.includes(item));
    if (mill) {
      mill.receptions = mill.receptions.filter(i => i !== item);
    } else {
      this.unassignedReceptions =
        this.unassignedReceptions.filter(i => i !== item);
      this.filteredReceptions = [...this.unassignedReceptions];
    }
  }

}
