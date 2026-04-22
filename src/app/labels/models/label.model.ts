export type LabelContentStatus = 'DRAFT' | 'VALIDATED' | 'FINALIZED';
export type LabelLanguage = 'FR' | 'EN' | 'AR';
export type LabelCategory = 'UNIT' | 'COLIS' | 'PALLET';

export interface LabelValidationIssue {
  field: string;
  message: string;
  blocking: boolean;
}

export interface LabelSourceSnapshot {
  id?: string;
  sourceType: string;
  sourceId?: string;
  sourceBusinessKey?: string;
  snapshotJson?: string;
}

export interface LabelContent {
  id?: string;
  lotId?: string;
  packagingId?: string;
  operatorId?: string;
  status: LabelContentStatus;
  language: LabelLanguage;
  packagingDate?: string;
  labelCategory?: LabelCategory;
  legalDenomination?: string;
  originCountry?: string;
  netQuantity?: string;
  bestBeforeDate?: string;
  storageConditions?: string;
  responsibleName?: string;
  responsibleAddress?: string;
  lotNumber?: string;
  extractionMethod?: string;
  sensoryProfile?: string;
  finalPayloadJson?: string;
  finalizedAt?: string;
  finalizedBy?: string;
  sourceSnapshots: LabelSourceSnapshot[];
  validationIssues: LabelValidationIssue[];
}

export interface LabelGenerateRequest {
  lotId: string;
  packagingId: string;
  packagingDate?: string;
  language?: LabelLanguage;
  labelCategory?: LabelCategory;
}

export interface LabelContentUpdateRequest {
  language?: LabelLanguage;
  packagingDate?: string;
  legalDenomination?: string;
  storageConditions?: string;
  sensoryProfile?: string;
}

export interface LabelExport {
  labelId: string;
  status: LabelContentStatus;
  language: LabelLanguage;
  packagingDate?: string;
  legalDenomination?: string;
  originCountry?: string;
  netQuantity?: string;
  bestBeforeDate?: string;
  storageConditions?: string;
  responsibleName?: string;
  responsibleAddress?: string;
  lotNumber?: string;
  extractionMethod?: string;
  sensoryProfile?: string;
  frozen: boolean;
  payloadJson: string;
  finalizedAt?: string;
  finalizedBy?: string;
}

export interface LabelApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
