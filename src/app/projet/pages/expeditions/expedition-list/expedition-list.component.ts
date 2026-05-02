import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

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
    MatMenuModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatDividerModule,
    MatChipsModule
  ],
  templateUrl: './expedition-list.component.html',
  styleUrls: ['./expedition-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpeditionListComponent {
  readonly displayedColumns: string[] = [
    'expeditionNumber',
    'projetCode',
    'plannedShipDate',
    'status',
    'totalQuantity',
    'actions'
  ];

  readonly loading = signal(false);
  readonly allRows = signal<ExpeditionDto[]>([]);

  private readonly destroyRef = inject(DestroyRef);
  private readonly expeditionService = inject(ExpeditionService);
  private readonly router = inject(Router);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);

    this.expeditionService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.allRows.set(data ?? []);
          this.loading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.allRows.set([]);
          this.loading.set(false);
        }
      });
  }

  onViewDetails(row: ExpeditionDto): void {
    // Navigate to the project detail expedition tab
    this.router.navigate(['/projets/detail', row.projetId, 'expedition'], { 
      queryParams: { expeditionId: row.id } 
    });
  }

  statusLabel(status: ExpeditionStatus): string {
    switch (status) {
      case ExpeditionStatus.DRAFT: return 'Brouillon';
      case ExpeditionStatus.READY: return 'Prêt';
      case ExpeditionStatus.VALIDATED: return 'Validé';
      case ExpeditionStatus.SHIPPED: return 'Expédié';
      case ExpeditionStatus.DELIVERED: return 'Livré';
      case ExpeditionStatus.CLOSED: return 'Clôturé';
      case ExpeditionStatus.CANCELLED: return 'Annulé';
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
