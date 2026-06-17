import { LabelContentDto, LabelValidationIssueDto } from '../models/label.model';
import { QualityGrades } from '../../shared/models/quality-grades.enum';
import { LabelCompositionEntry } from '../models/label-qc-composition.model';

export const TUNISIA_LABEL_DEFAULTS = {
  origin: 'Tunisie',
  storageFr:
    "A conserver dans un endroit frais et sec, à l'abri de la chaleur et de la lumière directe du soleil.",
  storageEn: 'Store in a cool, dry place away from heat and direct sunlight.',
  evooStatement:
    'Superior category olive oil obtained directly from olives and solely by mechanical means.'
} as const;

export const APPROVED_OLIVE_CATEGORIES: QualityGrades[] = [
  QualityGrades.EXTRA_VIRGIN,
  QualityGrades.VIRGIN,
  QualityGrades.REFINED
];

export const POMACE_CATEGORY = 'POMACE';

export const TUNISIA_NUTRITION_PER_100ML = {
  energyKj: 3389,
  energyKcal: 824,
  fatG: 91.6,
  saturatedFatG: 13.8,
  carbohydratesG: 0,
  sugarsG: 0,
  proteinG: 0,
  saltG: 0
} as const;

export interface NutritionDeclarationPayload {
  basis: 'per100ml';
  energyKj: number;
  energyKcal: number;
  fatG: number;
  saturatedFatG: number;
  carbohydratesG: number;
  sugarsG: number;
  proteinG: number;
  saltG: number;
  oilCompositionEstimate?: Array<{
    key: string;
    label: string;
    per100ml: string;
    source: string;
  }>;
}

const INGREDIENT_BY_CATEGORY: Record<string, string> = {
  [QualityGrades.EXTRA_VIRGIN]: 'Ingredients: 100% Extra Virgin Olive Oil',
  [QualityGrades.VIRGIN]: 'Ingredients: 100% Virgin Olive Oil',
  [QualityGrades.REFINED]: 'Ingredients: 100% Olive Oil',
  [POMACE_CATEGORY]: 'Ingredients: 100% Olive Pomace Oil'
};

const PRODUCT_NAME_BY_CATEGORY: Record<string, string> = {
  [QualityGrades.EXTRA_VIRGIN]: 'EXTRA VIRGIN OLIVE OIL',
  [QualityGrades.VIRGIN]: 'VIRGIN OLIVE OIL',
  [QualityGrades.REFINED]: 'OLIVE OIL',
  [POMACE_CATEGORY]: 'OLIVE POMACE OIL'
};

export function buildIngredientDeclaration(qualityGrade?: string | null): string {
  if (!qualityGrade) {
    return '';
  }
  return INGREDIENT_BY_CATEGORY[qualityGrade] ?? '';
}

export function buildProductName(qualityGrade?: string | null): string {
  if (!qualityGrade) {
    return '';
  }
  return PRODUCT_NAME_BY_CATEGORY[qualityGrade] ?? '';
}

export function buildNutritionDeclarationJson(
  compositionEstimate?: LabelCompositionEntry[] | null
): string {
  const payload: NutritionDeclarationPayload = {
    basis: 'per100ml',
    ...TUNISIA_NUTRITION_PER_100ML
  };

  if (compositionEstimate?.length) {
    payload.oilCompositionEstimate = compositionEstimate.map((entry) => ({
      key: entry.key,
      label: entry.label,
      per100ml: entry.per100ml || entry.value,
      source: entry.source
    }));
  }

  return JSON.stringify(payload);
}

export function parseNutritionDeclarationJson(
  json?: string | null
): NutritionDeclarationPayload | null {
  if (!json?.trim()) {
    return null;
  }

  try {
    return JSON.parse(json) as NutritionDeclarationPayload;
  } catch {
    return null;
  }
}

export function extractCompositionOverrides(json?: string | null): Record<string, string> {
  const parsed = parseNutritionDeclarationJson(json);
  if (!parsed?.oilCompositionEstimate?.length) {
    return {};
  }

  return Object.fromEntries(
    parsed.oilCompositionEstimate
      .filter((entry) => entry.key && entry.per100ml)
      .map((entry) => [entry.key, entry.per100ml])
  );
}

export function generateLotNumber(packagingDate?: string | null): string {
  const year = packagingDate ? new Date(packagingDate).getFullYear() : new Date().getFullYear();
  const seq = String(Date.now() % 1_000_000).padStart(6, '0');
  return `${year}-${seq}`;
}

export function isValidNetQuantity(value?: string | null): boolean {
  if (!value?.trim()) {
    return false;
  }
  return /^\s*\d+(?:[.,]\d+)?\s*(ml|cl|l)\s*$/i.test(value.trim());
}

export function isValidBestBeforeDate(value?: string | null): boolean {
  const parsed = parseBestBeforeDate(value);
  return parsed !== null && parsed.getTime() > Date.now();
}

export function isValidLotNumber(value?: string | null): boolean {
  const trimmed = value?.trim();
  return !!trimmed && trimmed.length >= 4 && trimmed.length <= 50;
}

