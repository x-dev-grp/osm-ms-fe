import { Component, inject, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { FinalProduct, finalProductDisplayName } from '../../../models/final-product.model';
import { FinalProductService } from '../../../services/final-product.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmationDialogService, ConfirmationType } from '../../../../shared/services/confirmation-dialog.service';
import { OsmDashboard } from '../../../../shared/modules/osm-dashboard/osm-dashboard';
import { DashboardConfig } from '../../../../shared/modules/osm-dashboard/models/dashboard-config';
import { SKU_DASHBOARD_CONFIG } from './sku-dashboard.config';

@Component({
  selector: 'app-sku-list',
  standalone: true,
  imports: [TranslateModule, OsmDashboard],
  templateUrl: './sku-list.component.html',
  styleUrls: ['./sku-list.component.scss']
})
export class SkuListComponent {
  private readonly i18n = inject(TranslateService);

  @ViewChild('dashboard') dashboard!: OsmDashboard;

  dashboardConfig: DashboardConfig = SKU_DASHBOARD_CONFIG;

  constructor(
    private readonly finalProductService: FinalProductService,
    private readonly toast: ToastService,
    private readonly confirmationDialog: ConfirmationDialogService,
    public readonly router: Router
  ) {}

  handleAction(event: { row: FinalProduct; action: string }): void {
    const finalProduct = event.row;

    switch (event.action) {
      case 'READ':
        void this.router.navigate(['/stock/products', finalProduct.id]);
        break;
      case 'UPDATE':
        void this.router.navigate(['/stock/products', finalProduct.id, 'edit']);
        break;
      case 'TOGGLE_ACTIVE':
        this.toActif(finalProduct);
        break;
      case 'REMOVE':
        this.deleteFinalProduct(finalProduct);
        break;
    }
  }

  private toActif(finalProduct: FinalProduct): void {
    if (!finalProduct.id) {
      return;
    }

    const isCurrentlyActif = finalProduct.actif === true;
    const action = isCurrentlyActif ? 'desactiver' : 'activer';

    this.confirmationDialog
      .confirm({
        title: this.i18n.instant('STANDARD.CONFIRMATION.SIMPLE.TITLE'),
        message: `Voulez-vous vraiment ${action} le produit "${finalProductDisplayName(finalProduct)}" ?`,
        type: ConfirmationType.WARNING,
        confirmText: isCurrentlyActif ? this.i18n.instant('AUTO.DESACTIVER') : this.i18n.instant('AUTO.ACTIVER'),
        cancelText: this.i18n.instant('ADMIN.CANCEL'),
        showIcon: true,
        destructive: isCurrentlyActif
      })
      .subscribe((result) => {
        if (!result?.confirmed) {
          return;
        }

        const request = isCurrentlyActif
          ? this.finalProductService.deactivateFinalProduct(finalProduct.id!)
          : this.finalProductService.activateFinalProduct(finalProduct.id!);

        request.subscribe({
          next: () => {
            this.dashboard?.refrechData();
            this.toast.success('AUTO.PRODUIT_AVEC_SUCCES', {
              value0: isCurrentlyActif ? 'AUTO.DESACTIVE' : 'ADMIN_DASHBOARD.HERO.ACTIVE'
            });
          },
          error: (err) => console.error('Erreur changement statut produit:', err)
        });
      });
  }

  private deleteFinalProduct(finalProduct: FinalProduct): void {
    if (!finalProduct.id) {
      return;
    }

    this.confirmationDialog
      .confirmDelete(
        finalProductDisplayName(finalProduct),
        `Voulez-vous vraiment supprimer le produit "${finalProductDisplayName(finalProduct)}" ?`
      )
      .subscribe((result) => {
        if (!result?.confirmed) {
          return;
        }

        this.finalProductService.deleteFinalProduct(finalProduct.id!).subscribe({
          next: () => {
            this.dashboard?.refrechData();
            this.toast.success('AUTO.PRODUIT_SUPPRIME_AVEC_SUCCES');
          },
          error: (err) => console.error('Erreur suppression produit:', err)
        });
      });
  }
}
