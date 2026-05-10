import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ViewChild,
  AfterViewInit,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';

import { ExpeditionService } from '../../../services/expedition.service';
import { ExpeditionDto, ExpeditionStatus } from '../../../models/expedition.model';

@Component({
  selector: 'app-expedition-list',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatPaginator,
    MatPaginatorModule,
    MatMenuModule
  ],
  templateUrl: './expedition-list.component.html',
  styleUrls: ['./expedition-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpeditionListComponent implements AfterViewInit {
  readonly displayedColumns: string[] = [
    'expeditionNumber',
    'projetCode',
    'plannedShipDate',
    'totalQuantity',
    'status',
    'actions'
  ];

  readonly loading = signal(false);
  readonly allRows = signal<ExpeditionDto[]>([]);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly dataSource = new MatTableDataSource<ExpeditionDto>();

  readonly pagedRows = computed(() => {
    const size = this.pageSize();
    const start = this.pageIndex() * size;
    return this.allRows().slice(start, start + size);
  });

  readonly totalElements = computed(() => this.allRows().length);

  readonly stats = computed(() => {
    const rows = this.allRows();

    return {
      total: rows.length,
      ready: rows.filter(row => row.status === ExpeditionStatus.READY).length,
      shipped: rows.filter(row => row.status === ExpeditionStatus.SHIPPED).length,
      delivered: rows.filter(row => row.status === ExpeditionStatus.DELIVERED).length,
      totalQuantity: rows.reduce((sum, row) => sum + (Number(row.totalQuantity) || 0), 0)
    };
  });

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private readonly destroyRef = inject(DestroyRef);
  private readonly expeditionService = inject(ExpeditionService);
  private readonly router = inject(Router);

  constructor() {
    this.load();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  load(): void {
    this.loading.set(true);
    this.resetPaginator();

    this.expeditionService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.allRows.set(data ?? []);
          this.dataSource.data = data ?? [];
          this.loading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.allRows.set([]);
          this.dataSource.data = [];
          this.loading.set(false);
        }
      });
  }

  onViewDetails(row: ExpeditionDto): void {
    this.router.navigate(['/projets/detail', row.projetId, 'expedition'], {
      queryParams: { expeditionId: row.id }
    });
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }

  private resetPaginator(): void {
    this.pageIndex.set(0);
    this.paginator?.firstPage();
  }

  statusLabel(status: ExpeditionStatus): string {
    switch (status) {
      case ExpeditionStatus.DRAFT: return 'Brouillon';
      case ExpeditionStatus.READY: return 'Pret';
      case ExpeditionStatus.VALIDATED: return 'Valide';
      case ExpeditionStatus.SHIPPED: return 'Expedie';
      case ExpeditionStatus.DELIVERED: return 'Livre';
      case ExpeditionStatus.CLOSED: return 'Cloture';
      case ExpeditionStatus.CANCELLED: return 'Annule';
      default: return status;
    }
  }

  statusClass(status: ExpeditionStatus): string {
    switch (status) {
      case ExpeditionStatus.DRAFT: return 'status-draft';
      case ExpeditionStatus.READY: return 'status-ready';
      case ExpeditionStatus.VALIDATED: return 'status-validated';
      case ExpeditionStatus.SHIPPED: return 'status-shipped';
      case ExpeditionStatus.DELIVERED: return 'status-delivered';
      case ExpeditionStatus.CLOSED: return 'status-closed';
      case ExpeditionStatus.CANCELLED: return 'status-cancelled';
      default: return '';
    }
  }
}