export function isApprovedOrigin(value?: string | null): boolean {
  const key = (value ?? '').trim().toLowerCase();
  return key.includes('tunis') || key === 'tn' || key.includes('product of tunisia');
}

export function isApprovedCategory(value?: string | null): boolean {
  if (!value) {
    return false;
  }
  if (value === QualityGrades.LAMPANTE) {
    return false;
  }
  return APPROVED_OLIVE_CATEGORIES.includes(value as QualityGrades) || value === POMACE_CATEGORY;
}

export function isValidEan13(value?: string | null): boolean {
  const digits = value?.trim();
  if (!digits || !/^\d{13}$/.test(digits)) {
    return false;
  }
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = Number(digits[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const check = (10 - (sum % 10)) % 10;
  return check === Number(digits[12]);
}

export interface LabelComplianceField {
  field: string;
  label: string;
}

export function validateLabelComplianceForm(values: {
  legalDenomination?: string | null;
  qualityGrade?: string | null;
  originCountry?: string | null;
  netQuantity?: string | null;
  responsibleName?: string | null;
  responsibleAddress?: string | null;
  lotNumber?: string | null;
  bestBeforeDate?: string | null;
  storageConditions?: string | null;
  ingredientDeclaration?: string | null;
  nutritionDeclarationJson?: string | null;
  ean13?: string | null;
}): LabelComplianceField[] {
  const missing: LabelComplianceField[] = [];

  if (!values.legalDenomination?.trim()) missing.push({ field: 'legalDenomination', label: 'Nom du produit' });
  if (!isApprovedCategory(values.qualityGrade)) missing.push({ field: 'qualityGrade', label: 'Catégorie huile' });
  if (!isApprovedOrigin(values.originCountry)) missing.push({ field: 'originCountry', label: 'Origine' });
  if (!isValidNetQuantity(values.netQuantity)) missing.push({ field: 'netQuantity', label: 'Quantité nette' });
  if (!values.responsibleName?.trim()) missing.push({ field: 'responsibleName', label: 'Producteur' });
  if (!values.responsibleAddress?.trim()) missing.push({ field: 'responsibleAddress', label: 'Adresse producteur' });
  if (!isValidLotNumber(values.lotNumber)) missing.push({ field: 'lotNumber', label: 'N° de lot' });
  if (!isValidBestBeforeDate(values.bestBeforeDate)) missing.push({ field: 'bestBeforeDate', label: 'D.D.M.' });
  if (!values.storageConditions?.trim()) missing.push({ field: 'storageConditions', label: 'Stockage' });

  const ingredients = values.ingredientDeclaration?.trim() || buildIngredientDeclaration(values.qualityGrade);
  if (!ingredients) missing.push({ field: 'ingredientDeclaration', label: 'Ingrédients' });

  const nutrition = values.nutritionDeclarationJson?.trim() || buildNutritionDeclarationJson();
  if (!nutrition) missing.push({ field: 'nutritionDeclaration', label: 'Nutrition' });

  if (values.ean13?.trim() && !isValidEan13(values.ean13)) {
    missing.push({ field: 'ean13', label: 'EAN-13 invalide' });
  }

  return missing;
}

export function applyComplianceDefaultsToLabel(label: Partial<LabelContentDto>): Partial<LabelContentDto> {
  const grade = label.qualityGrade;
  return {
    ...label,
    originCountry: label.originCountry?.trim() || TUNISIA_LABEL_DEFAULTS.origin,
    storageConditions: label.storageConditions?.trim() || TUNISIA_LABEL_DEFAULTS.storageFr,
    lotNumber: label.lotNumber?.trim() || generateLotNumber(label.packagingDate),
    legalDenomination: label.legalDenomination?.trim() || buildProductName(grade) || label.legalDenomination,
    ingredientDeclaration: label.ingredientDeclaration?.trim() || buildIngredientDeclaration(grade),
    nutritionDeclarationJson: label.nutritionDeclarationJson?.trim() || buildNutritionDeclarationJson()
  };
}

export function mergeValidationIssues(
  local: LabelComplianceField[],
  server: LabelValidationIssueDto[] = []
): LabelComplianceField[] {
  const merged = [...local];
  for (const issue of server.filter((i) => i.blocking)) {
    if (!merged.some((m) => m.field === issue.field)) {
      merged.push({ field: issue.field, label: issue.message });
    }
  }
  return merged;
}

function parseBestBeforeDate(value?: string | null): Date | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  const mmYyyy = trimmed.match(/^(0[1-9]|1[0-2])\/(\d{4})$/);
  if (mmYyyy) {
    const month = Number(mmYyyy[1]);
    const year = Number(mmYyyy[2]);
    return new Date(year, month, 0);
  }

  const ddMmYyyy = trimmed.match(/^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/(\d{4})$/);
  if (ddMmYyyy) {
    const day = Number(ddMmYyyy[1]);
    const month = Number(ddMmYyyy[2]) - 1;
    const year = Number(ddMmYyyy[3]);
    const date = new Date(year, month, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

export function showEvooLegalStatement(qualityGrade?: string | null): boolean {
  return qualityGrade === QualityGrades.EXTRA_VIRGIN;
}
