import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { OosmDashboard } from '../../shared/modules/oosm-dashboard/oosm-dashboard';
import { PURCHASE_JOURNAL_DASHBOARD } from './purchase-journal-dashboard.config';
import { UnifiedDelivery } from '../../shared/models/UnifiedDelivery';
import { OliveReceptionActionsService } from '../olive-reception/olive-reception-actions.service';
import { OilReceptionActionsService } from '../oil-reception/oil-reception-actions.service';
import { DocumentGenerationService } from '../../shared/services/document-generation.service';

@Component({
  selector: 'app-purchase-journal',
  standalone: true,
  imports: [CommonModule, SharedModule, OosmDashboard],
  templateUrl: './purchase-journal.component.html',
  styleUrls: ['./purchase-journal.component.scss']
})
export class PurchaseJournalComponent {
  dashboardConfig = PURCHASE_JOURNAL_DASHBOARD;

  @ViewChild('dashboard') dashboard?: OosmDashboard;

  constructor(
    private oliveActions: OliveReceptionActionsService,
    private oilActions: OilReceptionActionsService,
    private documentGenerationService: DocumentGenerationService
  ) {}

  handleDashboardAction(event: { row: UnifiedDelivery; action: string }): void {
    const action = event.action?.toUpperCase();
    const row = event.row;
    const onRefresh = () => this.dashboard?.refrechData();

    if (action === 'GEN_INVOICE') {
      if (row?.id) {
        this.documentGenerationService.downloadCommercialPdf(row.id);
      }
      return;
    }

    const isOil = row?.deliveryType === 'OIL' || row?.operationType === 'OIL_PURCHASE';
    if (isOil) {
      this.oilActions.handleAction(event.action, row, { onRefresh });
      return;
    }
    this.oliveActions.handleAction(event.action, row, { onRefresh });
  }
}
