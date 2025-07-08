import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OsmDashboard } from '../../../shared/modules/osm-dashboard/osm-dashboard';
import { LIST_RECEPTION_DASHBOARD } from './LIST_RECEPTION_DASHBOARD';
import { UnifiedDelivery } from '../../../shared/models/UnifiedDelivery';
import { UnifiedDeliveryService } from '../../../shared/services/delivery.service';
import { tap } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reception-list',
  standalone: true,
  imports: [CommonModule, OsmDashboard],
  templateUrl: './reception-list.component.html',
  styleUrls: ['./reception-list.component.scss']
})
export class ReceptionListComponent {
  dashboardConfig = LIST_RECEPTION_DASHBOARD;

  constructor(private deliveryService: UnifiedDeliveryService,private _router:Router) {}

  handleDashboardAction(event: { row: UnifiedDelivery; action: string }): void {
    switch (event.action) {
      case 'Consulter':
        // this.viewDelivery(event.row);
        break;

      case 'Modifier':
        // this.selectReception(event.row);
        break;
      case 'Controle quality':
      case 'QUALITY':
      case 'Contrôle Qualité':
        // this.QualityControl(event.row);
        break;

      case 'OIL_QUALITY':
        if (event.row.id) {
          this.createOilReception(event.row);
        }
        break;
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
