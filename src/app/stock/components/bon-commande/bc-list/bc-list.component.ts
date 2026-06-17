import { Component, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { BonCommande } from '../../../models/bon-commande.model';
import { BonCommandeService } from '../../../services/bon-commande.service';
import { extractHttpErrorMessage } from '../../../../shared/utils/http-error.util';
import { OsmDashboard } from '../../../../shared/modules/osm-dashboard/osm-dashboard';
import { DashboardConfig } from '../../../../shared/modules/osm-dashboard/models/dashboard-config';
import { BC_DASHBOARD_CONFIG } from './bc-dashboard.config';

@Component({
  selector: 'app-bc-list',
  standalone: true,
  imports: [TranslateModule, OsmDashboard],
  templateUrl: './bc-list.component.html',
  styleUrls: ['./bc-list.component.scss']
})
export class BcListComponent {
  private readonly i18n = inject(TranslateService);

  @ViewChild('dashboard') dashboard!: OsmDashboard;

  dashboardConfig: DashboardConfig = BC_DASHBOARD_CONFIG;
  error: string | null = null;

  constructor(
    private readonly bonCommandeService: BonCommandeService,
    private readonly router: Router
  ) {}

  handleAction(event: { row: BonCommande; action: string }): void {
    switch (event.action) {
      case 'READ':
        this.viewBon(event.row.id);
        break;
      case 'VALIDATE':
        this.validerBon(event.row.id);
        break;
      case 'REFUSE':
        this.refuserBon(event.row.id);
        break;
    }
  }

  private viewBon(id?: string): void {
    if (id) {
      void this.router.navigate(['/stock/bons-commande', id]);
    }
  }

  private validerBon(id?: string): void {
    if (!id || !confirm(this.i18n.instant('AUTO.VALIDER_CE_BON_DE_COMMANDE'))) {
      return;
    }

    this.bonCommandeService.validerBonCommande(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.dashboard?.refrechData();
        } else {
          this.error = response.message || 'Erreur lors de la validation';
        }
      },
      error: (err) => {
        this.error = extractHttpErrorMessage(err, 'Erreur serveur lors de la validation');
      }
    });
  }

  private refuserBon(id?: string): void {
    if (!id) {
      return;
    }

    const motif = prompt(this.i18n.instant('AUTO.MOTIF_DE_REFUS'));
    if (!motif) {
      return;
    }

    this.bonCommandeService.refuserBonCommande(id, motif).subscribe({
      next: (response) => {
        if (response.success) {
          this.dashboard?.refrechData();
        } else {
          this.error = response.message || 'Erreur lors du refus';
        }
      },
      error: (err) => {
        this.error = extractHttpErrorMessage(err, 'Erreur serveur lors du refus');
      }
    });
  }
}
