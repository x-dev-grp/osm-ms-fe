import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { Fournisseur } from '../../../models/fournisseur.model';
import { FournisseurService } from '../../../services/fournisseur.service';
import { OsmDashboard } from '../../../../shared/modules/osm-dashboard/osm-dashboard';
import { DashboardConfig } from '../../../../shared/modules/osm-dashboard/models/dashboard-config';
import { FOURNISSEUR_DASHBOARD_CONFIG } from './fournisseur-dashboard.config';

@Component({
  selector: 'app-fournisseur-list',
  standalone: true,
  imports: [TranslateModule, OsmDashboard],
  templateUrl: './fournisseur-list.component.html',
  styleUrls: ['./fournisseur-list.component.scss']
})
export class FournisseurListComponent {
  @ViewChild('dashboard') dashboard!: OsmDashboard;

  dashboardConfig: DashboardConfig = FOURNISSEUR_DASHBOARD_CONFIG;

  constructor(
    private readonly fournisseurService: FournisseurService,
    private readonly router: Router
  ) {}

  handleAction(event: { row: Fournisseur; action: string }): void {
    const fournisseur = event.row;

    switch (event.action) {
      case 'READ':
        void this.router.navigate(['/stock/fournisseurs', fournisseur.id]);
        break;
      case 'UPDATE':
        void this.router.navigate(['/stock/fournisseurs', fournisseur.id, 'edit']);
        break;
      case 'TOGGLE_ACTIVE':
        this.toActif(fournisseur);
        break;
    }
  }

  private toActif(fournisseur: Fournisseur): void {
    if (!fournisseur.id) {
      return;
    }

    const action = fournisseur.actif ? 'desactiver' : 'activer';
    if (!confirm(`Voulez-vous ${action} le fournisseur "${fournisseur.nom}" ?`)) {
      return;
    }

    const request = fournisseur.actif
      ? this.fournisseurService.desactiverFournisseur(fournisseur.id)
      : this.fournisseurService.activerFournisseur(fournisseur.id);

    request.subscribe({
      next: () => this.dashboard?.refrechData(),
      error: (error) => console.error('Erreur changement statut:', error)
    });
  }
}
