import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginator } from '@angular/material/paginator';
import { MatDivider } from '@angular/material/divider';
import { FiltrationApiService } from '../../shared/services/filtration-api.service';
import { FiltrationOperation } from '../../shared/models/filtration-operation';
import { FILTRATION_STATUS_LABEL, FiltrationStatus } from '../../shared/models/filtration-status';
import { FiltrationStatusDialogComponent } from './filtration-status-dialog/filtration-status-dialog.component';
import { FiltrationDeleteDialogComponent } from './filtration-delete-dialog/filtration-delete-dialog.component';
import { FiltrationTraceabilityDialogComponent } from './traceability/filtration-traceability-dialog.component';
@Component({
  selector: 'app-filtration-list',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatDialogModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatPaginator,
    MatDivider
  ],
  templateUrl: './filtration-list.component.html',
  styleUrls: ['./filtration-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FiltrationListComponent {
  readonly displayedColumns: string[] = [
    'timestamp',
    'source',
    'target',
    'volumeFiltered',
    'volumeAfter',
    'lossPercent',
    'status',
    'actions'
  ];
  readonly statusOptions: Array<FiltrationStatus | 'ALL'> = [
    'ALL',
    'CREATED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
  ];
  readonly loading = signal(false);
  readonly rows = signal<FiltrationOperation[]>([]);
  readonly statusFilter = signal<FiltrationStatus | 'ALL'>('ALL');
  pageSize = 10;
  totalElements = signal(0);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(FiltrationApiService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  constructor() {
    this.load();
  }
  load(): void {
    this.loading.set(true);
    const filter = this.statusFilter();
    const request$ = filter === 'ALL' ? this.api.getAll() : this.api.getByStatus(filter);
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        const sortedRows = [...(data ?? [])].sort((a, b) => this.compareRows(a, b));
        this.rows.set(sortedRows);
        this.totalElements.set(sortedRows.length);
        this.loading.set(false);
      },
      error: () => {
        this.rows.set([]);
        this.totalElements.set(0);
        this.loading.set(false);
      }
    });
  }

  onCreate(): void {
    this.router.navigate(['storage', 'oil-filtering', 'new']);
  }


  onStatusChange(value: FiltrationStatus | 'ALL'): void {
    this.statusFilter.set(value);
    this.load();
  }
  statusLabel(status: string): string {
    const mappedStatus = status as FiltrationStatus;
    return FILTRATION_STATUS_LABEL[mappedStatus] ?? status;
  }


  canEdit(row: FiltrationOperation): boolean {
    const status = row.status as string;
    return status === 'CREATED' || status === 'COMPLETED';
  }

  canStart(row: FiltrationOperation): boolean {
    return (row.status as string) === 'CREATED';
  }

  canChangeStatus(row: FiltrationOperation): boolean {
    const status = row.status as string;
    return status === 'CREATED' || status === 'IN_PROGRESS';
  }

  canDelete(row: FiltrationOperation): boolean {
    return (row.status as string) !== 'CANCELLED';
  }

  canTraceability(row: FiltrationOperation): boolean {
    return true;  // toujours accessible
  }

  canPrepareLabel(row: FiltrationOperation): boolean {
    return true;  // toujours accessible
  }


  onEdit(row: FiltrationOperation): void {
    if (!this.canEdit(row)) {
      return;
    }
    this.router.navigate(['storage', 'oil-filtering', row.operationId, 'edit']);
  }
  onStart(row: FiltrationOperation): void {
    if (!this.canStart(row)) {
      return;
    }
    this.loading.set(true);
    this.api.start(row.operationId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.load(),
      error: () => this.loading.set(false)
    });
  }
  onChangeStatus(row: FiltrationOperation): void {
    const dialogRef = this.dialog.open(FiltrationStatusDialogComponent, {
      width: '520px',
      data: { row }
    });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((changed: boolean) => {
      if (changed) {
        this.load();
      }
    });
  }
  onDelete(row: FiltrationOperation): void {
    const dialogRef = this.dialog.open(FiltrationDeleteDialogComponent, {
      width: '420px',
      data: { row }
    });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed: boolean) => {
      if (!confirmed) {
        return;
      }
      this.loading.set(true);
      this.api.delete(row.operationId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => this.load(),
        error: () => this.loading.set(false)
      });
    });
  }
  onPageChange(event: { pageSize: number }): void {
    this.pageSize = event.pageSize;
  }

  onTraceability(row: FiltrationOperation): void {
    this.router.navigate(['storage', 'oil-filtering', row.operationId, 'traceability']);
  }
  onPrepareLabel(row: FiltrationOperation): void {
    if (!row.target?.id) {
      return;
    }
    this.router.navigate(['/labels', 'new'], {
      queryParams: {
        lotId: row.target.id
      }
    });
  }

  private compareRows(a: FiltrationOperation, b: FiltrationOperation): number {
    const statusA = (a.status as string) === 'CANCELLED' ? 1 : 0;
    const statusB = (b.status as string) === 'CANCELLED' ? 1 : 0;

    if (statusA !== statusB) {
      return statusA - statusB;
    }

    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return timeB - timeA;
  }
}


