import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatSortModule } from '@angular/material/sort';
import { Router } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';
import { DashboardConfig } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { OilQCDASHBOARD } from './oilQC.DASHBOARD';
import { DocumentGenerationService } from '../../shared/services/document-generation.service';
import { UnifiedDelivery } from '../../shared/models/UnifiedDelivery';

@Component({
  selector: 'app-quality-control-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatCardModule,
    MatSortModule,
    SharedModule,
    OsmDashboard
  ],
  templateUrl: './oilQC.component.html'
})
export class OilQCComponent {
  dashboardConfig: DashboardConfig = OilQCDASHBOARD;

  constructor(
    private router: Router,
    private documentGenerationService: DocumentGenerationService
  ) {}

  onRowAction(event: { row: UnifiedDelivery; action: string }): void {
    switch (event.action) {
      case 'QUALITY':
      case 'OIL_QUALITY':
      case 'UPDATE_OIL_QUALITY':
        this.router.navigate(['/reception/quality', event.row.id]);
        break;
      case 'READ':
        this.router.navigate(['/reception/reception-details', event.row.id]);
        break;
      case 'GEN_PDF':
      case 'GEN_PDF_QC_OIL':
        if (event.row?.id) {
          this.documentGenerationService.downloadQualityControlPdf(event.row.id);
        }
        break;
    }
  }
}
