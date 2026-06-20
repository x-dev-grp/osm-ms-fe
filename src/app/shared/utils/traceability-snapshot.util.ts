import { ProductionGenealogy } from '../models/production-genealogy.model';
import { TraceabilityEventChain } from '../models/traceability-event.model';

export function genealogyAnchor(ofDetails: Record<string, unknown> | null | undefined): string {
  if (!ofDetails) {
    return '';
  }
  const traceabilityLotId = ofDetails['traceabilityLotId'];
  const lotVracId = ofDetails['lotVracId'];
  return String(traceabilityLotId || lotVracId || '');
}

export function genealogyFor(
  traceabilityData: Record<string, unknown> | null | undefined,
  ofDetails: Record<string, unknown> | null | undefined
): ProductionGenealogy | null {
  const anchor = genealogyAnchor(ofDetails);
  if (!anchor || !traceabilityData?.['oilGenealogy']) {
    return null;
  }
  const oilGenealogy = traceabilityData['oilGenealogy'] as Record<string, ProductionGenealogy>;
  return oilGenealogy[anchor] ?? null;
}

export function labelsFor(
  traceabilityData: Record<string, unknown> | null | undefined,
  ofDetails: Record<string, unknown> | null | undefined
): unknown[] {
  const anchor = genealogyAnchor(ofDetails);
  if (!anchor || !traceabilityData?.['packagedLabelsByLot']) {
    return [];
  }
  const byLot = traceabilityData['packagedLabelsByLot'] as Record<string, unknown[]>;
  return byLot[anchor] ?? [];
}

export function countOfDetails(snapshot: Record<string, unknown> | null | undefined): number {
  const ofDetails = snapshot?.['ofDetails'];
  return ofDetails && typeof ofDetails === 'object' ? Object.keys(ofDetails).length : 0;
}

export function countGenealogyLots(snapshot: Record<string, unknown> | null | undefined): number {
  const oilGenealogy = snapshot?.['oilGenealogy'];
  return oilGenealogy && typeof oilGenealogy === 'object' ? Object.keys(oilGenealogy).length : 0;
}

export function countPackagedLabels(snapshot: Record<string, unknown> | null | undefined): number {
  const byLot = snapshot?.['packagedLabelsByLot'];
  if (!byLot || typeof byLot !== 'object') {
    return 0;
  }
  return Object.values(byLot as Record<string, unknown[]>).reduce((sum, labels) => sum + (Array.isArray(labels) ? labels.length : 0), 0);
}

export function eventChainFor(traceabilityData: Record<string, unknown> | null | undefined, ofId: string): TraceabilityEventChain | null {
  const chains = traceabilityData?.['eventChains'];
  if (!Array.isArray(chains)) {
    return null;
  }
  return (chains as TraceabilityEventChain[]).find((chain) => chain.ofId === ofId) ?? null;
}

export function findOfInfoForGenealogyKey(
  ofDetails: Record<string, unknown> | null | undefined,
  genealogyKey: string
): Record<string, unknown> | undefined {
  if (!ofDetails || !genealogyKey) {
    return undefined;
  }
  return Object.values(ofDetails).find((of: unknown) => {
    const row = of as Record<string, unknown>;
    return row['traceabilityLotId'] === genealogyKey || row['lotVracId'] === genealogyKey;
  }) as Record<string, unknown> | undefined;
}
