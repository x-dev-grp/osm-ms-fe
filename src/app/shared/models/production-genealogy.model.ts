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
  qualityControls?: Record<string, string>;
  sourceIntakeChain?: ProductionIntakeStep[];
}

export interface ProductionIntakeStep {
  type?: string;
  deliveryId?: string;
  transactionId?: string;
  deliveryNumber?: string;
  lotNumber?: string;
  lotOliveNumber?: string;
  deliveryType?: string;
  supplierName?: string;
  deliveryDate?: string;
  quantityKg?: number;
  storageUnitId?: string;
  storageUnitName?: string;
  qualityControls?: Record<string, string>;
  extra?: Record<string, unknown>;
}

export interface ProductionGenealogy {
  traceabilityLotId?: string;
  traceabilitySourceType?: string;
  rootReceptionId?: string;
  storageUnitId?: string;
  lotNumber?: string;
  storageUnitName?: string;
  filteredQualityControls?: Record<string, string>;
  filtrations?: ProductionFiltrationStep[];
  rootSources?: ProductionRootSource[];
  intakeChain?: ProductionIntakeStep[];
}
