import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { LigneConditionnement } from '../../../models/ligne-conditionnement.model';
import { LigneConditionnementService } from '../../../services/ligne-conditionnement.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { OsmDashboard } from '../../../../shared/modules/osm-dashboard/osm-dashboard';
import { DashboardConfig } from '../../../../shared/modules/osm-dashboard/models/dashboard-config';
import { LIGNE_DASHBOARD_CONFIG } from './ligne-dashboard.config';

@Component({
  selector: 'app-ligne-list',
  standalone: true,
  imports: [TranslateModule, OsmDashboard],
  templateUrl: './ligne-list.component.html',
  styleUrls: ['./ligne-list.component.scss']
})
export class LigneListComponent {
  @ViewChild('dashboard') dashboard!: OsmDashboard;

  dashboardConfig: DashboardConfig = LIGNE_DASHBOARD_CONFIG;

  constructor(
    private readonly ligneService: LigneConditionnementService,
    private readonly toast: ToastService,
    public readonly router: Router
  ) {}

  handleAction(event: { row: LigneConditionnement; action: string }): void {
    switch (event.action) {
      case 'READ':
        void this.router.navigate(['/stock/lignes', event.row.id]);
        break;
      case 'UPDATE':
        void this.router.navigate(['/stock/lignes', event.row.id, 'edit']);
        break;
      case 'TOGGLE_ACTIVE':
        this.toggleActif(event.row);
        break;
    }
  }

  private toggleActif(ligne: LigneConditionnement): void {
    if (!ligne.id) {
      return;
    }

    const isCurrentlyActif = ligne.actif === true;
    const action = isCurrentlyActif ? 'desactiver' : 'activer';

    if (!confirm(`Voulez-vous vraiment ${action} la ligne "${ligne.nom}" ?`)) {
      return;
    }

    const serviceCall = isCurrentlyActif ? this.ligneService.desactiverLigne(ligne.id) : this.ligneService.activerLigne(ligne.id);

    serviceCall.subscribe({
      next: () => {
        this.toast.success('AUTO.LIGNE', {
          value0: ligne.nom,
          value1: isCurrentlyActif ? 'AUTO.DESACTIVEE' : 'AUTO.ACTIVEE'
        });
        this.dashboard?.refrechData();
      },
      error: (err) => console.error('Erreur changement statut:', err)
    });
  }
}
