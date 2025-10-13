import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';
import { LIST_RECEPTION_DASHBOARD } from './LIST_RECEPTION_DASHBOARD';
import { UnifiedDelivery } from '../../shared/models/UnifiedDelivery';
import { UnifiedDeliveryService } from '../../shared/services/delivery.service';
import { tap } from 'rxjs';
import { Router } from '@angular/router';
import { PdfGeneratorService } from '../../shared/services/pdf-generator.service';
import { ToastService } from '../../shared/services/toast.service';
import { getControlQualitePdfConfig } from '../pdf-config/controlQualite.config';
import { getOlivePdfConfig } from '../pdf-config/reception-olive-pdf.config';
import { getProductionPdfConfig } from '../pdf-config/production-pdf.config';
// Import the new unified PDF services
// import { PdfConfigFactoryService } from '../../shared/services/pdf-config-factory.service';
// import { UnifiedPdfGeneratorService } from '../../shared/services/unified-pdf-generator.service';

@Component({
  selector: 'app-reception-list',
  standalone: true,
  imports: [CommonModule, OsmDashboard],
  templateUrl: './reception-list.component.html'
})
export class ReceptionListComponent {
  dashboardConfig = LIST_RECEPTION_DASHBOARD;

  constructor(
    private deliveryService: UnifiedDeliveryService,
    private _router: Router,
    private toast: ToastService,
    private pdfGeneratorService: PdfGeneratorService,
    // Inject the new services
    // private pdfConfigFactory: PdfConfigFactoryService,
    // private unifiedPdfGenerator: UnifiedPdfGeneratorService
  ) {}

  handleDashboardAction(event: { row: UnifiedDelivery; action: string }): void {
    switch (event.action) {
      case 'READ':
        this.viewDelivery(event.row);
        break;

      case 'UPDATE':
        // this.selectReception(event.row);
        break;

      case 'GEN_PDF':
        this.generateBonReception(event.row);
        break;
      case 'QUALITY':
        break;

      case 'GEN_PDF_QC_OIL':
        if (event.row.qualityControlResults && event.row.qualityControlResults.length > 0) {
          const config = getControlQualitePdfConfig(event.row, 'OIL');
          this.pdfGeneratorService.generatePdf(config);
          this.toast.success(`[OilReception] Generating GEN_PDF_QC_OIL PDF for delivery: ${event.row.lotNumber}`);
        } else {
          this.toast.error('no quality control for oil');
        }
        break;

      case 'GEN_PDF_QC_OLIVE':
        if (event.row.qualityControlResults && event.row.qualityControlResults.length > 0) {
          const config = getControlQualitePdfConfig(event.row, 'OLIVE');
          this.pdfGeneratorService.generatePdf(config);
          this.toast.success(`[OilReception] Generating quality control PDF for delivery: ${event.row.lotNumber}`);
        } else {
          this.toast.error('no quality control for olive');
        }
        break;

      case 'GEN_PDF_PRODUCTION':
        this.generateBonProduction(event.row);
        break;

      // Example of using the new unified PDF system
      case 'GEN_PDF_UNIFIED':
        this.generateUnifiedPdf(event.row);
        break;

      case 'OIL_QUALITY':
        if (event.row?.id) {
          this._router.navigate(['/reception/quality/oilFromOlive', event.row.id]);
        }
        break;
    }
  }

  generateBonReception(delivery: UnifiedDelivery): void {
    const config = getOlivePdfConfig(delivery);
    this.pdfGeneratorService.generatePdf(config);
  }

  generateBonProduction(delivery: UnifiedDelivery): void {
    const parameters = JSON.parse(localStorage.getItem('osm_app_parameters') || '{}');
    const config = getProductionPdfConfig(delivery, parameters);
    this.pdfGeneratorService.generatePdf(config);
  }

  // Example of using the new unified PDF system
  generateUnifiedPdf(delivery: UnifiedDelivery): void {
    try {
      // Using the factory to create a unified config
      // Note: You would need to determine the correct source type for your use case
      // const unifiedConfig = this.pdfConfigFactory.buildUnified(delivery, InvoiceSource.DELIVERY_inv);

      // For demonstration, we'll create a simple config directly
      const config = getOlivePdfConfig(delivery);

      // Convert the existing config to unified format
      // In a real implementation, you would use the factory method above
      // this.unifiedPdfGenerator.generatePdf(unifiedConfig);

      // For now, we'll just show a toast message to indicate the feature is available
      this.toast.success(`Unified PDF generation feature is ready for implementation`);
    } catch (error) {
      this.toast.error(`Error generating unified PDF: ${error}`);
    }
  }

  viewDelivery(row: UnifiedDelivery): void {
    if (row && row.id) {
      this._router.navigate(['/reception/reception-details', row.id]);
      console.log(row);
    }
  }

  private createOilReception(row: UnifiedDelivery) {
    this.deliveryService
      .createOilDeliveryFromOlive(row?.id)
      .pipe(
        tap((response: any) => {
          console.log(response);
          this._router.navigate(['/reception/quality', response?.data]);
        })
      )
      .subscribe();
  }
}
