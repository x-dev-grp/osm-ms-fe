import { QualityGrades } from '../../shared/models/quality-grades.enum';
import { Bom } from '../models/Bom';
import { LabelContentDto } from '../../labels/models/label.model';

export type FinalProductType = 'VRAC' | 'NON_VRAC';
export type FinalProductUnitOfMeasure = 'L' | 'KG' | 'BOTTLE' | 'CARTON';

export type ProductStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface FinalProduct {
  id?: string;
  name: string;
  code?: string;
  type: FinalProductType;
  category?: string;
  unitOfMeasure?: FinalProductUnitOfMeasure | string;
  description?: string;
  grade?: QualityGrades | string;
  origin?: string;
  harvestCampaign?: string;
  volume?: number;
  packagingType?: string;
  barcode?: string;
  unitsPerCarton?: number;
  cartonsPerPallet?: number;
  unitesParCols?: number;
  colisParPalette?: number;
  netWeight?: number;
  grossWeight?: number;
  brand?: string;
  brandDescription?: string;
  density?: number;
  storageUnit?: string;
  actif?: boolean;
  ingredientDeclaration?: string;
  storageConditions?: string;
  shelfLifeMonths?: number;
  acidityLevel?: string;
  peroxideValue?: string;
  k232?: string;
  k270?: string;
  polyphenolContent?: string;
  oliveVarieties?: string;
  harvestRegion?: string;
  organic?: boolean;
  organicCertNumber?: string;
  organicCertBody?: string;
  organicCertExpiry?: string;
  supplierName?: string;
  supplierCode?: string;
  supplierContact?: string;
  oliveSourceType?: string;
  oliveSourceReference?: string;
  productionBatchRef?: string;
  extractionBatchRef?: string;
  productStatus?: ProductStatus | string;
  nutritionDeclarationJson?: string;
  /** Single BOM with article lines for NON_VRAC products. */
  bom?: Bom;
  /** Linked label tickets (read). */
  labels?: LabelContentDto[];
  /** Label ticket ids to attach on save. */
  labelIds?: string[];
  labelId?: string;
  createdDate?: string;
  publicCode?: string;
  qrHex?: string;
  qrUrl?: string;
  qrImageBase64?: string;
}

export function finalProductDisplayName(finalProduct: Pick<FinalProduct, 'name' | 'code'> | null | undefined): string {
  return finalProduct?.name || finalProduct?.code || '';
}

export function finalProductTypeLabel(type?: FinalProductType): string {
  return type === 'VRAC' ? 'Vrac (Huile)' : 'Conditionne (Emballe)';
}

export function finalProductUnitsPerCarton(finalProduct: FinalProduct | null | undefined): number | undefined {
  return finalProduct?.unitsPerCarton ?? finalProduct?.unitesParCols;
}

export function finalProductCartonsPerPallet(finalProduct: FinalProduct | null | undefined): number | undefined {
  return finalProduct?.cartonsPerPallet ?? finalProduct?.colisParPalette;
}
