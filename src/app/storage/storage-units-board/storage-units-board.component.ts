import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { debounceTime, map, startWith, switchMap } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { StorageUnitDtoService } from '../../shared/services/storage.service';
import { StorageUnitDto } from '../../shared/models/StorageUnitDto';
import { CardComponent } from '../../theme/components/card/card.component';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

// Adjust import path to your actual service/model locations

export interface oilVariety { id?: string; name?: string; code?: string; }
export type   status= 'AVAILABLE' | 'FULL' | 'FILLING' | 'MAINTENANCE' | 'IN_USE' | 'CLEANING' | 'RESERVED' | 'OUT_OF_SERVICE';



@Component({
  selector: 'app-storage-units-board',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatSelectModule,
    MatInputModule,
    MatSlideToggleModule,
    TranslateModule,
    CardComponent
  ],
  templateUrl: './storage-units-board.component.html',
  styleUrls: ['./storage-units-board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StorageUnitsBoardComponent implements OnInit {
  private readonly storageUnitService = inject(StorageUnitDtoService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  /** Raw list loaded from API */
  private data$ = new BehaviorSubject<StorageUnitDto[]>([]);
  /** Trigger reloads */
  private reload$ = new BehaviorSubject<void>(undefined);

  /** Simple filter form */
  readonly filters = this.fb.group({
    search: [''],
    status: [''],
    oilVariety: [''],
    showOnlyPaid: [false]
  });

  /** Distinct status list (derived from data) */
  statuses = signal<status[]>([]);
  /** Distinct oil types (by name) */
  oilVarietys = signal<string[]>([]);

  /** Filtered list */
  filteredUnits = signal<StorageUnitDto[]>([]);

  ngOnInit(): void {
    // Load data on start & on refresh
    this.reload$
      .pipe(
        startWith(undefined),
        switchMap(() => {
          this.loading.set(true);
          this.error.set(null);
          return this.storageUnitService.getAllStorageUnit().pipe(map((res) => res.data ?? []));
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (units) => {
          this.data$.next(units);
          this.oilVarietys.set(this.distinctOilTypes(units));
          this.applyFilters();
          this.loading.set(false);
        },
        error: (err) => {
          const errorMessage = err?.message || this.translate.instant('STORAGE.ERROR.FAILED_TO_LOAD_UNITS');
          this.error.set(errorMessage);
          this.data$.next([]);
          this.filteredUnits.set([]);
          this.loading.set(false);
        }
      });

    // React to filter changes
    combineLatest([this.filters.valueChanges.pipe(startWith(this.filters.value), debounceTime(150)), this.data$])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyFilters());
  }

  refresh(): void {
    this.reload$.next();
  }

  private applyFilters(): void {
    const { search, status, oilVariety, showOnlyPaid } = this.filters.value;
    const s = (search ?? '').toString().trim().toLowerCase();
    const st = (status ?? '').toString().trim();
    const ot = (oilVariety ?? '').toString().trim().toLowerCase();
    const paidFilter = showOnlyPaid ?? false;

    const filtered = (this.data$.value || []).filter((u) => {
      const matchesSearch = !s || u.name.toLowerCase().includes(s) || u.oilVariety?.name?.toLowerCase().includes(s);

      const matchesStatus = !st || u.status === st;
      const matchesOilType = !ot || u.oilVariety?.name?.toLowerCase() === ot;

      // Apply paid storage filter
      const matchesPaidFilter = !paidFilter || u.paidStorage === true;

      return matchesSearch && matchesStatus && matchesOilType && matchesPaidFilter;
    });

    this.filteredUnits.set(filtered);
  }

  /** ------- View helpers (stateless, per-unit) ------- */
  getFillPercentage(u: StorageUnitDto): number {
    if (!u?.maxCapacity) return 0;
    const pct = (u.currentVolume / u.maxCapacity) * 100;
    return Math.max(0, Math.min(100, pct));
  }

  getFillLevelClass(u: StorageUnitDto): string {
    const pct = this.getFillPercentage(u);
    if (pct >= 90) return 'fill-high';
    if (pct >= 50) return 'fill-mid';
    if (pct > 0) return 'fill-low';
    return 'fill-empty';
  }

  paidStorage(u: StorageUnitDto): boolean {
    return u.paidStorage === true;
  }

  viewUnit(u: StorageUnitDto): void {
    this.router.navigate(['/storage', u.id, 'view']);
  }
  getStatusClass(u: StorageUnitDto): string {
    switch (u.status) {
      case 'AVAILABLE':
        return 'status-available';
      case 'FULL':
        return 'status-full';
      case 'FILLING':
        return 'status-filling';
      case 'MAINTENANCE':
        return 'status-maintenance';
      case 'IN_USE':
        return 'status-inuse';
      case 'CLEANING':
        return 'status-cleaning';
      case 'RESERVED':
        return 'status-reserved';
      case 'OUT_OF_SERVICE':
        return 'status-outofservice';
      default:
        return 'status-available';
    }
  }

  getStatusIcon(u: StorageUnitDto): string {
    switch (u.status) {
      case 'AVAILABLE':
        return 'check_circle';
      case 'FULL':
        return 'inventory';
      case 'FILLING':
        return 'autorenew';
      case 'MAINTENANCE':
        return 'build';
      case 'IN_USE':
        return 'play_circle';
      case 'CLEANING':
        return 'cleaning_services';
      case 'RESERVED':
        return 'event_busy';
      case 'OUT_OF_SERVICE':
        return 'power_off';
      default:
        return 'check_circle';
    }
  }

  getStatusIconClass(u: StorageUnitDto): string {
    return `status-icon ${this.getStatusClass(u)}`;
  }

  availableCapacity(u: StorageUnitDto): number {
    return Math.max(0, (u.maxCapacity ?? 0) - (u.currentVolume ?? 0));
  }

  trackById(_: number, item: StorageUnitDto): any {
    return item.id;
  }

  /** ------- Derivers ------- */
  private distinctStatuses(units: StorageUnitDto[]): status[] {
    const set = new Set<status>();
    units.forEach((u) => set.add(u.status));
    return Array.from(set);
  }

  private distinctOilTypes(units: StorageUnitDto[]): string[] {
    const set = new Set<string>();
    units.forEach((u) => {
      if (u.oilVariety?.name) set.add(u.oilVariety.name);
    });
    return Array.from(set);
  }
}
