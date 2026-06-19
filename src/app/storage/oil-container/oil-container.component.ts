import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { SharedModule } from '../../shared/shared.module';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';
import { DashboardConfig } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { dashboardConfig } from './Oil-container-dashboard.config';
import { Router } from '@angular/router';
import { OilContainer } from '../../shared/models/oil-container';
import { OilContainerService } from '../../shared/services/oil-Container.service';
import { ToastService } from '../../shared/services/toast.service';
import {
  OilContainerPurchaseDialogComponent,
  OilContainerPurchaseDialogData,
  OilContainerPurchaseFormValue
} from './oil-container-purchase-dialog/oil-container-purchase-dialog.component';
import { filter } from 'rxjs';

@Component({
  selector: 'app-oil-container',
  imports: [CommonModule, MatTableModule, MatIconModule, SharedModule, TranslateModule, OsmDashboard],
  templateUrl: './oil-container.component.html',
  standalone: true,
  styleUrl: './oil-container.component.scss'
})
export class OilContainerComponent {
  @ViewChild('dashboard') dashboard!: OsmDashboard;
  loading = false;
  dashboardConfig: DashboardConfig = dashboardConfig;

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private oilContainerService: OilContainerService,
    private toast: ToastService,
    private translate: TranslateService
  ) {}

  handleAction(event: { row: OilContainer; action: string }): void {
    switch (event.action) {
      case 'READ':
        this.router.navigate(['/storage/oil-container', event.row.id, 'view']);
        break;

      case 'UPDATE':
        this.router.navigate(['/storage/oil-container', event.row.id, 'edit']);
        break;

      case 'ENTREE_STOCK':
        this.openPurchaseDialog(event.row);
        break;
    }
  }

  private openPurchaseDialog(container: OilContainer): void {
    if (!container.id) {
      return;
    }

    this.dialog
      .open(OilContainerPurchaseDialogComponent, {
        width: '520px',
        maxWidth: '95vw',
        disableClose: true,
        data: { container } satisfies OilContainerPurchaseDialogData
      })
      .afterClosed()
      .pipe(filter((result): result is OilContainerPurchaseFormValue => !!result))
      .subscribe({
        next: (purchase) => {
          this.loading = true;
          this.oilContainerService.purchase(container.id!, purchase).subscribe({
            next: (response) => {
              this.loading = false;
              if (response.success) {
                this.toast.success(response.message || this.translate.instant('OIL_CONTAINER.PURCHASE.SUCCESS'));
                this.dashboard?.refrechData();
              } else {
                this.toast.error(response.message || 'OIL_CONTAINER.PURCHASE.ERROR');
              }
            },
            error: () => {
              this.loading = false;
              this.toast.error('OIL_CONTAINER.PURCHASE.ERROR');
            }
          });
        }
      });
  }
}
