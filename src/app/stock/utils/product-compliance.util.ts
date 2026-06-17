import { QualityGrades } from '../../shared/models/quality-grades.enum';
import {
  buildIngredientDeclaration,
  buildNutritionDeclarationJson,
  TUNISIA_LABEL_DEFAULTS,
  TUNISIA_NUTRITION_PER_100ML
} from '../../labels/utils/label-compliance.util';
import { FinalProductType } from '../models/final-product.model';

export const APPROVED_PRODUCT_CATEGORIES: QualityGrades[] = [
  QualityGrades.EXTRA_VIRGIN,
  QualityGrades.VIRGIN,
  QualityGrades.REFINED,
  QualityGrades.POMACE
];

export const PACKAGING_TYPES = [
  'Glass Bottle',
  'PET Bottle',
  'Tin Can',
  'Stainless Steel Container',
  'Bulk Tank'
] as const;

export const ORIGIN_COUNTRIES = [
  'Tunisia',
  'Spain',
  'Italy',
  'Greece',
  'Morocco',
  'Portugal'
] as const;

export const OLIVE_VARIETIES = [
  'Chemlali',
  'Chetoui',
  'Arbequina',
  'Koroneiki',
  'Mixed Blend'
] as const;

export const HARVEST_REGIONS = [
  'Sfax',
  'Sidi Bouzid',
  'Kairouan',
  'Zaghouan',
  'Bizerte'
] as const;

export const OLIVE_SOURCE_TYPES = [
  { value: 'FARM', label: 'Farm' },
  { value: 'COOPERATIVE', label: 'Cooperative' },
  { value: 'MILL', label: 'Mill' }
] as const;

export const PRODUCT_STATUSES = [
  'DRAFT',
  'PENDING_REVIEW',
  'APPROVED',
  'ACTIVE',
  'INACTIVE',
  'ARCHIVED'
] as const;

export const VOLUME_OPTIONS_ML = [100, 250, 500, 750, 1000, 2000, 3000, 5000] as const;

export const DEFAULT_STORAGE_CONDITIONS = TUNISIA_LABEL_DEFAULTS.storageEn;

export interface ProductComplianceIssue {
  field: string;
  label: string;
}

export interface ProductComplianceFormValues {
  name?: string | null;
  grade?: string | null;
  brand?: string | null;
  origin?: string | null;
  ingredientDeclaration?: string | null;
  packagingType?: string | null;
  volume?: number | null;
  shelfLifeMonths?: number | null;
  storageConditions?: string | null;
  harvestCampaign?: string | null;
  acidityLevel?: string | null;
  nutritionDeclarationJson?: string | null;
  supplierName?: string | null;
  supplierCode?: string | null;
  oliveSourceType?: string | null;
  oliveSourceReference?: string | null;
  productionBatchRef?: string | null;
  extractionBatchRef?: string | null;
  organic?: boolean | null;
  organicCertNumber?: string | null;
  organicCertBody?: string | null;
  organicCertExpiry?: string | null;
}

export function buildDefaultIngredientDeclaration(grade?: string | null): string {
  return buildIngredientDeclaration(grade);
}

export function buildDefaultNutritionJson(): string {
  return buildNutritionDeclarationJson();
}

export function formatNutritionSummary(): string {
  const n = TUNISIA_NUTRITION_PER_100ML;
  return [
    `Energy: ${n.energyKj} kJ / ${n.energyKcal} kcal`,
    `Fat: ${n.fatG} g`,
    `Saturated Fat: ${n.saturatedFatG} g`,
    `Carbohydrates: ${n.carbohydratesG} g`,
    `Sugars: ${n.sugarsG} g`,
    `Protein: ${n.proteinG} g`,
    `Salt: ${n.saltG} g`
  ].join('\n');
}

export interface ProductChecklistItem {
  field: string;
  label: string;
}

