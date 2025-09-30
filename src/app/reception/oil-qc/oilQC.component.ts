import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatTableModule} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';
import {MatDialogModule} from '@angular/material/dialog';
import {MatCardModule} from '@angular/material/card';
import {MatSortModule} from '@angular/material/sort';
import {Router} from '@angular/router';
import {SharedModule} from '../../shared/shared.module';
import {OsmDashboard} from '../../shared/modules/osm-dashboard/osm-dashboard';
import {DashboardConfig} from '../../shared/modules/osm-dashboard/models/dashboard-config';
 import {OilQCDASHBOARD} from './oilQC.DASHBOARD';
 import { PdfGeneratorService } from '../../shared/services/pdf-generator.service';
import { UnifiedDelivery } from '../../shared/models/UnifiedDelivery';
import { getControlQualitePdfConfig } from '../pdf-config/controlQualite.config';

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
export class OilQCComponent implements OnInit {
  dashboardConfig: DashboardConfig = OilQCDASHBOARD;

  constructor(private router: Router, private pdfService: PdfGeneratorService,) {
  }

  ngOnInit(): void {}

  onRowAction(event: { row: UnifiedDelivery; action: any }): void {
    switch (event.action) {
      case 'OLIVE_QUALITY':
      case 'OIL_QUALITY':
        this.startQualityControl(event.row);
        break;
      case 'READ':
        this.viewDelivery(event.row);
        break;
      case 'GEN_PDF':
        if (event.row) {
          this.generateBonControleQualite(event.row);
        }
        break;
      case 'GEN_PDF_QC_OIL':
        if (event.row.qualityControlResults) {
          const deliveryType = event.row.deliveryType?.toUpperCase() || '';
          const config = getControlQualitePdfConfig(event.row, deliveryType);
          this.pdfService.generatePdf(config);         }
        break;
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
