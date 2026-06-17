import { Component, Input } from '@angular/core';
import { CommonModule, DatePipe, KeyValuePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { TraceabilityEvent } from '../../models/traceability-event.model';
import {
  eventChainFor,
  genealogyAnchor,
  genealogyFor,
  labelsFor
} from '../../utils/traceability-snapshot.util';
import {
  countOilReceptionEvents,
  intakeStepTypeLabel,
  intakeStepsForLegacyTimeline,
  oilReceptionOrdinal,
  oilReceptionsFromGenealogy
} from '../../utils/traceability-display.util';
import { ProductionGenealogy, ProductionIntakeStep } from '../../models/production-genealogy.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-traceability-timeline',
  standalone: true,
  imports: [TranslateModule, CommonModule, DatePipe, KeyValuePipe, MatIconModule],
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

  oilReceptionCount(ofId: string, ofDetails: Record<string, unknown>): number {
    if (this.useEventTree(ofId)) {
      return countOilReceptionEvents(this.eventsForOf(ofId));
    }
    return oilReceptionsFromGenealogy(this.genealogyFor(ofDetails)).length;
  }

  oilReceptionsFor(ofDetails: Record<string, unknown>) {
    return oilReceptionsFromGenealogy(this.genealogyFor(ofDetails));
  }

  legacyIntakeSteps(genea: ProductionGenealogy): ProductionIntakeStep[] {
    return intakeStepsForLegacyTimeline(genea);
  }

  useLegacyIntakeChain(genea: ProductionGenealogy): boolean {
    return this.legacyIntakeSteps(genea).length > 0;
  }

  intakeStepClass(step: ProductionIntakeStep): string {
    if (step.type === 'STORAGE_INTAKE') {
      return 'root storage-intake';
    }
    if (step.type === 'OLIVE_RECEPTION' || step.type === 'OIL_RECEPTION' || step.type === 'RECEPTION') {
      return 'root';
    }
    return 'root';
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

  eventTypeLabel(type: string | undefined, evt?: TraceabilityEvent, allEvents?: TraceabilityEvent[]): string {
    let base: string;
    switch (type) {
      case 'OLIVE_RECEPTION':
        base = 'Réception olive';
        break;
      case 'OIL_RECEPTION':
      case 'RECEPTION':
        base = 'Réception huile';
        break;
      case 'TRITURATION':
        base = 'Trituration';
        break;
      case 'STORAGE_INTAKE':
        base = 'Entrée en cuve';
        break;
      case 'STORAGE':
        base = 'Stockage';
        break;
      case 'FILTRATION':
        base = 'Filtration';
        break;
      case 'OF':
        base = 'Ordre de fabrication';
        break;
      case 'OF_START':
        base = 'Démarrage OF';
        break;
      case 'OF_END':
        base = 'Fin OF';
        break;
      case 'LABEL':
        base = 'Étiquetage';
        break;
      case 'EXPEDITION':
        base = 'Expédition';
        break;
      default:
        base = type || '';
    }

    if (evt && allEvents) {
      const ordinal = oilReceptionOrdinal(evt, allEvents);
      if (ordinal != null) {
        const total = countOilReceptionEvents(allEvents);
        return `${base} (${ordinal}/${total})`;
      }
    }
    return base;
  }

  intakeStepTypeLabel = intakeStepTypeLabel;

  eventDetail(evt: TraceabilityEvent, key: string): unknown {
    return evt.details?.[key];
  }

  eventQualityControls(evt: TraceabilityEvent): Record<string, string> | null {
    const details = evt.details;
    if (!details?.['qualityControls']) {
      return null;
    }
    return details['qualityControls'] as Record<string, string>;
  }
}
