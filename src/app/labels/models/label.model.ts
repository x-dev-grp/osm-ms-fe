import { QualityGrades } from '../../shared/models/quality-grades.enum';

export type LabelContentStatus = 'DRAFT' | 'VALIDATED' | 'FINALIZED' | 'EXPORTED_JSON';

export type LabelLanguage = 'FR' | 'EN' | 'AR';

export type LabelCategory = 'UNIT' | 'COLIS' | 'PALLET';

export type LabelClaimType = 'MADE_IN_TUNISIA' | 'BIO' | 'COLD_EXTRACTION' | 'PRIVATE_LABEL' | 'OTHER';

export interface LabelValidationIssueDto {
  field: string;
  message: string;
  blocking: boolean;
}

export interface LabelSourceSnapshotDto {
  id?: string;
  isDeleted?: boolean;
  externalId?: string;
  sourceType: string;
  sourceId?: string;
  sourceBusinessKey?: string;
  snapshotJson?: string;
}

export interface LabelContentDto {
  id?: string;
  isDeleted?: boolean;
  externalId?: string;
  actions?: string[];

  lotId?: string;
  traceabilityLotId?: string;
  productId?: string;
  packagingId?: string;
  operatorId?: string;
  filtrationOperationId?: string;

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
  variety?: string;
  qualityGrade?: QualityGrades | string;
  extractionMethod?: string;
  sensoryProfile?: string;
  ingredientDeclaration?: string;
  nutritionDeclarationJson?: string;
  ean13?: string;
  harvestYear?: string;
  acidityLevel?: string;
  brandName?: string;

  certifications?: string[];
  claimTypes?: LabelClaimType[];
  marketingClaims?: string[];

  finalPayloadJson?: string;
  finalizedAt?: string;
  finalizedBy?: string;
  createdDate?: string;
  publicCode?: string;

  sourceSnapshots?: LabelSourceSnapshotDto[];
  validationIssues?: LabelValidationIssueDto[];
}

export interface LabelGenerateRequestDto {
  lotId: string;
  traceabilityLotId?: string;
  productId?: string;
  packagingId: string;
  packagingDate?: string;
  qualityGrade?: QualityGrades;
  variety?: string;
  language?: LabelLanguage;
  labelCategory?: LabelCategory;
  filtrationOperationId?: string;
}

export interface LabelContentUpdateRequestDto {
  language?: LabelLanguage;
  packagingDate?: string;
  legalDenomination?: string;
  storageConditions?: string;
  sensoryProfile?: string;
  certifications?: string[];
  claimTypes?: LabelClaimType[];
  lotNumber?: string;
  bestBeforeDate?: string;
  originCountry?: string;
  netQuantity?: string;
  responsibleName?: string;
  responsibleAddress?: string;
  extractionMethod?: string;
  marketingClaims?: string[];
  qualityGrade?: QualityGrades;
  variety?: string;
  ingredientDeclaration?: string;
  nutritionDeclarationJson?: string;
  ean13?: string;
  harvestYear?: string;
  acidityLevel?: string;
  brandName?: string;
}

export interface LabelExportDto {
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
  variety?: string;
  qualityGrade?: QualityGrades | string;
  extractionMethod?: string;
  sensoryProfile?: string;

  certifications?: string[];
  claimTypes?: LabelClaimType[];
  marketingClaims?: string[];

  frozen: boolean;
  payloadJson: string;
  finalizedAt?: string;
  finalizedBy?: string;
  publicCode?: string;
}

export interface LabelApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
