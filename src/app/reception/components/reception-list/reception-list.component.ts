import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {OsmDashboard} from '../../../shared/modules/osm-dashboard/osm-dashboard';
import {LIST_RECEPTION_DASHBOARD} from './LIST_RECEPTION_DASHBOARD';
import {UnifiedDelivery} from '../../../shared/models/UnifiedDelivery';
import {UnifiedDeliveryService} from '../../../shared/services/delivery.service';
import {tap} from 'rxjs';
import {Router} from '@angular/router';
import {PdfGeneratorService} from "../../../shared/services/pdf-generator.service";
import { Action } from 'rxjs/internal/scheduler/Action';
import { ACTION_ICONS } from '../../../shared/modules/osm-dashboard/models/actions';

@Component({
  selector: 'app-reception-list',
  standalone: true,
  imports: [CommonModule, OsmDashboard],
  templateUrl: './reception-list.component.html',
})
export class ReceptionListComponent {
  dashboardConfig = LIST_RECEPTION_DASHBOARD;

  constructor(private deliveryService: UnifiedDeliveryService, private _router: Router, private pdfGeneratorService: PdfGeneratorService) {
  }

  handleDashboardAction(event: { row: UnifiedDelivery; action: string }): void {
    switch (event.action) {
      case  'READ':
        this.viewDelivery(event.row);
        break;

      case 'Modifier':
        // this.selectReception(event.row);
        break;

      case 'GEN_PDF':
        this.pdfGeneratorService.generateProductionPDF(event.row);
        break;
      case 'QUALITY':
        break;

      case 'Contrôle Qualité':
        // this.QualityControl(event.row);
        break;

      case 'OIL_QUALITY':
        if (event.row.id) {
           this._router.navigate(['/reception/quality/oilFromOlive', event.row.id]);

        }
        break;
    }
  }

  viewDelivery(row: UnifiedDelivery): void {
    if (row && row.id) {
      this._router.navigate(['/reception/reception-details', row.id]);
      console.log(row)
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
