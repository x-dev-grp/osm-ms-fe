import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe, NgClass, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { ProjetService } from '../../../services/projet.service';
import { ProjetDto } from '../../../models/TypeProduit';
import { ProjetStatusDialogComponent, ProjetStatusDialogResult } from '../projet-status-dialog/projet-status-dialog.component';
import { sortRowsByCreatedDate, TableSortDirection, toggleSortDirection } from '../../../../shared/utils/table-sort.util';

type ProjetStatusFilter = 'ALL' | 'BROUILLON' | 'EN_COURS' | 'VALIDE' | 'ANNULE' | 'FAILED';

@Component({
  selector: 'app-projet-list',
  standalone: true,
  imports: [
    CommonModule,
    TitleCasePipe,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    NgClass,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatDividerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './projet-list.component.html',
  styleUrls: ['./projet-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjetListComponent {
  readonly displayedColumns: string[] = [
    'code',
    'client',
    'produit',
    'emballage',
    'quantite',
    'dateLimite',
    'createdDate',
    'valeurTotale',
    'statut',
    'actions'
  ];

  readonly statusOptions: ProjetStatusFilter[] = [
    'ALL',
    'BROUILLON',
    'EN_COURS',
    'VALIDE',
    'ANNULE',
    'FAILED'
  ];

  readonly loading = signal(false);
  readonly allRows = signal<ProjetDto[]>([]);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly statusFilter = signal<ProjetStatusFilter>('ALL');
  readonly searchCode = signal('');
  readonly sortDirection = signal<TableSortDirection>('desc');
  readonly searching = signal(false);

  readonly rows = computed(() => {
    const all = this.allRows();
    const filter = this.statusFilter();
    const search = this.searchCode().trim().toLowerCase();

    let filtered = all;

    if (filter !== 'ALL') {
      filtered = filtered.filter(row => this.normalizeStatus(row.statut) === filter);
    }

    if (search) {
      filtered = filtered.filter(row => {
        const code = (row.code || '').toLowerCase();
        const clientNom = (row.client?.nom || '').toLowerCase();
        const typeProduit = (row.typeProduit || '').toLowerCase();
        const typeEmballage = (row.typeEmballage || '').toLowerCase();
        return code.includes(search) ||
               clientNom.includes(search) ||
               typeProduit.includes(search) ||
               typeEmballage.includes(search);
      });
    }

    return sortRowsByCreatedDate(filtered, this.sortDirection());
  });

  readonly projectStats = computed(() => {
    const rows = this.allRows();
    const totalValue = rows.reduce((sum, row) => sum + (Number(row.valeurTotale) || 0), 0);
    const totalQuantity = rows.reduce((sum, row) => sum + (Number(row.quantiteCible) || 0), 0);

    return {
      total: rows.length,
      active: rows.filter(row => this.normalizeStatus(row.statut) === 'EN_COURS').length,
      validated: rows.filter(row => this.normalizeStatus(row.statut) === 'VALIDE').length,
      totalValue,
      totalQuantity
    };
  });

  readonly pagedRows = computed(() => {
    const size = this.pageSize();
    const start = this.pageIndex() * size;
    return this.rows().slice(start, start + size);
  });

  readonly totalElements = computed(() => this.rows().length);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private readonly destroyRef = inject(DestroyRef);
  private readonly projetService = inject(ProjetService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.resetPaginator();

    this.projetService.getAll()
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

  onCreate(): void {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  onEdit(row: ProjetDto): void {
    this.router.navigate([row.id], { relativeTo: this.route });
  }

  onViewDetails(row: ProjetDto): void {
    this.router.navigate(['detail', row.id], { relativeTo: this.route });
  }

  onOpenExpedition(row: ProjetDto): void {
    if (!row?.id) {
      return;
    }

    if (row.statut === 'FAILED') {
      alert('Action impossible: le projet est bloque. Consultez le detail pour voir la cause et la correction.');
      return;
    }

    this.router.navigate(['detail', row.id, 'expedition'], { relativeTo: this.route });
  }

  onDelete(row: ProjetDto): void {
    if (!row?.id) return;

    if (!confirm(`Supprimer le projet "${row.code ?? row.client.nom}" ?`)) {
      return;
    }

    this.loading.set(true);

    this.projetService.delete(row.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.load(),
        error: (err) => {
          console.error(err);
          this.loading.set(false);
        }
      });
  }

  onStatusChange(value: ProjetStatusFilter): void {
    this.statusFilter.set(value);
    this.resetPaginator();
  }

  onSearchCodeInput(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.searchCode.set(value);
    this.resetPaginator();
  }

  toggleCreatedDateSort(): void {
    this.sortDirection.update((direction) => toggleSortDirection(direction));
    this.resetPaginator();
  }

  searchByCode(): void {
    const code = this.searchCode().trim();
    if (!code || this.searching()) {
      return;
    }

    this.searching.set(true);

    this.projetService.getByUniqueCode(code)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (projet) => {
          this.searching.set(false);

          if (!projet?.id) {
            alert('Aucun projet trouve pour ce code.');
            return;
          }

          this.router.navigate(['detail', projet.id], { relativeTo: this.route });
        },
        error: () => {
          this.searching.set(false);
          alert('Aucun projet trouve pour ce code.');
        }
      });
  }

  normalizeStatus(statut?: string): ProjetStatusFilter {
    const value = (statut ?? '').trim().toUpperCase();

    if (value === 'CREATED' || value === 'BROUILLON') return 'BROUILLON';
    if (value === 'IN_PROGRESS' || value === 'EN_COURS') return 'EN_COURS';
    if (value === 'COMPLETED' || value === 'VALIDE' || value === 'ACCEPTE') return 'VALIDE';
    if (value === 'CANCELLED' || value === 'ANNULE') return 'ANNULE';
    if (value === 'FAILED') return 'FAILED';

    return 'BROUILLON';
  }

  statusLabel(status: ProjetStatusFilter | string): string {
    const raw = String(status ?? '').trim().toUpperCase();

    if (raw === 'ALL') return 'Tous les projets';

    const normalized = this.normalizeStatus(raw);

    switch (normalized) {
      case 'BROUILLON':
        return 'Brouillon';
      case 'EN_COURS':
        return 'En cours';
      case 'VALIDE':
        return 'Valide';
      case 'ANNULE':
        return 'Annule';
      case 'FAILED':
        return 'Echoue';
      default:
        return raw || '-';
    }
  }

  statusClass(statut?: string): string {
    const normalized = this.normalizeStatus(statut);

    if (normalized === 'BROUILLON') return 'created';
    if (normalized === 'EN_COURS') return 'in_progress';
    if (normalized === 'VALIDE') return 'completed';
    if (normalized === 'ANNULE') return 'cancelled';
    if (normalized === 'FAILED') return 'failed';

    return 'created';
  }

  canChangeStatus(row: ProjetDto): boolean {
    const status = this.normalizeStatus(row.statut);
    return status === 'BROUILLON' || status === 'EN_COURS';
  }

  openStatusDialog(row: ProjetDto): void {
    if (!row?.id) {
      return;
    }

    if (!this.canChangeStatus(row)) {
      alert('Changement de statut non autorise pour ce projet.');
      return;
    }

    const dialogRef = this.dialog.open<ProjetStatusDialogComponent, { projet: ProjetDto }, ProjetStatusDialogResult>(
      ProjetStatusDialogComponent,
      {
        width: '720px',
        maxWidth: '95vw',
        disableClose: false,
        autoFocus: true,
        restoreFocus: false,
        data: { projet: row }
      }
    );

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (!result?.status) {
          return;
        }

        this.loading.set(true);

        this.projetService.updateStatus(row.id, result.status)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => this.load(),
            error: (err) => {
              console.error('Erreur API lors du changement de statut:', err);
              this.loading.set(false);
            }
          });
      });
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }

  onAddOF(row: ProjetDto): void {
    if (!row?.id) {
      return;
    }

    this.router.navigate(['/of/nouveau'], {
      queryParams: { projetId: row.id }
    });
  }

  private resetPaginator(): void {
    this.pageIndex.set(0);
    this.paginator?.firstPage();
  }
}

