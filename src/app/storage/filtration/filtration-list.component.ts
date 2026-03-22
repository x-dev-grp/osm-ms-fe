import {
  ChangeDetectionStrategy, Component, DestroyRef, inject, signal, ViewChild,
} from '@angular/core';
import {CommonModule, DatePipe, DecimalPipe} from '@angular/common';
import {Router} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatTableModule} from '@angular/material/table';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatChipsModule} from '@angular/material/chips';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

import {FiltrationApiService} from '../../shared/services/filtration-api.service';
import {FiltrationOperation} from '../../shared/models/filtration-operation';
import {FiltrationStatus, FILTRATION_STATUS_LABEL} from '../../shared/models/filtration-status';
import {FiltrationStatusDialogComponent} from './filtration-status-dialog/filtration-status-dialog.component';
import {FiltrationDeleteDialogComponent} from './filtration-delete-dialog/filtration-delete-dialog.component';
import {MatPaginator} from "@angular/material/paginator";
import {MatDivider} from "@angular/material/divider";

@Component({
  selector: 'app-filtration-list',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe,

    MatDialogModule, MatTableModule, MatButtonModule, MatIconModule, MatMenuModule, MatFormFieldModule, MatSelectModule, MatChipsModule, MatProgressSpinnerModule,MatPaginator, MatDivider,],
  templateUrl: './filtration-list.component.html',
  styleUrls: ['./filtration-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush, // Optimisation: évite les checks inutiles.
})
export class FiltrationListComponent {
  // Colonnes du tableau.
  readonly displayedColumns: string[] = ['timestamp', 'source', 'target', 'volumeFiltered', 'volumeAfter', 'lossPercent', 'status', 'actions',];
  // Options du filtre.
  readonly statusOptions: Array<FiltrationStatus | 'ALL'> = ['ALL', 'CREATED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED',];
  // Objectif: éviter les subscriptions manuelles + rendre l’état très explicite.
  readonly loading = signal(false);
  readonly rows = signal<FiltrationOperation[]>([]);
  readonly statusFilter = signal<FiltrationStatus | 'ALL'>('ALL');

  // Propriétés pour la pagination
  pageSize = 10;
  totalElements = signal(0);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private readonly destroyRef = inject(DestroyRef);

  // Signals (Angular 16+ / optimisé Angular 19)
  private readonly api = inject(FiltrationApiService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  constructor() {
    // Chargement initial au moment de l’instanciation du composant.
    this.load();
  }

  // Charge la liste (avec ou sans filtre).
  load(): void {
    this.loading.set(true);

    const filter = this.statusFilter();

    const req$ = filter === 'ALL' ? this.api.getAll() : this.api.getByStatus(filter);

    req$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.rows.set(data ?? []);
        this.totalElements.set(data?.length ?? 0);
        this.loading.set(false);
      }, error: () => {
        // En cas d’erreur, on vide la liste et on coupe le loading.
        this.rows.set([]);
        this.totalElements.set(0);
        this.loading.set(false);
      },
    });
  }

  // Gestion du changement de filtre (on évite ngModel => pas besoin de FormsModule).
  onStatusChange(value: FiltrationStatus | 'ALL'): void {
    this.statusFilter.set(value);
    this.load();
  }

  // Libellé lisible (UI).
  statusLabel(status: string): string {
    const s = status as FiltrationStatus;
    return FILTRATION_STATUS_LABEL[s] ?? status;
  }

  // Règle: édition autorisée seulement si l’opération n’est pas IN_PROGRESS.
  canEdit(row: FiltrationOperation): boolean {
    return (row.status as string) !== 'IN_PROGRESS';
  }

  // Démarrage autorisé seulement si CREATED.
  canStart(row: FiltrationOperation): boolean {
    return (row.status as string) === 'CREATED';
  }

  // Navigation vers création.
  onCreate(): void {
    this.router.navigate(['storage', 'oil-filtering', 'new']);
  }

  // Navigation vers édition.
  onEdit(row: FiltrationOperation): void {
    if (!this.canEdit(row)) return;
    this.router.navigate(['storage', 'oil-filtering', row.operationId, 'edit']);
  }

  // Démarre l’opération puis recharge la liste.
  onStart(row: FiltrationOperation): void {
    if (!this.canStart(row)) return;

    this.loading.set(true);
    this.api.start(row.operationId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.load(), error: () => this.loading.set(false),
    });
  }

  // Ouvre le dialogue “changer statut / terminer”.
  onChangeStatus(row: FiltrationOperation): void {
    const ref = this.dialog.open(FiltrationStatusDialogComponent, {
      width: '520px', data: {row},
    });

    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((changed: boolean) => {
      if (changed) this.load();
    });
  }

  // Ouvre la confirmation puis supprime.
  onDelete(row: FiltrationOperation): void {
    const ref = this.dialog.open(FiltrationDeleteDialogComponent, {
      width: '420px', data: {row},
    });

    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.loading.set(true);
      this.api.delete(row.operationId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => this.load(), error: () => this.loading.set(false),
      });
    });
  }

  // Gestion du changement de page
  onPageChange(event: any): void {
    this.pageSize = event.pageSize;
    // Ici vous pouvez implémenter la logique de pagination côté serveur si nécessaire
    // Par défaut, on utilise juste les données déjà chargées
  }

  // trackBy pour améliorer les performances lors du rendu de listes.
  trackByOperationId(_: number, row: FiltrationOperation): string {
    return row.operationId;
  }
}
