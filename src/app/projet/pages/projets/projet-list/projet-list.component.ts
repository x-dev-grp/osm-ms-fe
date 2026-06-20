import { Component, DestroyRef, inject, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ProjetService } from '../../../services/projet.service';
import { ProjetDto } from '../../../models/TypeProduit';
import { ProjetStatusDialogComponent, ProjetStatusDialogResult } from '../projet-status-dialog/projet-status-dialog.component';
import { OsmDashboard } from '../../../../shared/modules/osm-dashboard/osm-dashboard';
import { DashboardConfig } from '../../../../shared/modules/osm-dashboard/models/dashboard-config';
import { PROJET_DASHBOARD_CONFIG } from './projet-dashboard.config';

type ProjetStatusFilter = 'ALL' | 'BROUILLON' | 'EN_COURS' | 'VALIDE' | 'ANNULE' | 'FAILED';

@Component({
  selector: 'app-projet-list',
  standalone: true,
  imports: [TranslateModule, MatDialogModule, OsmDashboard],
  templateUrl: './projet-list.component.html',
  styleUrls: ['./projet-list.component.scss']
})
export class ProjetListComponent {
  private readonly i18n = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly projetService = inject(ProjetService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  @ViewChild('dashboard') dashboard!: OsmDashboard;

  dashboardConfig: DashboardConfig = PROJET_DASHBOARD_CONFIG;

  handleAction(event: { row: ProjetDto; action: string }): void {
    switch (event.action) {
      case 'READ':
        this.onViewDetails(event.row);
        break;
      case 'UPDATE':
        this.onEdit(event.row);
        break;
      case 'EXPEDITION':
        this.onOpenExpedition(event.row);
        break;
      case 'ADD_OF':
        this.onAddOF(event.row);
        break;
      case 'STATUS':
        this.openStatusDialog(event.row);
        break;
      case 'REMOVE':
        this.onDelete(event.row);
        break;
    }
  }

  private onEdit(row: ProjetDto): void {
    void this.router.navigate(['/projets', row.id]);
  }

  private onViewDetails(row: ProjetDto): void {
    void this.router.navigate(['/projets/detail', row.id]);
  }

  private onOpenExpedition(row: ProjetDto): void {
    if (!row?.id) {
      return;
    }

    if (row.statut === 'FAILED') {
      alert(this.i18n.instant('AUTO.ACTION_IMPOSSIBLE_LE_PROJET_EST_BLOQUE_CONSULTEZ_LE_DETAIL_POUR_'));
      return;
    }

    void this.router.navigate(['/projets/detail', row.id, 'expedition']);
  }

  private onDelete(row: ProjetDto): void {
    if (!row?.id) {
      return;
    }

    if (!confirm(`Supprimer le projet "${row.code ?? row.client?.nom}" ?`)) {
      return;
    }

    this.projetService
      .delete(row.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.dashboard?.refrechData(),
        error: (err) => console.error(err)
      });
  }

  private normalizeStatus(statut?: string): ProjetStatusFilter {
    const value = (statut ?? '').trim().toUpperCase();

    if (value === 'CREATED' || value === 'BROUILLON') return 'BROUILLON';
    if (value === 'IN_PROGRESS' || value === 'EN_COURS') return 'EN_COURS';
    if (value === 'COMPLETED' || value === 'VALIDE' || value === 'ACCEPTE') return 'VALIDE';
    if (value === 'CANCELLED' || value === 'ANNULE') return 'ANNULE';
    if (value === 'FAILED') return 'FAILED';

    return 'BROUILLON';
  }

  private canChangeStatus(row: ProjetDto): boolean {
    const status = this.normalizeStatus(row.statut);
    return status === 'BROUILLON' || status === 'EN_COURS';
  }

  private openStatusDialog(row: ProjetDto): void {
    if (!row?.id) {
      return;
    }

    if (!this.canChangeStatus(row)) {
      alert(this.i18n.instant('AUTO.CHANGEMENT_DE_STATUT_NON_AUTORISE_POUR_CE_PROJET'));
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

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (!result?.status) {
          return;
        }

        this.projetService
          .updateStatus(row.id, result.status)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => this.dashboard?.refrechData(),
            error: (err) => console.error('Erreur API lors du changement de statut:', err)
          });
      });
  }

  private onAddOF(row: ProjetDto): void {
    if (!row?.id) {
      return;
    }

    void this.router.navigate(['/of/nouveau'], {
      queryParams: { projetId: row.id }
    });
  }
}
