import { Certification } from './certification.model';
import { LabelCategory, LabelClaimType, LabelContentStatus, LabelLanguage } from './label.model';
import { LabelCompositionEntry, LabelNutritionTable, LabelQcEntry } from './label-qc-composition.model';

export interface LabelPreviewViewModel {
  brandName: string;
  brandLogoData?: string;
  brandLogoContentType?: string;
  language: LabelLanguage | string;
  labelCategory: LabelCategory | string;
  lotNumber: string;
  legalDenomination: string;
  originCountry: string;
  netQuantity: string;
  qualityLabel: string;
  varietyLabel: string;
  bestBeforeDate: string;
  packagingDate: string;
  claimTypes: LabelClaimType[];
  claimLabels: string[];
  certifications: Certification[];
  extractionMethod?: string;
  storageConditions?: string;
  sensoryProfile?: string;
  sensoryFromQualityControl?: boolean;
  qualityControls: LabelQcEntry[];
  compositionEstimate: LabelCompositionEntry[];
  nutritionTable?: LabelNutritionTable;
  responsibleName: string;
  responsibleAddress?: string;
  publicCode?: string;
  status?: LabelContentStatus | string;
  statusLabel?: string;
}
