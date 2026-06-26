import { Component, inject, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { LabelContentDto } from '../../models/label.model';
import { LabelService } from '../../services/label.service';
import { OosmDashboard } from '../../../shared/modules/oosm-dashboard/oosm-dashboard';
import { DashboardConfig } from '../../../shared/modules/oosm-dashboard/models/dashboard-config';
import { LABEL_DASHBOARD_CONFIG } from './label-dashboard.config';

@Component({
  selector: 'app-label-list',
  standalone: true,
  imports: [TranslateModule, OosmDashboard],
  templateUrl: './label-list.component.html',
  styleUrls: ['./label-list.component.scss']
})
export class LabelListComponent {
  private readonly i18n = inject(TranslateService);

  dashboardConfig: DashboardConfig = LABEL_DASHBOARD_CONFIG;

  @ViewChild('dashboard') dashboard!: OosmDashboard;

  constructor(
    private readonly labelService: LabelService,
    private readonly router: Router
  ) {}

  handleAction(event: { row: LabelContentDto; action: string }): void {
    const label = event.row;
    const action = event.action?.toUpperCase();

    switch (action) {
      case 'READ':
        this.viewDetails(label);
        break;
      case 'UPDATE':
        this.editLabel(label);
        break;
      case 'FINALIZE':
        this.finalizeLabel(label);
        break;
      case 'EXPORT':
        this.exportLabel(label);
        break;
      case 'DRAFT':
        this.markAsDraft(label);
        break;
      case 'REMOVE':
        this.onDelete(label);
        break;
    }
  }

  private viewDetails(label: LabelContentDto): void {
    if (label.id) {
      void this.router.navigate(['/labels', label.id]);
    }
  }

  private editLabel(label: LabelContentDto): void {
    if (label.id) {
      void this.router.navigate(['/labels', label.id, 'edit']);
    }
  }

  private finalizeLabel(label: LabelContentDto): void {
    if (!label.id || label.status === 'FINALIZED' || label.status === 'EXPORTED_JSON') {
      return;
    }

    this.labelService.finalize(label.id).subscribe({
      next: () => this.refreshDashboard(),
      error: (error) => console.error(this.resolveErrorMessage(error, 'Erreur lors de la finalisation'), error)
    });
  }

  private exportLabel(label: LabelContentDto): void {
    if (!label.id) {
      return;
    }

    this.labelService.export(label.id).subscribe({
      next: (labelExport) => {
        this.downloadJson(labelExport.payloadJson ?? '{}', String(labelExport.lotNumber || labelExport.labelId || label.id || 'etiquette'));
        this.refreshDashboard();
      },
      error: (error) => console.error(this.resolveErrorMessage(error, "Erreur lors de l'export"), error)
    });
  }

  private markAsDraft(label: LabelContentDto): void {
    if (!label.id || label.status === 'DRAFT') {
      return;
    }

    if (label.status === 'FINALIZED' || label.status === 'EXPORTED_JSON') {
      console.error(this.i18n.instant('AUTO.UNE_ETIQUETTE_FINALISEE_OU_EXPORTEE_NE_PEUT_PAS_ETRE_REMISE_EN_B'));
      return;
    }

    this.labelService.markAsDraft(label.id).subscribe({
      next: () => this.refreshDashboard(),
      error: (error) => console.error(this.resolveErrorMessage(error, 'Erreur lors du changement vers brouillon'), error)
    });
  }

  private onDelete(label: LabelContentDto): void {
    if (!label.id) {
      return;
    }

    let message = 'Etes-vous sur de vouloir supprimer cette etiquette ?';
    if (label.status === 'FINALIZED' || label.status === 'EXPORTED_JSON') {
      message =
        'ATTENTION : Cette etiquette est FINALISEE. Sa suppression est fortement deconseillee pour la tracabilite. Voulez-vous vraiment continuer ?';
    }

    if (!confirm(message)) {
      return;
    }

    this.labelService.delete(label.id).subscribe({
      next: () => this.refreshDashboard(),
      error: (error) => console.error(this.resolveErrorMessage(error, 'Erreur lors de la suppression'), error)
    });
  }

  private refreshDashboard(): void {
    this.dashboard?.refrechData();
  }

  private downloadJson(payloadJson: string, name: string): void {
    const safeName = name || 'etiquette';
    const fileName = `label-${safeName}.json`;
    const blob = new Blob([payloadJson || '{}'], { type: 'application/json;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  private resolveErrorMessage(error: unknown, fallback: string): string {
    const apiMessage = (error as { error?: { message?: string } })?.error?.message;
    const genericMessage = (error as { message?: string })?.message;

    return apiMessage || genericMessage || fallback;
  }
}
