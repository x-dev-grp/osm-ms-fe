import { Component, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { UnifiedDelivery } from '../../shared/models/UnifiedDelivery';
import { DashboardConfig } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';
import { Router } from '@angular/router';
import { PdfGeneratorService } from '../../shared/services/pdf-generator.service';
import { OliveQCDASHBOARD_olive } from './oliveQC.DASHBOARD_olive';
import { getControlQualitePdfConfig } from '../pdf-config/controlQualite.config';

@Component({
  selector: 'app-qc-deliveries-table',
  templateUrl: './oliveQC.component.html',
  standalone: true,
  imports: [OsmDashboard],
  providers: [DecimalPipe, DatePipe]
})
export class OliveQCComponent implements OnInit {
  dashboardConfig: DashboardConfig = OliveQCDASHBOARD_olive;

  constructor(
    private router: Router,
    private pdfService: PdfGeneratorService
  ) {}

  ngOnInit(): void {}

  onRowAction(event: { row: UnifiedDelivery; action: any }): void {
    switch (event.action) {
      case 'READ':
        this.viewDelivery(event.row);
        break;
      case 'GEN_PDF':
        if (event.row) {
          this.generateBonControleQualite(event.row);
        }
        break;
      case 'GEN_PDF_QC_OLIVE':
        console.log(`[OilReception] Generating PDF for delivery: ${event.row.lotNumber}`);
        const deliveryType = event.row.deliveryType?.toUpperCase() || '';
        const config = getControlQualitePdfConfig(event.row, deliveryType);
        this.pdfService.generatePdf(config);
    }
  }

  generateBonControleQualite(delivery: UnifiedDelivery): void {
    const deliveryType = delivery.deliveryType?.toUpperCase() || '';
    const config = getControlQualitePdfConfig(delivery, deliveryType);
    this.pdfService.generatePdf(config);
  }

  private startQualityControl(delivery: UnifiedDelivery): void {
    this.router.navigate(['/reception/quality', delivery.id]);
  }

  private viewDelivery(delivery: UnifiedDelivery): void {
    this.router.navigate(['/reception/reception-details', delivery.id]);
  }
}
