import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { OosmDashboard } from '../../shared/modules/oosm-dashboard/oosm-dashboard';
import { LIST_RECEPTION_DASHBOARD } from './LIST_RECEPTION_DASHBOARD';
import { UnifiedDelivery } from '../../shared/models/UnifiedDelivery';
import { OliveReceptionActionsService } from '../olive-reception/olive-reception-actions.service';
import { OilReceptionActionsService } from '../oil-reception/oil-reception-actions.service';

@Component({
  selector: 'app-reception-list',
  standalone: true,
  imports: [CommonModule, OosmDashboard],
  templateUrl: './reception-list.component.html'
})
export class ReceptionListComponent implements OnInit {
  dashboardConfig = LIST_RECEPTION_DASHBOARD;
  private listDeliveryType: 'OLIVE' | 'OIL' | null = null;

  constructor(
    private route: ActivatedRoute,
    private oliveActions: OliveReceptionActionsService,
    private oilActions: OilReceptionActionsService
  ) {}
  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const deliveryType = (params.get('deliveryType') || '').toLowerCase();
      const operationType = (params.get('operationType') || '').toUpperCase();

      if (deliveryType === 'olive' || deliveryType === 'oil') {
        this.listDeliveryType = deliveryType.toUpperCase() as 'OLIVE' | 'OIL';
        this.initDashboardConfig(this.listDeliveryType, operationType || undefined);
      } else {
        this.dashboardConfig = LIST_RECEPTION_DASHBOARD;
      }
    });
  }

  private initDashboardConfig(deliveryType: string, operationType?: string): void {
    const config = JSON.parse(JSON.stringify(LIST_RECEPTION_DASHBOARD));

    config.defaultSearchData.searchData.search.deliveryType = { equalValue: deliveryType };
    if (operationType) {
      config.defaultSearchData.searchData.search.operationType = { equalValue: operationType };
    }

    let translateKey = '';
    if (deliveryType === 'OIL') {
      translateKey = 'MENU.RECEPTION.OIL';
    } else if (deliveryType === 'OLIVE') {
      if (!operationType) {
        translateKey = 'MENU.PRODUCTION.ALL_OLIVE_RECEPTIONS';
      } else {
        const keyMap: Record<string, string> = {
          SIMPLE_RECEPTION: 'DELIVERIES.OPERATION_TYPE.SIMPLE_RECEPTION',
          BASE: 'DELIVERIES.OPERATION_TYPE.BASE',
          OLIVE_PURCHASE: 'DELIVERIES.OPERATION_TYPE.OLIVE_PURCHASE',
          EXCHANGE: 'DELIVERIES.OPERATION_TYPE.EXCHANGE'
        };
        translateKey = keyMap[operationType] || 'MENU.PRODUCTION.MILLING_HISTORY';
      }
    }

    config.titleTranslatePath = translateKey;
    delete config.title;
    this.dashboardConfig = config;
  }

  handleDashboardAction(event: { row: UnifiedDelivery; action: string }): void {
    const isOil = this.listDeliveryType === 'OIL' || event.row?.deliveryType === 'OIL';
    if (isOil) {
      this.oilActions.handleAction(event.action, event.row);
      return;
    }
    this.oliveActions.handleAction(event.action, event.row);
  }
}