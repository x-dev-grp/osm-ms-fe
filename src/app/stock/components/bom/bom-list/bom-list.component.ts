import { Component, inject, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { Bom } from '../../../models/Bom';
import { BomService } from '../../../services/BomService';
import { ToastService } from '../../../../shared/services/toast.service';
import { OosmDashboard } from '../../../../shared/modules/oosm-dashboard/oosm-dashboard';
import { DashboardConfig } from '../../../../shared/modules/oosm-dashboard/models/dashboard-config';
import { BOM_DASHBOARD_CONFIG } from './bom-dashboard.config';

@Component({
  selector: 'app-bom-list',
  standalone: true,
  imports: [TranslateModule, OosmDashboard],
  templateUrl: './bom-list.component.html',
  styleUrls: ['./bom-list.component.scss']
})
export class BomListComponent {
  private readonly i18n = inject(TranslateService);

  @ViewChild('dashboard') dashboard!: OosmDashboard;

  dashboardConfig: DashboardConfig = BOM_DASHBOARD_CONFIG;

  constructor(
    private readonly bomService: BomService,
    private readonly toast: ToastService,
    private readonly router: Router
  ) {}

  handleAction(event: { row: Bom; action: string }): void {
    switch (event.action) {
      case 'READ':
        void this.router.navigate(['/stock/boms', event.row.id]);
        break;
      case 'UPDATE':
        void this.router.navigate(['/stock/boms', event.row.id, 'editer']);
        break;
      case 'ACTIVATE':
        this.activateBom(event.row);
        break;
      case 'REMOVE':
        this.deleteBom(event.row.id);
        break;
    }
  }

  private activateBom(bom: Bom): void {
    if (!bom.id || bom.active) {
      return;
    }

    this.bomService.activate(bom.id).subscribe({
      next: () => {
        this.toast.success('AUTO.NOMENCLATURE_ACTIVEE', { value0: bom.version });
        this.dashboard?.refrechData();
      },
      error: (err) => console.error('Erreur activation nomenclature', err)
    });
  }

  private deleteBom(id?: string): void {
    if (!id) {
      return;
    }

    if (!confirm(this.i18n.instant('AUTO.ETES_VOUS_SUR_DE_VOULOIR_SUPPRIMER_CETTE_NOMENCLATURE'))) {
      return;
    }

    this.bomService.delete(id).subscribe({
      next: () => {
        this.toast.success('AUTO.NOMENCLATURE_SUPPRIMEE');
        this.dashboard?.refrechData();
      },
      error: (err) => console.error('Erreur lors de la suppression de la nomenclature', err)
    });
  }
}
