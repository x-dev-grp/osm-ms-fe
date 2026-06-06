export type TraceabilityEventType =
  | 'RECEPTION'
  | 'TRITURATION'
  | 'OLIVE_RECEPTION'
  | 'OIL_RECEPTION'
  | 'STORAGE_INTAKE'
  | 'OLIVE_RECEPTION_QC'
  | 'RECEPTION_QC'
  | 'FILTRATION'
  | 'FILTRATION_QC'
  | 'STORAGE'
  | 'FILTERED_QC'
  | 'OF'
  | 'OF_START'
  | 'OF_END'
  | 'LABEL'
  | 'EXPEDITION';

export interface TraceabilityEvent {
  id: string;
  parentId?: string | null;
  type: TraceabilityEventType | string;
  phase?: string;
  title?: string;
  timestamp?: string | null;
  sequence?: number;
  details?: Record<string, unknown>;
}

export interface TraceabilityEventChain {
  ofId: string;
  ofCode?: string;
  projectId?: string;
  traceabilityLotId?: string;
  lotVracId?: string;
  genealogyAnchor?: string;
  events: TraceabilityEvent[];
}