export function buildProductMandatoryChecklist(
  type: FinalProductType,
  grade?: string | null,
  organic?: boolean | null
): ProductChecklistItem[] {
  const items: ProductChecklistItem[] = [
    { field: 'name', label: 'Nom du produit' },
    { field: 'grade', label: 'Catégorie' },
    { field: 'ingredientDeclaration', label: 'Ingrédients' },
    { field: 'storageConditions', label: 'Stockage' }
  ];

  if (requiresHarvestYear(grade)) {
    items.push({ field: 'harvestCampaign', label: 'Campagne de récolte' });
  }
  if (requiresAcidity(grade)) {
    items.push({ field: 'acidityLevel', label: 'Acidité' });
  }

  if (type === 'NON_VRAC') {
    items.push(
      { field: 'brand', label: 'Marque' },
      { field: 'origin', label: 'Origine' },
      { field: 'packagingType', label: 'Emballage' },
      { field: 'volume', label: 'Volume net' },
      { field: 'shelfLifeMonths', label: 'Durée de vie' },
      { field: 'nutritionDeclarationJson', label: 'Nutrition' },
      { field: 'supplierName', label: 'Fournisseur' },
      { field: 'supplierCode', label: 'Code fournisseur' },
      { field: 'oliveSourceReference', label: 'Source olive' },
      { field: 'productionBatchRef', label: 'Lot production' },
      { field: 'extractionBatchRef', label: 'Lot extraction' },
      { field: 'bom', label: 'Nomenclature BOM' }
    );
  }

  if (organic) {
    items.push(
      { field: 'organicCertNumber', label: 'Certificat bio' },
      { field: 'organicCertBody', label: 'Organisme certificateur' },
      { field: 'organicCertExpiry', label: 'Expiration bio' }
    );
  }

  return items;
}

export function requiresHarvestYear(grade?: string | null): boolean {
  return grade === QualityGrades.EXTRA_VIRGIN || grade === QualityGrades.VIRGIN;
}

export function requiresAcidity(grade?: string | null): boolean {
  return grade === QualityGrades.EXTRA_VIRGIN || grade === QualityGrades.VIRGIN;
}

export function validateProductCompliance(
  values: ProductComplianceFormValues,
  type: FinalProductType
): ProductComplianceIssue[] {
  const issues: ProductComplianceIssue[] = [];
  const push = (field: string, label: string) => issues.push({ field, label });

  if (!values.name?.trim()) {
    push('name', 'Nom du produit');
  }
  if (!values.grade?.trim()) {
    push('grade', 'Catégorie');
  }
  if (!values.ingredientDeclaration?.trim()) {
    push('ingredientDeclaration', 'Ingrédients');
  }
  if (!values.storageConditions?.trim()) {
    push('storageConditions', 'Stockage');
  }

  if (requiresHarvestYear(values.grade) && !values.harvestCampaign?.trim()) {
    push('harvestCampaign', 'Campagne de récolte');
  }
  if (requiresAcidity(values.grade) && !values.acidityLevel?.trim()) {
    push('acidityLevel', 'Acidité');
  }

  if (type === 'NON_VRAC') {
    if (!values.brand?.trim()) {
      push('brand', 'Marque');
    }
    if (!values.origin?.trim()) {
      push('origin', 'Origine');
    }
    if (!values.packagingType?.trim()) {
      push('packagingType', 'Emballage');
    }
    if (!values.volume || values.volume <= 0) {
      push('volume', 'Volume net');
    }
    if (!values.shelfLifeMonths || values.shelfLifeMonths < 1 || values.shelfLifeMonths > 60) {
      push('shelfLifeMonths', 'Durée de vie');
    }
    if (!values.nutritionDeclarationJson?.trim()) {
      push('nutritionDeclarationJson', 'Nutrition');
    }
    if (!values.supplierName?.trim()) {
      push('supplierName', 'Fournisseur');
    }
    if (!values.supplierCode?.trim()) {
      push('supplierCode', 'Code fournisseur');
    }
    if (!values.oliveSourceType?.trim() || !values.oliveSourceReference?.trim()) {
      push('oliveSourceReference', 'Source olive');
    }
    if (!values.productionBatchRef?.trim()) {
      push('productionBatchRef', 'Lot production');
    }
    if (!values.extractionBatchRef?.trim()) {
      push('extractionBatchRef', 'Lot extraction');
    }
  }

  if (values.organic) {
    if (!values.organicCertNumber?.trim()) {
      push('organicCertNumber', 'Certificat bio');
    }
    if (!values.organicCertBody?.trim()) {
      push('organicCertBody', 'Organisme certificateur');
    }
    if (!values.organicCertExpiry?.trim()) {
      push('organicCertExpiry', 'Expiration bio');
    } else if (new Date(values.organicCertExpiry) < new Date(new Date().toDateString())) {
      push('organicCertExpiry', 'Certificat bio valide');
    }
  }

  return issues;
}

export function oliveVarietiesToString(varieties: string[]): string {
  return varieties.filter(Boolean).join(',');
}

export function parseOliveVarieties(value?: string | null): string[] {
  if (!value?.trim()) {
    return [];
  }
  return value.split(',').map((v) => v.trim()).filter(Boolean);
}
