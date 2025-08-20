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
import { FormControl, FormsModule } from '@angular/forms';
import { CardComponent } from '../../../theme/components/card/card.component';
import { BreakpointObserver } from '@angular/cdk/layout';
import { catchError, debounceTime, filter, forkJoin, map, Observable, of, Subject, Subscription } from 'rxjs';
import { MillMachineService } from '../../../shared/services/mill-machine.service';
import { MillMachine } from '../../../shared/models/millMachine';
import { MatDialog } from '@angular/material/dialog';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatExpansionPanel, MatExpansionPanelDescription, MatExpansionPanelHeader } from '@angular/material/expansion';
import { SharedModule } from '../../../shared/shared.module';
import { DialogModule } from '@angular/cdk/dialog';
import { ChildLotCompletionDto, PlanningService } from '../../../shared/services/planning.service';
import { ConfirmDialogComponent } from '../../../shared/component/confirm-dialog/confirm-dialog/confirm-dialog.component';
import { CompletionDetailsDialogComponent } from './completion-details-dialog/completion-details-dialog.component';
import { SumPipe } from '../../../shared/pipes/sum.pipe';
import {
  BoardItem,
  GlobalLot,
  GlobalLotDTO,
  GlobalLotGroup,
  LotDTO,
  Mill,
  MillPlanDTO,
  PlanItemType,
  PlanningItem,
  PlanningSaveRequest
} from '../../../shared/models/planningDTOS';
import { FilterLotPipe } from '../../../shared/pipes/FilterLotPipe';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-planning',
  templateUrl: './planning.component.html',
  styleUrls: ['./planning.component.scss'],
  standalone: true,
  imports: [
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    FilterLotPipe,
    MatFormFieldModule,
    MatInputModule,
    DragDropModule,
    CommonModule,
    FormsModule,
    CardComponent,
    MatSnackBarModule,
    SharedModule,
    MatCheckbox,
    MatExpansionPanelDescription,
    MatExpansionPanelHeader,
    MatExpansionPanel,
    DialogModule,
    SumPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlanningComponent implements OnInit, OnDestroy, AfterViewInit {
  unassignedReceptions: BoardItem[] = [];
  filteredReceptions: BoardItem[] = [];
  mills: Mill[] = [];
  globalLots: GlobalLot[] = [];
  isDesktop = true;
  connectedDropLists: string[] = [];
  selection: Record<string, boolean> = {};
  readonly LOT = PlanItemType.LOT;
  readonly GLOBAL_LOT = PlanItemType.GLOBAL_LOT;
  isFullScreen = false;
  dirty = false; // tracks unsaved edits
  private filterSubject = new Subject<string>();
  private readonly autoScrollPadding = 80;
  private readonly autoScrollSpeed = 100;
  @ViewChild('scrollContainer', { static: true, read: ElementRef }) private scrollContainer!: ElementRef<HTMLElement>;
  private destroy$ = new Subject<void>();
  /* ───────────────────────── New field ───────────────────────── */
  private fullReceptionMap: Map<string, PlanningItem> = new Map();
  searchTerm = '';

  constructor(
    private deliveryService: UnifiedDeliveryService,
    private millService: MillMachineService,
    private bp: BreakpointObserver,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
    private dialog: MatDialog,
    private planningService: PlanningService
  ) {}

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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  hasSelection(): boolean {
    return this.selectedIds().length > 1;
  }

  selectedIds(): string[] {
    return Object.keys(this.selection).filter((id) => {
      const item = this.findItemById(id);
      return item && item.type === PlanItemType.LOT;
    });
  }

  savePlan(): void {
    this.confirm('Save this planning ?')
      .pipe(filter((ok) => ok))
      .subscribe(() => {
        this._savePlan(); // the old body moved to a private method
        this.dirty = false;
      });
  }

  groupSelected(): void {
    this.confirm('Group selected lots ?')
      .pipe(filter((ok) => ok))
      .subscribe(() => {
        this._groupSelected(); // old logic here
        this.dirty = true;
      });
  }
  // pour gérer la saisie et filtrer en temps réel
  searchControl = new FormControl('');

// gardez aussi ces tableaux pour restaurer l’état initial
  private allUnassigned: any[] = [];

  ungroupLot(gl: GlobalLot): void {
    // called from the menu
    this.confirm(`Ungroup global lot ${gl.globalLotNumber} ?`)
      .pipe(filter((ok) => ok))
      .subscribe(() => {
        this._ungroupLot(gl); // old logic here
        this.dirty = true;
      });
  }

  getGlobalLotGroups(items: BoardItem[]): GlobalLotGroup[] {
    const groups: { [key: string]: BoardItem[] } = {};
    items.forEach((item) => {
      const key =
        item.type === PlanItemType.LOT
          ? (item.data as PlanningItem).globalLotNumber || 'ungrouped'
          : (item.data as GlobalLot).globalLotNumber;
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

  ngOnInit(): void {
    this.bp.observe('(min-width: 1024px)').subscribe((r) => {
      this.isDesktop = r.matches;
      this.cdr.markForCheck();
    });
    this.filterSubject.pipe(debounceTime(300)).subscribe((value) => {
      this.applyFilter(value);
    });
    this.allUnassigned = [...this.unassignedReceptions];
    this.mills.forEach(m => m.receptions = [...m.receptions]);

    this.loadPlanning(); // Fetch planning from backend
  }

  ngAfterViewInit(): void {
    this.refreshConnectedDropLists();
  }

  drop(event: CdkDragDrop<BoardItem[]>): void {
    this.dirty = true;

    /* 0 ─ context ----------------------------------------------------------- */
    const srcItem = event.item.data as BoardItem;
    const srcArray = event.previousContainer.data as BoardItem[];

    const intoUnassigned = event.container.id === 'unassigned-list';
    const destMill = this.millByDropId(event.container.id);
    const destArray = intoUnassigned
      ? this.unassignedReceptions // always the real array
      : (event.container.data as BoardItem[]);

    /* 1 ─ just re-order inside same column ---------------------------------- */
    if (event.previousContainer === event.container) {
      moveItemInArray(destArray, event.previousIndex, event.currentIndex);
      return;
    }

    /* 2 ─ payload & kg ------------------------------------------------------ */
    let itemsToMove: BoardItem[] = [srcItem];

    if (srcItem.type === PlanItemType.LOT) {
      // totalKg = (srcItem.data as PlanningItem).oliveQuantity; // Removed unused
    } else {
      // GLOBAL_LOT
      const gl = srcItem.data as GlobalLot;
      itemsToMove = [srcItem, ...gl.items]; // ★ include parent too
      // totalKg     = gl.totalKg; // Removed unused
    }

    /* 4 ─ transfer ---------------------------------------------------------- */
    const idxTarget = Math.min(event.currentIndex, destArray.length);
    transferArrayItem(srcArray, destArray, event.previousIndex, idxTarget);

    /* 5 ─ mutate models ----------------------------------------------------- */
    if (srcItem.type === PlanItemType.GLOBAL_LOT) {
      const gl = srcItem.data as GlobalLot;
      gl.millMachineId = destMill ? destMill.id : '';
      this.globalLots = this.globalLots.map((g) =>
        g.globalLotNumber === gl.globalLotNumber
          ? {
              ...g,
              millMachineId: gl.millMachineId
            }
          : g
      );
      gl.items.forEach((it) => ((it.data as PlanningItem).millMachineId = destMill ? destMill.id : ''));
    } else {
      (srcItem.data as PlanningItem).millMachineId = destMill ? destMill.id : '';
    }

    /* 6 ─ keep Un-assigned source-of-truth in sync -------------------------- */
    if (event.previousContainer.id === 'unassigned-list') {
      this.unassignedReceptions = this.unassignedReceptions.filter((i) => !itemsToMove.includes(i));
    }
    if (intoUnassigned) {
      this.filteredReceptions = [...this.unassignedReceptions];
    }

    /* 7 ─ refresh ----------------------------------------------------------- */
    this.cdr.markForCheck();
  }

  @HostListener('window:beforeunload', ['$event']) _unload($event: BeforeUnloadEvent): void {
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
      this.toast.warning('Please select at least one reception to group.' );
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
      this.toast.warning('All selected receptions must be in the same column.');
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
    const globalLotNumber = `G${largestLot.padStart(4, '0')}`;

    // 4) Build the GlobalLot with all properties
    const globalLot: GlobalLot = {
      id: globalLotNumber,
      globalLotNumber: globalLotNumber,
      millMachineId,
      totalKg: itemsToGroup.reduce((sum, o) => sum + ((o.item.data as PlanningItem).poidsNet || 0), 0),
      receptionIds: ids,
      childLotNumbers: lotNumbers,
      items: itemsToGroup.map((o) => ({ ...o.item })), // Deep copy to preserve all properties
      oilQuantity: itemsToGroup.reduce((sum, o) => sum + ((o.item.data as PlanningItem).oilQuantity ?? 0), 0),
      rendement: undefined
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
    this.toast.error(`Global lot ${globalLotNumber} created successfully!`);
  }

  _ungroupLot(globalLot: GlobalLot): void {
    // 1) Find and remove the global lot from its current location
    let foundMill: Mill | undefined;
    let foundIndex = -1;

    // First check in mills
    for (const mill of this.mills) {
      const index = mill.receptions.findIndex(
        (i) => i.type === PlanItemType.GLOBAL_LOT && (i.data as GlobalLot).globalLotNumber === globalLot.globalLotNumber
      );
      if (index !== -1) {
        foundMill = mill;
        foundIndex = index;
        // Remove the global lot from the mill
        mill.receptions.splice(index, 1);
        break;
      }
    }

    // If not found in mills, check unassigned
    if (!foundMill) {
      foundIndex = this.unassignedReceptions.findIndex(
        (i) => i.type === PlanItemType.GLOBAL_LOT && (i.data as GlobalLot).globalLotNumber === globalLot.globalLotNumber
      );
      if (foundIndex !== -1) {
        this.unassignedReceptions.splice(foundIndex, 1);
      }
    }

    if (foundIndex === -1) {
      this.toast.warning('Global lot not found.');
      return;
    }

    // 2) Remove from global lots tracking
    this.globalLots = this.globalLots.filter((gl) => gl.globalLotNumber !== globalLot.globalLotNumber);

    // 3) Process child lots - fetch original data from fullReceptionMap
    const childLotsBoardItems: BoardItem[] = globalLot.items.map((item) => {
      const lot = item.data as PlanningItem;
      console.log('[UNGROUP] Raw child lot from globalLot:', item);
      console.log('[UNGROUP] Parsed child lot:', lot);

      // Find the original lot data using lotNumber from the map
      const originalLot = this.fullReceptionMap.get(lot.lotNumber);

      if (!originalLot) {
        console.error(
          `[UNGROUP] Original lot not found in map for lotNumber: ${lot.lotNumber}. Full map keys:`,
          Array.from(this.fullReceptionMap.keys())
        );
        // Fallback: Use all available properties from lot with defaults if original not found
        const fallbackData: PlanningItem = {
          ...lot,
          globalLotNumber: null,
          millMachineId: undefined,
          supplier: lot.supplier || undefined,
          region: lot.region || undefined,
          oliveVariety: lot.oliveVariety || undefined,
          oliveType: lot.oliveType || undefined,
          poidsBrute: lot.poidsBrute || 0,
          poidsNet: lot.poidsNet || 0,
          sackCount: lot.sackCount || 0,
          oilQuantity: lot.oilQuantity || null,
          rendement: lot.rendement || null
        };
        console.log('[UNGROUP] Fallback child lot data:', fallbackData);
        return { type: PlanItemType.LOT, data: fallbackData } as BoardItem;
      }

      // Use the original lot data with updated references
      const ungroupedLotData: PlanningItem = {
        ...originalLot, // Start with all original properties
        // Overwrite/update planning-specific mutable fields
        globalLotNumber: null,
        millMachineId: undefined,
        deliveryDate: lot.deliveryDate || originalLot.deliveryDate, // Prioritize potentially updated date
        completed: lot.completed || originalLot.completed, // Prioritize potentially updated completion status
        oilQuantity: lot.oilQuantity || originalLot.oilQuantity, // Prioritize potentially updated oil quantity
        rendement: lot.rendement || originalLot.rendement, // Prioritize potentially updated rendement
        supplier: lot.supplier || undefined,
        region: lot.region || undefined,
        oliveVariety: lot.oliveVariety || undefined,
        oliveType: lot.oliveType || undefined,
        poidsBrute: lot.poidsBrute || 0,
        poidsNet: lot.poidsNet || 0,
        sackCount: lot.sackCount || 0
      };

      console.log('[UNGROUP] Processed child lot data:', ungroupedLotData);
      return { type: PlanItemType.LOT, data: ungroupedLotData } as BoardItem;
    });

    // Add new child lot BoardItems to unassigned at the same position
    this.unassignedReceptions.splice(foundIndex, 0, ...childLotsBoardItems);
    this.filteredReceptions = [...this.unassignedReceptions];

    // 4) Reset UI state
    this.selection = {};
    this.refreshConnectedDropLists();
    this.cdr.markForCheck();
     this.toast.error(`Global lot ${globalLot.globalLotNumber} ungrouped successfully!`);
  }

  cancelPlan(): void {
    this.loadPlanning(); // Reload planning from backend to reset
  }

  onDragStart(event: import('@angular/cdk/drag-drop').CdkDragStart): void {
    event.source.element.nativeElement.setAttribute('aria-grabbed', 'true');
    this.cdr.detectChanges();
  }

  onDragEnd(event: import('@angular/cdk/drag-drop').CdkDragEnd): void {
    this.dirty = true;
    event.source.element.nativeElement.setAttribute('aria-grabbed', 'false');
    this.bp.observe('(min-width: 1024px)').subscribe((r) => {
      this.isDesktop = r.matches;
      this.cdr.markForCheck();
    });
  }

  toggleFullScreen(): void {
    const el = document.documentElement;
    // Use type assertion for browser-specific properties, checking for existence
    const doc: Document & {
      webkitExitFullscreen?: () => Promise<void>;
      mozCancelFullScreen?: () => Promise<void>;
      msExitFullscreen?: () => Promise<void>;
    } = document;
    const elem: HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
      mozRequestFullScreen?: () => Promise<void>;
      msRequestFullscreen?: () => Promise<void>;
    } = el;

    if (!this.isFullScreen) {
      // Request fullscreen
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        /* Chrome, Safari and Opera */
        elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        /* Firefox */
        elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        /* IE/Edge */
        elem.msRequestFullscreen();
      }
    } else {
      // Exit fullscreen
      if (doc.exitFullscreen) {
        doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        /* Chrome, Safari and Opera */
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        /* Firefox */
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        /* IE/Edge */
        doc.msExitFullscreen();
      }
    }
  }

  /** Keep icon state in sync with user pressing Esc/F11 */
  @HostListener('document:fullscreenchange') onFsChange(): void {
    this.isFullScreen = !!document.fullscreenElement;
  }

  trackByItem(_: number, item: BoardItem): string {
    return item.type === PlanItemType.LOT ? (item.data as PlanningItem).id : (item.data as GlobalLot).globalLotNumber;
  }

  _savePlan(): void {
    console.log(
      '[SavePlan] Mills before saving:',
      this.mills.map((m) => ({
        id: m.id,
        receptions: m.receptions.map((r) => ({
          type: r.type,
          id: r.type === PlanItemType.LOT ? (r.data as PlanningItem).lotNumber : (r.data as GlobalLot).globalLotNumber,
          millMachineId: r.type === PlanItemType.LOT ? (r.data as PlanningItem).millMachineId : (r.data as GlobalLot).millMachineId
        }))
      }))
    );
    console.log(
      '[SavePlan] Global lots before saving:',
      this.globalLots.map((gl) => ({
        globalLotNumber: gl.globalLotNumber,
        millMachineId: gl.millMachineId,
        lots: gl.items.map((i) => ({
          lotNumber: (i.data as PlanningItem).lotNumber,
          millMachineId: (i.data as PlanningItem).millMachineId,
          globalLotNumber: (i.data as PlanningItem).globalLotNumber
        }))
      }))
    );

    // Track all LOT items in globalLots to avoid duplicates in millsPayload
    const globalLotLotNumbers = new Set(this.globalLots.flatMap((gl) => gl.items.map((i) => (i.data as PlanningItem).lotNumber)));

    /* 1 ─ mill lines */
    const millsPayload: MillPlanDTO[] = this.mills.map((mill) => ({
      millMachineId: mill.id!,
      items: mill.receptions
        .filter((card) => {
          if (card.type === PlanItemType.LOT) {
            const lotNumber = (card.data as PlanningItem).lotNumber;
            return !globalLotLotNumbers.has(lotNumber);
          }
          return true;
        })
        .map((card) => ({
          type: card.type,
          id: card.type === PlanItemType.LOT ? (card.data as PlanningItem).lotNumber : (card.data as GlobalLot).globalLotNumber,
          lot:
            card.type === PlanItemType.LOT
              ? {
                  lotNumber: (card.data as PlanningItem).lotNumber,
                  oliveQuantity: (card.data as PlanningItem).oliveQuantity,
                  deliveryDate: (card.data as PlanningItem).deliveryDate.toISOString(),
                  millMachineId: (card.data as PlanningItem).millMachineId,
                  globalLotNumber: (card.data as PlanningItem).globalLotNumber,
                  rendement: (card.data as PlanningItem).rendement || null,
                  oilQuantity: (card.data as PlanningItem).oilQuantity || null
                }
              : undefined
        }))
    }));

    /* 2 ─ build the GlobalLotDTO.lots[] array */
    const globalLotsPayload: GlobalLotDTO[] = this.globalLots.map((gl) => {
      const lots: LotDTO[] = gl.items
        .filter((item) => item.type === PlanItemType.LOT)
        .map((item) => {
          const p = item.data as PlanningItem;
          return {
            lotNumber: p.lotNumber,
            oliveQuantity: p.oliveQuantity,
            deliveryDate: p.deliveryDate.toISOString(),
            millMachineId: p.millMachineId || gl.millMachineId || undefined,
            globalLotNumber: gl.globalLotNumber,
            rendement: p.rendement || null,
            oilQuantity: p.oilQuantity || null
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
        this.toast.error('Planning saved successfully!');
        this.dirty = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('[SavePlan] Error saving planning:', err);
        // Log the full error object to understand the cause
        console.error('[SavePlan] Full error details:', JSON.stringify(err, null, 2));
        this.toast.error('Failed to save planning. Please try again.');
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
    // Ensure all fields are always present, even if undefined
    const extra: Partial<PlanningItem> = d as unknown as Partial<PlanningItem>;
    const result: PlanningItem = {
      id: d.id,
      lotNumber: d.lotNumber,
      deliveryDate: d.deliveryDate ? new Date(d.deliveryDate) : new Date(), // fallback to now if missing
      deliveryNumber: d.deliveryNumber,
      oliveQuantity: d.poidsNet ?? 0, // Use poidsNet instead of oliveQuantity
      globalLotNumber: d.globalLotNumber ?? null,
      completed: d.status === 'COMPLETED',
      supplier: d.supplier ?? undefined,
      region: d.region?.name ?? undefined,
      oliveVariety: d.oliveVariety?.name ?? undefined,
      oliveType: d.oliveType ?? undefined,
      poidsBrute: d.poidsBrute ?? undefined,
      operationType: d.operationType ?? undefined,
      poidsNet: d.poidsNet ?? undefined,
      sackCount: d.sackCount ?? undefined,
      oilQuantity: d.oilQuantity ?? null,
      rendement: d.rendement ?? null,
      completionDate: typeof extra.completionDate !== 'undefined' && extra.completionDate ? new Date(extra.completionDate) : undefined,
      finalObservation: typeof extra.finalObservation !== 'undefined' ? extra.finalObservation : undefined
    };
    return result;
  }

  markAsCompleted(item: BoardItem): void {
    const dialogRef = this.dialog.open(CompletionDetailsDialogComponent, {
      data: { item: item.data, itemType: item.type },
      maxWidth: '100%'
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter((result) => result && result.confirmed),
        map((result) => ({
          oilQuantity: result.oilQuantity,
          rendement: result.rendement,
          unpaidPrice: result.unpaidPrice,
          triturationPricePerKg: result.triturationPricePerKg,
          totalTriturationPrice: result.totalTriturationPrice,
          childLotsRendement: result.childLotsRendement,
          autoSetStorage: result.autoSetStorage
        }))
      )
      .subscribe(({ oilQuantity, rendement, totalTriturationPrice, childLotsRendement, autoSetStorage }) => {
        const itemToComplete = item;
        let targetItemData: PlanningItem | GlobalLot | undefined;

        // Helper to find the item in an array
        const findAndUpdateItem = (arr: BoardItem[]): PlanningItem | GlobalLot | undefined => {
          const foundItem = arr.find(
            (i) =>
              (i.type === PlanItemType.LOT &&
                itemToComplete.type === PlanItemType.LOT &&
                (i.data as PlanningItem).id === (itemToComplete.data as PlanningItem).id) ||
              (i.type === PlanItemType.GLOBAL_LOT &&
                itemToComplete.type === PlanItemType.GLOBAL_LOT &&
                (i.data as GlobalLot).globalLotNumber === (itemToComplete.data as GlobalLot).globalLotNumber)
          );
          return foundItem ? foundItem.data : undefined;
        };

        // Search for the item
        targetItemData = findAndUpdateItem(this.unassignedReceptions);

        if (!targetItemData) {
          for (const mill of this.mills) {
            targetItemData = findAndUpdateItem(mill.receptions);
            if (targetItemData) break;
          }
        }

        if (!targetItemData && itemToComplete.type === PlanItemType.GLOBAL_LOT) {
          targetItemData = this.globalLots.find((gl) => gl.globalLotNumber === (itemToComplete.data as GlobalLot).globalLotNumber);
        }

        if (targetItemData) {
          // Update with new data
          targetItemData.oilQuantity = oilQuantity;
          targetItemData.rendement = rendement;
          if ('autoSetStorage' in targetItemData) {
            targetItemData.autoSetStorage = autoSetStorage;
          }
          if ('completed' in targetItemData) {
            targetItemData.completed = true; // Set as completed
          }
        }
        this.cdr.markForCheck();

        const label =
          itemToComplete.type === PlanItemType.LOT
            ? (itemToComplete.data as PlanningItem).lotNumber
            : (itemToComplete.data as GlobalLot).globalLotNumber;

        console.log('[COMPLETE] Attempting to complete:', {
          type: itemToComplete.type,
          label,
          oilQuantity,
          rendement,
          autoSetStorage,
          totalTriturationPrice,
          childLotsRendement
        });

        // Call the backend (now sending oilQuantity, rendement, and unpaidAmount)
        const req$ = this.completeIt(
          itemToComplete,
          label,
          oilQuantity,
          rendement,
          totalTriturationPrice,
          childLotsRendement,
          autoSetStorage
        );

        this.handleResponse(req$, itemToComplete, targetItemData);
      });
  }

  // Add trackBy functions for better performance
  trackByMill(index: number, mill: Mill): string {
    return mill.id || index.toString();
  }

  trackByReception(index: number, item: BoardItem): string {
    return item.type === PlanItemType.LOT ? (item.data as PlanningItem).lotNumber : (item.data as GlobalLot).globalLotNumber;
  }

  private handleResponse(req$: Observable<string>, itemToComplete: BoardItem, targetItemData?: PlanningItem | GlobalLot): void {
    req$.subscribe({
      next: (msg) => {
        // msg = "Lot completed successfully"
        this.toast.success(msg);
        this.removeFromBoard(itemToComplete);
        this.dirty = true;
      },
      error: (err) => {
        // only runs on real 4xx/5xx/network errors
        console.error('[COMPLETE] lot error', err);
        this.toast.error(err?.error?.message || 'Erreur lors de la finalisation.');
        if (targetItemData) {
          targetItemData.oilQuantity = null;
          targetItemData.rendement = null;
          if ('completed' in targetItemData) {
            targetItemData.completed = false;
          }
          this.cdr.markForCheck();
        }
      }
    });
  }

  private completeIt(
    itemToComplete: BoardItem,
    label: string,
    oilQuantity: any,
    rendement: any,
    totalTriturationPrice: any,
    childLotsRendement: any,
    autoSetStorage: any
  ) {
    if (itemToComplete.type === PlanItemType.LOT) {
      return this.planningService.completeLotWithDetails(label, oilQuantity, rendement, totalTriturationPrice, autoSetStorage);
    } else {
      if (childLotsRendement && Array.isArray(childLotsRendement)) {
        return this.planningService.completeGlobalLotWithDetails(
          label,
          childLotsRendement.map(
            (child: { lotNumber: string; oilQuantity: number; rendement: number; triturationPrice: number; autoSetStorage: boolean }) => ({
              lotNumber: child.lotNumber,
              oilQuantity: child.oilQuantity ?? 0,
              rendement: child.rendement ?? 0,
              autoSetStorage: child.autoSetStorage ?? false,
              unpaidPrice: child.triturationPrice ?? 0
            })
          ) as ChildLotCompletionDto[]
        );
      } else {
        return this.planningService.completeGlobalLotWithDetails(label, []);
      }
    }
  }

  private confirm(message: string): Observable<boolean> {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { message }
    });
    return ref.afterClosed().pipe(map(Boolean));
  }

  /* ─────────────────────── Helper – NEW ──────────────────────── */
  /** Enrich a slim LotDTO with the saved "master copy" so that
   *  supplier, variety, sacks… always render. */
  private buildPlanningItemFromLotDTO(lot: LotDTO): PlanningItem {
    const rich = this.fullReceptionMap.get(lot.lotNumber);
    // Ensure all fields are always present, even if undefined
    const result: PlanningItem = {
      ...rich,
      id: lot.lotNumber,
      lotNumber: lot.lotNumber,
      oliveQuantity: rich?.oliveQuantity ?? lot.oliveQuantity ?? 0,
      deliveryDate: lot.deliveryDate ? new Date(lot.deliveryDate) : new Date(),
      millMachineId: lot.millMachineId ?? undefined,
      globalLotNumber: lot.globalLotNumber ?? null,
      completed: lot.completed ?? rich?.completed ?? false,
      oilQuantity: lot.oilQuantity ?? rich?.oilQuantity ?? null,
      rendement: lot.rendement ?? rich?.rendement ?? null,
      supplier: rich?.supplier ?? undefined,
      region: rich?.region ?? undefined,
      oliveVariety: rich?.oliveVariety ?? undefined,
      oliveType: rich?.oliveType ?? undefined,
      operationType: rich?.operationType ?? undefined,

      poidsBrute: rich?.poidsBrute ?? undefined,
      poidsNet: rich?.poidsNet ?? undefined,
      sackCount: rich?.sackCount ?? undefined,
      completionDate: rich?.completionDate ?? undefined,
      finalObservation: rich?.finalObservation ?? undefined
    };

    return result;
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
            return (
              data.globalLotNumber.toLowerCase().includes(search) || data.childLotNumbers.some((lot) => lot.toLowerCase().includes(search))
            );
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

  private loadPlanning(): void {
    forkJoin({
      planning: this.planningService.getPlanning().pipe(
        catchError((err) => {
          console.error('Error loading planning:', err);
          return of({ mills: [], globalLots: [] } as PlanningSaveRequest);
        })
      ),
      mills: this.millService.getAllMillMachines().pipe(
        catchError((err) => {
          console.error('Error loading mills:', err);
          return of([]);
        })
      ),
      deliveries: this.deliveryService.getAllDeliveriesListForPlanning().pipe(
        catchError((err) => {
          console.error('Error loading deliveries:', err);
          return of({ data: [] });
        })
      )
    }).subscribe({
      next: ({ planning, mills, deliveries }) => {
        this.initializeMills(mills);
        this.populateReceptionMap(deliveries);
        this.processPlanningData(planning);
        this.refreshConnectedDropLists();
        this.cdr.markForCheck();
        this.logAssignmentSummary();
        console.log('[LOAD] Planning loaded successfully.');
      },
      error: (err) => {
        console.error('Error in loadPlanning:', err);
        this.toast.error('Failed to load planning data. Please try again.');
        this.loadReceptions(); // Fallback to basic loading
      }
    });
         // ← Nouvel ajout : met à jour les copies et applique le filtre courant
         this.allUnassigned = [...this.unassignedReceptions];
        this.mills.forEach(m => m.receptions = [...m.receptions]);
       this.applyFilter(this.searchControl.value!);
  }

  private initializeMills(machines: MillMachine[]): void {
    this.mills = machines.map((m) => ({
      ...m,
      receptions: [],
      capacity: m.capacity ?? 1000
    }));
    console.log('[MILLS] Initialized:', this.mills);
  }

  private populateReceptionMap(deliveryResponse: { data: UnifiedDelivery[] | UnifiedDelivery }): void {
    const deliveries: UnifiedDelivery[] = Array.isArray(deliveryResponse.data) ? deliveryResponse.data : [deliveryResponse.data];

    this.fullReceptionMap.clear();
    deliveries.forEach((d) => {
      const planningItem = this.toPlanningItem(d);
      if (planningItem.lotNumber) {
        this.fullReceptionMap.set(planningItem.lotNumber, planningItem);
      }
    });
    console.log('[LOAD] fullReceptionMap populated:', this.fullReceptionMap);
  }

  private processPlanningData(planning: PlanningSaveRequest): void {
    console.log('[PROCESS] Starting planning data processing...');

    // Step 1: Process global lots first
    this.globalLots = planning.globalLots.map((gl) => this.createGlobalLot(gl));
    console.log('[PROCESS] Global lots created:', this.globalLots.length);

    // Step 2: Create a map of assigned lot numbers and track assignments
    const assignedLotNumbers = new Set<string>();
    const globalLotAssignments = new Map<string, string>(); // globalLotNumber -> millId
    const individualLotAssignments = new Map<string, string>(); // lotNumber -> millId

    // Step 3: Process mill assignments with validation
    if (planning.mills && planning.mills.length > 0) {
      planning.mills.forEach((millPlan) => {
        const mill = this.mills.find((m) => m.id === millPlan.millMachineId);
        if (!mill) {
          console.warn(`[MILL] Mill not found for ID: ${millPlan.millMachineId}`);
          return;
        }

        console.log(`[MILL] Processing mill: ${mill.name} (${mill.id})`);

        millPlan.items.forEach((item) => {
          if (item.type === PlanItemType.LOT && item.lot) {
            const lotNumber = item.lot.lotNumber;
            assignedLotNumbers.add(lotNumber);

            // Check if this lot is part of a global lot
            const globalLot = this.globalLots.find((gl) => gl.childLotNumbers.includes(lotNumber));

            if (globalLot) {
              console.log(`[ASSIGN] Lot ${lotNumber} is part of global lot ${globalLot.globalLotNumber}`);

              // Update global lot's mill assignment
              globalLot.millMachineId = millPlan.millMachineId;
              globalLotAssignments.set(globalLot.globalLotNumber, millPlan.millMachineId);

              // Update all child items with mill assignment
              globalLot.items.forEach((childItem) => {
                (childItem.data as PlanningItem).millMachineId = millPlan.millMachineId;
              });

              // Add global lot to mill if not already added
              const existingGlobalLot = mill.receptions.find(
                (r) => r.type === PlanItemType.GLOBAL_LOT && (r.data as GlobalLot).globalLotNumber === globalLot.globalLotNumber
              );

              if (!existingGlobalLot) {
                mill.receptions.push({ type: PlanItemType.GLOBAL_LOT, data: globalLot });
                console.log(`[ASSIGN] Added global lot ${globalLot.globalLotNumber} to mill ${mill.name}`);
              } else {
                console.log(`[ASSIGN] Global lot ${globalLot.globalLotNumber} already exists in mill ${mill.name}`);
              }
            } else {
              console.log(`[ASSIGN] Adding individual lot ${lotNumber} to mill ${mill.name}`);

              // Add individual lot to mill
              const planningItem = this.buildPlanningItemFromLotDTO(item.lot);
              planningItem.millMachineId = millPlan.millMachineId;
              individualLotAssignments.set(lotNumber, millPlan.millMachineId);

              // Check for duplicates
              const existingLot = mill.receptions.find(
                (r) => r.type === PlanItemType.LOT && (r.data as PlanningItem).lotNumber === lotNumber
              );

              if (!existingLot) {
                mill.receptions.push({ type: PlanItemType.LOT, data: planningItem });
                console.log(`[ASSIGN] Added individual lot ${lotNumber} to mill ${mill.name}`);
              } else {
                console.warn(`[ASSIGN] Duplicate lot ${lotNumber} found in mill ${mill.name}`);
              }
            }
          } else if (item.type === PlanItemType.GLOBAL_LOT) {
            console.log(`[ASSIGN] Processing global lot assignment: ${item.id}`);

            const globalLot = this.globalLots.find((gl) => gl.globalLotNumber === item.id);
            if (globalLot) {
              globalLot.millMachineId = millPlan.millMachineId;
              globalLotAssignments.set(globalLot.globalLotNumber, millPlan.millMachineId);

              // Update all child items with mill assignment
              globalLot.items.forEach((childItem) => {
                (childItem.data as PlanningItem).millMachineId = millPlan.millMachineId;
                assignedLotNumbers.add((childItem.data as PlanningItem).lotNumber);
              });

              // Add global lot to mill if not already added
              const existingGlobalLot = mill.receptions.find(
                (r) => r.type === PlanItemType.GLOBAL_LOT && (r.data as GlobalLot).globalLotNumber === globalLot.globalLotNumber
              );

              if (!existingGlobalLot) {
                mill.receptions.push({ type: PlanItemType.GLOBAL_LOT, data: globalLot });
                console.log(`[ASSIGN] Added global lot ${globalLot.globalLotNumber} to mill ${mill.name}`);
              } else {
                console.log(`[ASSIGN] Global lot ${globalLot.globalLotNumber} already exists in mill ${mill.name}`);
              }
            } else {
              console.warn(`[ASSIGN] Global lot ${item.id} not found in globalLots array`);
            }
          }
        });
      });
    }

    // Step 4: Validate assignments
    this.validateAssignments(assignedLotNumbers, globalLotAssignments, individualLotAssignments);

    // Step 5: Create unassigned receptions
    this.createUnassignedReceptions(assignedLotNumbers);

    console.log('[PROCESS] Planning data processing completed');
  }

  private validateAssignments(
    assignedLotNumbers: Set<string>,
    globalLotAssignments: Map<string, string>,
    individualLotAssignments: Map<string, string>
  ): void {
    console.log('[VALIDATE] Starting assignment validation...');

    let hasErrors = false;

    // Validate global lots
    this.globalLots.forEach((globalLot) => {
      if (globalLot.millMachineId) {
        const mill = this.mills.find((m) => m.id === globalLot.millMachineId);
        if (!mill) {
          console.error(`[VALIDATE] Global lot ${globalLot.globalLotNumber} assigned to non-existent mill ${globalLot.millMachineId}`);
          hasErrors = true;
        } else {
          const millHasGlobalLot = mill.receptions.some(
            (r) => r.type === PlanItemType.GLOBAL_LOT && (r.data as GlobalLot).globalLotNumber === globalLot.globalLotNumber
          );

          if (!millHasGlobalLot) {
            console.error(`[VALIDATE] Global lot ${globalLot.globalLotNumber} not found in assigned mill ${mill.name}`);
            hasErrors = true;
          } else {
            console.log(`[VALIDATE] ✓ Global lot ${globalLot.globalLotNumber} correctly assigned to mill ${mill.name}`);
          }
        }
      } else {
        console.warn(`[VALIDATE] Global lot ${globalLot.globalLotNumber} has no mill assignment`);
      }
    });

    // Validate individual lot assignments
    individualLotAssignments.forEach((millId, lotNumber) => {
      const mill = this.mills.find((m) => m.id === millId);
      if (!mill) {
        console.error(`[VALIDATE] Individual lot ${lotNumber} assigned to non-existent mill ${millId}`);
        hasErrors = true;
      } else {
        const millHasLot = mill.receptions.some((r) => r.type === PlanItemType.LOT && (r.data as PlanningItem).lotNumber === lotNumber);

        if (!millHasLot) {
          console.error(`[VALIDATE] Individual lot ${lotNumber} not found in assigned mill ${mill.name}`);
          hasErrors = true;
        } else {
          console.log(`[VALIDATE] ✓ Individual lot ${lotNumber} correctly assigned to mill ${mill.name}`);
        }
      }
    });

    // Check for orphaned lots (lots in global lots but not assigned)
    this.globalLots.forEach((globalLot) => {
      globalLot.childLotNumbers.forEach((lotNumber) => {
        if (!assignedLotNumbers.has(lotNumber)) {
          console.error(`[VALIDATE] Orphaned lot ${lotNumber} in global lot ${globalLot.globalLotNumber} - not assigned to any mill`);
          hasErrors = true;
        }
      });
    });

    console.log(`[VALIDATE] Assignment validation completed. Assigned lots: ${assignedLotNumbers.size}`);

    // If errors found, attempt to clean up
    if (hasErrors) {
      console.warn('[VALIDATE] Errors found during validation. Attempting to clean up...');
      this.cleanupCorruptedAssignments();
    }
  }

  private cleanupCorruptedAssignments(): void {
    console.log('[CLEANUP] Starting cleanup of corrupted assignments...');

    // Clean up mills with non-existent global lots
    this.mills.forEach((mill) => {
      mill.receptions = mill.receptions.filter((reception) => {
        if (reception.type === PlanItemType.GLOBAL_LOT) {
          const globalLot = reception.data as GlobalLot;
          const existsInGlobalLots = this.globalLots.some((gl) => gl.globalLotNumber === globalLot.globalLotNumber);

          if (!existsInGlobalLots) {
            console.warn(`[CLEANUP] Removing orphaned global lot ${globalLot.globalLotNumber} from mill ${mill.name}`);
            return false;
          }
        }
        return true;
      });
    });

    // Clean up global lots with invalid mill assignments
    this.globalLots.forEach((globalLot) => {
      if (globalLot.millMachineId) {
        const millExists = this.mills.some((m) => m.id === globalLot.millMachineId);
        if (!millExists) {
          console.warn(`[CLEANUP] Removing invalid mill assignment from global lot ${globalLot.globalLotNumber}`);
          globalLot.millMachineId = undefined;
          globalLot.items.forEach((childItem) => {
            (childItem.data as PlanningItem).millMachineId = undefined;
          });
        }
      }
    });

    // Remove duplicate assignments
    this.mills.forEach((mill) => {
      const seenLotNumbers = new Set<string>();
      const seenGlobalLotNumbers = new Set<string>();

      mill.receptions = mill.receptions.filter((reception) => {
        if (reception.type === PlanItemType.LOT) {
          const lotNumber = (reception.data as PlanningItem).lotNumber;
          if (seenLotNumbers.has(lotNumber)) {
            console.warn(`[CLEANUP] Removing duplicate lot ${lotNumber} from mill ${mill.name}`);
            return false;
          }
          seenLotNumbers.add(lotNumber);
        } else if (reception.type === PlanItemType.GLOBAL_LOT) {
          const globalLotNumber = (reception.data as GlobalLot).globalLotNumber;
          if (seenGlobalLotNumbers.has(globalLotNumber)) {
            console.warn(`[CLEANUP] Removing duplicate global lot ${globalLotNumber} from mill ${mill.name}`);
            return false;
          }
          seenGlobalLotNumbers.add(globalLotNumber);
        }
        return true;
      });
    });

    console.log('[CLEANUP] Cleanup completed');
  }

  // --- Fallback method if delivery details loading fails ---
  // Remove the old loadPlanningWithoutDetails method as it's no longer needed

  private createGlobalLot(gl: GlobalLotDTO): GlobalLot {
    return {
      id: gl.globalLotNumber,
      globalLotNumber: gl.globalLotNumber,
      millMachineId: undefined, // Will be set during mill assignment
      totalKg: gl.totalKg,
      childLotNumbers: gl.lots.map((lot) => lot.lotNumber),
      receptionIds: gl.lots.map((lot) => lot.lotNumber),
      items: gl.lots.map((lot) => ({
        type: PlanItemType.LOT,
        data: this.buildPlanningItemFromLotDTO(lot)
      })),
      completed: gl.completed
    };
  }

  private createUnassignedReceptions(assignedLotNumbers: Set<string>): void {
    // Use the master copy from fullReceptionMap for each lot
    this.unassignedReceptions = Array.from(this.fullReceptionMap.values())
      .filter((item) => item.lotNumber && !assignedLotNumbers.has(item.lotNumber))
      .map((item) => ({
        type: PlanItemType.LOT,
        data: item // Use the master copy directly
      }));

    this.filteredReceptions = [...this.unassignedReceptions];
    console.log('[LOAD] Unassigned receptions created:', this.unassignedReceptions.length);
  }

  // Remove the old loadPlanning method and related fallback methods

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
        this.toast.error('Failed to load receptions. Please try again.' );
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

  /* helper removes card from whichever column it's in */
  private removeFromBoard(item: BoardItem): void {
    const mill = this.mills.find((m) => m.receptions.includes(item));
    if (mill) {
      mill.receptions = mill.receptions.filter((i) => i !== item);
    } else {
      this.unassignedReceptions = this.unassignedReceptions.filter((i) => i !== item);
      this.filteredReceptions = [...this.unassignedReceptions];
    }
    this.cdr.markForCheck(); // Added to ensure UI updates after removing item
  }

  private findUnifiedDeliveryByLotNumber(lotNumber: string): UnifiedDelivery | undefined {
    // Search in unassignedReceptions and all mill receptions
    const allDeliveries = [...this.unassignedReceptions, ...this.mills.flatMap((m) => m.receptions)];
    for (const item of allDeliveries) {
      if (item.type === PlanItemType.LOT) {
        const data = item.data as PlanningItem;
        // Use Partial<UnifiedDelivery> to check for deliveryType property
        if (data.lotNumber === lotNumber && (data as Partial<UnifiedDelivery>).deliveryType) {
          return data as unknown as UnifiedDelivery;
        }
      }
    }
    return undefined;
  }

  private logAssignmentSummary(): void {
    console.log('\n=== ASSIGNMENT SUMMARY ===');

    // Summary by mill
    this.mills.forEach((mill) => {
      const individualLots = mill.receptions.filter((r) => r.type === PlanItemType.LOT);
      const globalLots = mill.receptions.filter((r) => r.type === PlanItemType.GLOBAL_LOT);

      console.log(`\n${mill.name} (${mill.id}):`);
      console.log(`  - Individual lots: ${individualLots.length}`);
      console.log(`  - Global lots: ${globalLots.length}`);

      if (individualLots.length > 0) {
        console.log(`  - Individual lot numbers: ${individualLots.map((r) => (r.data as PlanningItem).lotNumber).join(', ')}`);
      }

      if (globalLots.length > 0) {
        console.log(`  - Global lot numbers: ${globalLots.map((r) => (r.data as GlobalLot).globalLotNumber).join(', ')}`);
      }
    });

    // Unassigned summary
    console.log(`\nUnassigned receptions: ${this.unassignedReceptions.length}`);
    if (this.unassignedReceptions.length > 0) {
      const unassignedLotNumbers = this.unassignedReceptions.map((r) => (r.data as PlanningItem).lotNumber).slice(0, 10); // Show first 10
      console.log(`  - Sample unassigned lots: ${unassignedLotNumbers.join(', ')}`);
      if (this.unassignedReceptions.length > 10) {
        console.log(`  - ... and ${this.unassignedReceptions.length - 10} more`);
      }
    }

    // Global lots summary
    console.log(`\nGlobal lots: ${this.globalLots.length}`);
    this.globalLots.forEach((gl) => {
      const assignedTo = gl.millMachineId ? this.mills.find((m) => m.id === gl.millMachineId)?.name : 'Unassigned';
      console.log(`  - ${gl.globalLotNumber}: ${gl.childLotNumbers.length} child lots → ${assignedTo}`);
    });

    console.log('=== END ASSIGNMENT SUMMARY ===\n');
  }
  private applyFilterSearch(term: string): void {
    const filterValue = (term || '').trim().toLowerCase();

    // colonne non assignée
    this.filteredReceptions = filterValue
      ? this.allUnassigned.filter(item => this.matches(item, filterValue))
      : [...this.allUnassigned];

    // chaque colonne de moulin
    this.mills.forEach(mill => {
      mill.receptions = filterValue
        ? mill.receptions!.filter(item => this.matches(item, filterValue))
        : [...mill.receptions!];
    });
  }

  private matches(item: BoardItem, filterValue: string): boolean {
    const lot = ((item.data as PlanningItem).lotNumber || '').toString().toLowerCase();
    return lot.includes(filterValue);
  }
  clearSearch(): void {
    this.searchControl.setValue('');
    this.applyFilter('');
  }

}
