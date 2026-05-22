export interface ProductionRootSource {
  type?: string;
  sourceId?: string;
  lotNumber?: string;
  supplierName?: string;
  date?: string;
  extra?: Record<string, unknown>;
  qualityControls?: Record<string, string>;
}

export interface ProductionFiltrationStep {
  operationId?: string;
  sourceLotNumber?: string;
  targetLotNumber?: string;
  volumeFiltered?: number;
  timestamp?: string;
  sourceStorageUnitId?: string;
  sourceStorageUnitName?: string;
}

export interface ProductionGenealogy {
  traceabilityLotId?: string;
  traceabilitySourceType?: string;
  rootReceptionId?: string;
  storageUnitId?: string;
  lotNumber?: string;
  storageUnitName?: string;
  filtrations?: ProductionFiltrationStep[];
  rootSources?: ProductionRootSource[];
}
