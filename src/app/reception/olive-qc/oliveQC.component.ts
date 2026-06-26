import { Component } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { UnifiedDelivery } from '../../shared/models/UnifiedDelivery';
import { DashboardConfig } from '../../shared/modules/oosm-dashboard/models/dashboard-config';
import { OosmDashboard } from '../../shared/modules/oosm-dashboard/oosm-dashboard';
import { DocumentGenerationService } from '../../shared/services/document-generation.service';
import { OliveQCDASHBOARD_olive } from './oliveQC.DASHBOARD_olive';

@Component({
  selector: 'app-qc-deliveries-table',
  templateUrl: './oliveQC.component.html',
  standalone: true,
  imports: [OosmDashboard],
  providers: [DecimalPipe, DatePipe]
})
export class OliveQCComponent {
  dashboardConfig: DashboardConfig = OliveQCDASHBOARD_olive;

  constructor(
    private router: Router,
    private documentGenerationService: DocumentGenerationService
  ) {}

  onRowAction(event: { row: UnifiedDelivery; action: string }): void {
    switch (event.action) {
      case 'READ':
        this.router.navigate(['/reception/reception-details', event.row.id]);
        break;
      case 'OLIVE_QUALITY':
      case 'QUALITY':
        this.router.navigate(['reception/quality', event.row.id]);
        break;
      case 'GEN_PDF':
      case 'GEN_PDF_QC_OLIVE':
        if (event.row?.id) {
          this.documentGenerationService.downloadQualityControlPdf(event.row.id);
        }
        break;
    }
  }
}
