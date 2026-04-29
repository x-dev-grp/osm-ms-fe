import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, NgClass, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginator } from '@angular/material/paginator';
import { MatDivider } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { ProjetService } from '../../../services/projet.service';
import { ProjetDto } from '../../../models/TypeProduit';
import { ProjetStatusDialogComponent, ProjetStatusDialogResult } from '../projet-status-dialog/projet-status-dialog.component';

type ProjetStatusFilter = 'ALL' | 'BROUILLON' | 'EN_COURS' | 'VALIDE' | 'ANNULE';

@Component({
  selector: 'app-projet-list',
  standalone: true,
  imports: [
    CommonModule,
    TitleCasePipe,
    CurrencyPipe,
    DatePipe,
    NgClass,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatPaginator,
    MatDivider,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule
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
    'valeurTotale',
    'statut',
    'actions'
  ];

  readonly statusOptions: ProjetStatusFilter[] = [
    'ALL',
    'BROUILLON',
    'EN_COURS',
    'VALIDE',
    'ANNULE'
  ];

  readonly loading = signal(false);
  readonly searching = signal(false);
  readonly allRows = signal<ProjetDto[]>([]);
  readonly statusFilter = signal<ProjetStatusFilter>('ALL');
  readonly searchCode = signal('');

  readonly rows = computed(() => {
    const selectedStatus = this.statusFilter();
    const data = this.allRows();

    if (selectedStatus === 'ALL') {
      return data;
    }

    return data.filter(row => this.normalizeStatus(row.statut) === selectedStatus);
  });

  readonly totalElements = computed(() => this.rows().length);

  pageSize = 10;

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

  onDelete(row: ProjetDto): void {
    if (!row?.id) return;

    if (!confirm(`Supprimer le projet "${row.code ?? row.clientNom}" ?`)) {
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
  }

  onSearchCodeInput(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.searchCode.set(value);
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
              alert('Erreur lors du changement de statut : ' + (err.message || 'Erreur inconnue'));
              this.loading.set(false);
            }
          });
      });
  }

  onPageChange(event: { pageSize: number }): void {
    this.pageSize = event.pageSize;
  }

  onAddOF(row: ProjetDto): void {
    if (!row?.id) {
      return;
    }

    this.router.navigate(['/of/nouveau'], {
      queryParams: { projetId: row.id }
    });
  }
}

