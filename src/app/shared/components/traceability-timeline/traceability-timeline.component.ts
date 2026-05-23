import { Component, Input } from '@angular/core';
import { CommonModule, DatePipe, KeyValuePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { ProductionGenealogy, ProductionRootSource } from '../../models/production-genealogy.model';
import { TraceabilityEvent } from '../../models/traceability-event.model';
import {
  eventChainFor,
  genealogyAnchor,
  genealogyFor,
  labelsFor
} from '../../utils/traceability-snapshot.util';

@Component({
  selector: 'app-traceability-timeline',
  standalone: true,
  imports: [CommonModule, DatePipe, KeyValuePipe, MatIconModule],
  templateUrl: './traceability-timeline.component.html',
  styleUrls: ['./traceability-timeline.component.scss']
})
export class TraceabilityTimelineComponent {
  @Input() traceabilityData: Record<string, unknown> | null = null;
  @Input() compact = false;

  genealogyAnchor(ofDetails: Record<string, unknown>): string {
    return genealogyAnchor(ofDetails);
  }

  genealogyFor(ofDetails: Record<string, unknown>): ProductionGenealogy | null {
    return genealogyFor(this.traceabilityData, ofDetails);
  }

  labelsFor(ofDetails: Record<string, unknown>): unknown[] {
    return labelsFor(this.traceabilityData, ofDetails);
  }

  rootSourceFor(ofDetails: Record<string, unknown>): ProductionRootSource | null {
    return this.genealogyFor(ofDetails)?.rootSources?.[0] ?? null;
  }

  ofDetailsEntries(): Array<{ key: string; value: Record<string, unknown> }> {
    const ofDetails = this.traceabilityData?.['ofDetails'];
    if (!ofDetails || typeof ofDetails !== 'object') {
      return [];
    }
    return Object.entries(ofDetails as Record<string, Record<string, unknown>>).map(([key, value]) => ({
      key,
      value
    }));
  }

  useEventTree(ofId: string): boolean {
    return this.eventsForOf(ofId).length > 0;
  }

  eventsForOf(ofId: string): TraceabilityEvent[] {
    const chain = eventChainFor(this.traceabilityData, ofId);
    if (!chain?.events?.length) {
      return [];
    }
    return [...chain.events].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
  }

  eventCssClass(type: string | undefined): string {
    switch (type) {
      case 'RECEPTION':
      case 'TRITURATION':
      case 'OLIVE_RECEPTION':
      case 'OIL_RECEPTION':
      case 'STORAGE_INTAKE':
      case 'OLIVE_RECEPTION_QC':
      case 'RECEPTION_QC':
        return 'root';
      case 'FILTRATION':
        return 'filt';
      case 'EXPEDITION':
      case 'STORAGE':
        return 'final';
      case 'RECEPTION_QC':
      case 'FILTRATION_QC':
      case 'FILTERED_QC':
        return 'qc';
      default:
        return 'step';
    }
  }

  eventPhaseLabel(phase: string | undefined): string {
    switch (phase) {
      case 'PRODUCTION':
        return 'Production';
      case 'QUALITY':
        return 'Qualité';
      case 'CONDITIONING':
        return 'Conditionnement';
      case 'EXPEDITION':
        return 'Expédition';
      default:
        return phase || 'Étape';
    }
  }

  eventTypeLabel(type: string | undefined): string {
    switch (type) {
      case 'OLIVE_RECEPTION':
        return 'Réception olive';
      case 'OIL_RECEPTION':
      case 'RECEPTION':
        return 'Réception huile';
      case 'TRITURATION':
        return 'Trituration';
      case 'STORAGE_INTAKE':
        return 'Entrée en cuve';
      case 'STORAGE':
        return 'Stockage';
      case 'FILTRATION':
        return 'Filtration';
      case 'OF':
        return 'Ordre de fabrication';
      case 'OF_START':
        return 'Démarrage OF';
      case 'OF_END':
        return 'Fin OF';
      case 'LABEL':
        return 'Étiquetage';
      case 'EXPEDITION':
        return 'Expédition';
      default:
        return type || '';
    }
  }

  eventQualityControls(evt: TraceabilityEvent): Record<string, string> | null {
    const details = evt.details;
    if (!details?.['qualityControls']) {
      return null;
    }
    return details['qualityControls'] as Record<string, string>;
  }
}
