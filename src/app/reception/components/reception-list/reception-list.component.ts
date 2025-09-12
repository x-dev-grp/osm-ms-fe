import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {OsmDashboard} from '../../../shared/modules/osm-dashboard/osm-dashboard';
import {LIST_RECEPTION_DASHBOARD} from './LIST_RECEPTION_DASHBOARD';
import {UnifiedDelivery} from '../../../shared/models/UnifiedDelivery';
import {UnifiedDeliveryService} from '../../../shared/services/delivery.service';
import {tap} from 'rxjs';
import {Router} from '@angular/router';
import {PdfGeneratorService} from '../../../shared/services/pdf-generator.service';
import {getProductionPdfConfig} from "./production-pdf.config";
import {ToastService} from '../../../shared/services/toast.service';
import {getOlivePdfConfig} from '../olive-reception/olive-pdf.config';
import {getControlQualitePdfConfig} from "../quality-control-list/PDF-controlQualite.config";

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

      case 'OIL_QUALITY':
        if (event.row.id) {
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
    const config = getProductionPdfConfig(delivery);
    this.pdfGeneratorService.generatePdf(config);
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
