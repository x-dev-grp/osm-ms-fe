import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { EmplacementStock } from '../../../models/emplacement-stock.model';
import { EmplacementStockService } from '../../../services/emplacement-stock.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { extractHttpErrorMessage } from '../../../../shared/utils/http-error.util';
import { OosmDashboard } from '../../../../shared/modules/oosm-dashboard/oosm-dashboard';
import { DashboardConfig } from '../../../../shared/modules/oosm-dashboard/models/dashboard-config';
import { EMPLACEMENT_DASHBOARD_CONFIG } from './emplacement-dashboard.config';

@Component({
  selector: 'app-emplacement-list',
  standalone: true,
  imports: [TranslateModule, OosmDashboard],
  templateUrl: './emplacement-list.component.html',
  styleUrls: ['./emplacement-list.component.scss']
})
export class EmplacementListComponent {
  @ViewChild('dashboard') dashboard!: OosmDashboard;

  dashboardConfig: DashboardConfig = EMPLACEMENT_DASHBOARD_CONFIG;
  error: string | null = null;

  constructor(
    private readonly emplacementService: EmplacementStockService,
    private readonly toast: ToastService,
    private readonly router: Router
  ) {}

  handleAction(event: { row: EmplacementStock; action: string }): void {
    const emplacement = event.row;

    switch (event.action) {
      case 'READ':
        void this.router.navigate(['/stock/emplacements', emplacement.id]);
        break;
      case 'UPDATE':
        void this.router.navigate(['/stock/emplacements', emplacement.id, 'edit']);
        break;
      case 'TOGGLE_ACTIVE':
        this.toActif(emplacement);
        break;
      case 'REMOVE':
        this.deleteEmplacement(emplacement);
        break;
    }
  }

  private toActif(emplacement: EmplacementStock): void {
    if (!emplacement.id) {
      return;
    }

    const isActif = emplacement.actif;
    const action = isActif ? 'desactiver' : 'activer';

    if (!confirm(`Voulez-vous vraiment ${action} l'emplacement "${emplacement.code}" ?`)) {
      return;
    }

    const request = isActif
      ? this.emplacementService.desactiverEmplacement(emplacement.id)
      : this.emplacementService.activerEmplacement(emplacement.id);

    request.subscribe({
      next: () => {
        this.dashboard?.refrechData();
        this.toast.success('AUTO.EMPLACEMENT_AVEC_SUCCES', {
          value0: isActif ? 'AUTO.DESACTIVE' : 'ADMIN_DASHBOARD.HERO.ACTIVE'
        });
      },
      error: (err) => {
        console.error(`Erreur lors de la ${action}`, err);
        this.error = extractHttpErrorMessage(err, `Erreur lors de l'${action} de l'emplacement`);
      }
    });
  }

  private deleteEmplacement(emplacement: EmplacementStock): void {
    if (!emplacement.id) {
      return;
    }

    if (!confirm(`Voulez-vous vraiment supprimer l'emplacement "${emplacement.code}" ?`)) {
      return;
    }

    this.emplacementService.deleteEmplacement(emplacement.id).subscribe({
      next: () => {
        this.dashboard?.refrechData();
        this.toast.success('AUTO.EMPLACEMENT_SUPPRIME_AVEC_SUCCES');
      },
      error: (err) => {
        console.error("Erreur lors de la suppression de l'emplacement", err);
        this.error = extractHttpErrorMessage(err, 'Impossible de supprimer cet emplacement');
      }
    });
  }
}
