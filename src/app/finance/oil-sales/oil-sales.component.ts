import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '../../shared/services/toast.service';
import { CommonModule } from '@angular/common';
import { OilSaleService } from '../service/oil-sale.service';
import { OilSale } from '../models/oil-sale.model';
import { DashboardConfig } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { OIL_SALES_DASHBOARD_CONFIG } from './oil-sales-dashboard.config';
import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';
import { getBonCommandeHuileConfig } from './Oil-COMMAND-pdf-config';
import { PdfGeneratorService } from '../../shared/services/pdf-generator.service';

@Component({
  selector: 'app-oil-sales',
  standalone: true,
  templateUrl: './oil-sales.component.html',
  imports: [CommonModule, OsmDashboard]
})
export class OilSalesComponent implements OnInit {
  dashboardConfig: DashboardConfig = OIL_SALES_DASHBOARD_CONFIG;

  constructor(
    private oilSaleService: OilSaleService,
    private router: Router,
    private pdfService: PdfGeneratorService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    // Component initialization
  }

  handleAction(event: { action: string; row: OilSale }): void {
    switch (event.action.toUpperCase()) {
      case 'READ':
        this.router.navigate(['/finance/oil-sales', event.row.id, 'view']);
        break;

      case 'UPDATE':
        this.router.navigate(['/finance/oil-sales', event.row.id, 'edit']);
        break;

      case 'CONFIRM':
        this.confirmOilSale(event.row);
        break;

      case 'CANCEL':
        this.cancelOilSale(event.row);
        break;
      case 'GEN_PDF_BON_COMMANDE':
        if (event.row) {
          const config = getBonCommandeHuileConfig(event.row);
          this.pdfService.generatePdf(config);
        }
        break;

      case 'DELIVER':
        this.deliverOilSale(event.row);
        break;
      case 'GEN_INVOICE':
        this.generateInvoice(event.row);
        break;
    }
  }

  private confirmOilSale(oilSale: OilSale): void {
    if (oilSale.id) {
      this.oilSaleService.confirmOilSale(oilSale.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.toast.success();
          } else {
            this.toast.error(response.message || 'Error confirming oil sale');
          }
        },
        error: (error) => {
          console.error('Error confirming oil sale:', error);
          this.toast.error('Error confirming oil sale');
        }
      });
    }
  }

  private cancelOilSale(oilSale: OilSale): void {
    if (oilSale.id) {
      this.oilSaleService.cancelOilSale(oilSale.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.toast.success();
          } else {
            this.toast.error(response.message || 'Error cancelling oil sale');
          }
        },
        error: (error) => {
          console.error('Error cancelling oil sale:', error);
          this.toast.error('Error cancelling oil sale');
        }
      });
    }
  }

  private deliverOilSale(oilSale: OilSale): void {
    if (oilSale.id) {
      this.oilSaleService.deliverOilSale(oilSale.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.toast.success();
          } else {
            this.toast.error(response.message || 'Error delivering oil sale');
          }
        },
        error: (error) => {
          console.error('Error delivering oil sale:', error);
          this.toast.error('Error delivering oil sale');
        }
      });
    }
  }

  private generateInvoice(oilSale: OilSale): void {
    try {
      // this.invoiceService.generateOilSaleInvoice(oilSale as any);
      this.toast.success('Facture générée');
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      this.toast.error('Erreur lors de la génération de la facture');
    }
  }
}
