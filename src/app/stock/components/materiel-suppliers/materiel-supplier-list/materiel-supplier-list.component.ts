import { Component, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { take } from 'rxjs/operators';
import { MaterielSupplier } from '../../../models/materiel-supplier.model';
import { MaterielSupplierService } from '../../../services/materiel-supplier.service';
import { OsmDashboard } from '../../../../shared/modules/osm-dashboard/osm-dashboard';
import { DashboardConfig } from '../../../../shared/modules/osm-dashboard/models/dashboard-config';
import { MATERIEL_SUPPLIER_DASHBOARD_CONFIG } from './materiel-supplier-dashboard.config';
import { ConfirmationDialogService, ConfirmationType } from '../../../../shared/services/confirmation-dialog.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-materiel-supplier-list',
  standalone: true,
  imports: [TranslateModule, OsmDashboard],
  templateUrl: './materiel-supplier-list.component.html',
  styleUrls: ['./materiel-supplier-list.component.scss']
})
export class MaterielSupplierListComponent {
  @ViewChild('dashboard') dashboard!: OsmDashboard;

  private readonly i18n = inject(TranslateService);
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  private readonly toastService = inject(ToastService);

  dashboardConfig: DashboardConfig = MATERIEL_SUPPLIER_DASHBOARD_CONFIG;

  constructor(
    private readonly materielSupplierService: MaterielSupplierService,
    private readonly router: Router
  ) {}

  handleAction(event: { row: MaterielSupplier; action: string }): void {
    const supplier = event.row;

    switch (event.action) {
      case 'READ':
        void this.router.navigate(['/stock/materiel-suppliers', supplier.id]);
        break;
      case 'UPDATE':
        void this.router.navigate(['/stock/materiel-suppliers', supplier.id, 'edit']);
        break;
      case 'TOGGLE_ACTIVE':
        this.toggleActive(supplier);
        break;
    }
  }

  private toggleActive(supplier: MaterielSupplier): void {
    if (!supplier.id) {
      return;
    }

    const activating = !supplier.actif;
    this.confirmationDialog.confirm({
      title: this.i18n.instant(activating
        ? 'MATERIEL_SUPPLIER.CONFIRM.ACTIVATE_TITLE'
        : 'MATERIEL_SUPPLIER.CONFIRM.DEACTIVATE_TITLE'),
      message: this.i18n.instant(activating
        ? 'MATERIEL_SUPPLIER.CONFIRM.ACTIVATE_MESSAGE'
        : 'MATERIEL_SUPPLIER.CONFIRM.DEACTIVATE_MESSAGE', { name: supplier.nom }),
      type: ConfirmationType.WARNING,
      confirmText: this.i18n.instant(activating
        ? 'MATERIEL_SUPPLIER.ACTIONS.ACTIVATE'
        : 'MATERIEL_SUPPLIER.ACTIONS.DEACTIVATE'),
      cancelText: this.i18n.instant('ADMIN.CANCEL'),
      showIcon: true
    }).pipe(take(1)).subscribe((result) => {
      if (!result?.confirmed) {
        return;
      }

      const request = activating
        ? this.materielSupplierService.activate(supplier.id!)
        : this.materielSupplierService.deactivate(supplier.id!);

      request.subscribe({
        next: () => {
          this.toastService.success(activating
            ? 'MATERIEL_SUPPLIER.MESSAGES.ACTIVATED'
            : 'MATERIEL_SUPPLIER.MESSAGES.DEACTIVATED');
          this.dashboard?.refrechData();
        },
        error: () => this.toastService.error('MATERIEL_SUPPLIER.ERRORS.STATUS_UPDATE_FAILED')
      });
    });
  }
}
