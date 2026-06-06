import {
  ProductionGenealogy,
  ProductionIntakeStep,
  ProductionRootSource
} from '../models/production-genealogy.model';
import { TraceabilityEvent } from '../models/traceability-event.model';

const OIL_RECEPTION_TYPES = new Set(['OIL_RECEPTION', 'RECEPTION']);
const ORIGIN_INTAKE_TYPES = new Set([
  'OIL_RECEPTION',
  'OLIVE_RECEPTION',
  'RECEPTION',
  'TRITURATION',
  'STORAGE_INTAKE'
]);

export interface OilReceptionDisplay {
  index: number;
  total: number;
  supplierName?: string;
  lotNumber?: string;
  deliveryNumber?: string;
  deliveryDate?: string;
  quantityKg?: number;
  storageUnitName?: string;
  qualityControls?: Record<string, string>;
}

/** All oil receptions from intake chain, else from rootSources. */
export function oilReceptionsFromGenealogy(genealogy: ProductionGenealogy | null | undefined): OilReceptionDisplay[] {
  if (!genealogy) {
    return [];
  }

  const fromIntake = (genealogy.intakeChain ?? []).filter((s) => OIL_RECEPTION_TYPES.has(s.type ?? ''));
  if (fromIntake.length > 0) {
    return fromIntake.map((step, i) => intakeStepToDisplay(step, i + 1, fromIntake.length));
  }

  const fromRoots = (genealogy.rootSources ?? []).filter((r) =>
    OIL_RECEPTION_TYPES.has((r.type ?? '').toUpperCase()) || r.type === 'TRITURATION'
  );
  return fromRoots.map((root, i) => rootSourceToDisplay(root, i + 1, fromRoots.length));
}

export function intakeStepsForLegacyTimeline(genealogy: ProductionGenealogy | null | undefined): ProductionIntakeStep[] {
  if (!genealogy?.intakeChain?.length) {
    return [];
  }
  return genealogy.intakeChain.filter((s) => ORIGIN_INTAKE_TYPES.has(s.type ?? ''));
}

export function countOilReceptionEvents(events: TraceabilityEvent[]): number {
  return events.filter((e) => OIL_RECEPTION_TYPES.has(e.type ?? '')).length;
}

export function oilReceptionOrdinal(evt: TraceabilityEvent, events: TraceabilityEvent[]): number | null {
  if (!OIL_RECEPTION_TYPES.has(evt.type ?? '')) {
    return null;
  }
  const oilEvents = events.filter((e) => OIL_RECEPTION_TYPES.has(e.type ?? ''));
  if (oilEvents.length <= 1) {
    return null;
  }
  const idx = oilEvents.findIndex((e) => e.id === evt.id);
  return idx >= 0 ? idx + 1 : null;
}

export function intakeStepTypeLabel(type: string | undefined): string {
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
    default:
      return type || 'Étape';
  }
}

function intakeStepToDisplay(step: ProductionIntakeStep, index: number, total: number): OilReceptionDisplay {
  return {
    index,
    total,
    supplierName: step.supplierName,
    lotNumber: step.lotNumber,
    deliveryNumber: step.deliveryNumber,
    deliveryDate: step.deliveryDate,
    quantityKg: step.quantityKg,
    storageUnitName: step.storageUnitName,
    qualityControls: step.qualityControls
  };
}

function rootSourceToDisplay(root: ProductionRootSource, index: number, total: number): OilReceptionDisplay {
  const extra = root.extra ?? {};
  return {
    index,
    total,
    supplierName: root.supplierName,
    lotNumber: root.lotNumber,
    deliveryNumber: extra['deliveryNumber'] != null ? String(extra['deliveryNumber']) : undefined,
    deliveryDate: root.date,
    storageUnitName: extra['storageUnitName'] != null ? String(extra['storageUnitName']) : undefined,
    qualityControls: root.qualityControls
  };
}
