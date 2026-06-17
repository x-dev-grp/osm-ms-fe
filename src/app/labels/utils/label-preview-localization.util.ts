import { LabelLanguage } from '../models/label.model';
import { QualityGrades } from '../../shared/models/quality-grades.enum';
import { TUNISIA_LABEL_DEFAULTS } from './label-compliance.util';
import { resolveStorageConditionsDisplay } from './label-qc-composition.util';

const POMACE = 'POMACE';

const PRODUCT_NAME: Record<LabelLanguage, Record<string, string>> = {
  FR: {
    [QualityGrades.EXTRA_VIRGIN]: 'HUILE D\'OLIVE VIERGE EXTRA',
    [QualityGrades.VIRGIN]: 'HUILE D\'OLIVE VIERGE',
    [QualityGrades.REFINED]: 'HUILE D\'OLIVE',
    [POMACE]: 'HUILE D\'OLIVE DE GRIGNON'
  },
  EN: {
    [QualityGrades.EXTRA_VIRGIN]: 'EXTRA VIRGIN OLIVE OIL',
    [QualityGrades.VIRGIN]: 'VIRGIN OLIVE OIL',
    [QualityGrades.REFINED]: 'OLIVE OIL',
    [POMACE]: 'OLIVE POMACE OIL'
  },
  AR: {
    [QualityGrades.EXTRA_VIRGIN]: 'زيت زيتون بكر ممتاز',
    [QualityGrades.VIRGIN]: 'زيت زيتون بكر',
    [QualityGrades.REFINED]: 'زيت زيتون',
    [POMACE]: 'زيت عجوة الزيتون'
  }
};

const INGREDIENTS: Record<LabelLanguage, Record<string, string>> = {
  FR: {
    [QualityGrades.EXTRA_VIRGIN]: 'Ingrédients : 100% huile d\'olive vierge extra',
    [QualityGrades.VIRGIN]: 'Ingrédients : 100% huile d\'olive vierge',
    [QualityGrades.REFINED]: 'Ingrédients : 100% huile d\'olive',
    [POMACE]: 'Ingrédients : 100% huile d\'olive de grignon'
  },
  EN: {
    [QualityGrades.EXTRA_VIRGIN]: 'Ingredients: 100% Extra Virgin Olive Oil',
    [QualityGrades.VIRGIN]: 'Ingredients: 100% Virgin Olive Oil',
    [QualityGrades.REFINED]: 'Ingredients: 100% Olive Oil',
    [POMACE]: 'Ingredients: 100% Olive Pomace Oil'
  },
  AR: {
    [QualityGrades.EXTRA_VIRGIN]: 'المكونات: 100% زيت زيتون بكر ممتاز',
    [QualityGrades.VIRGIN]: 'المكونات: 100% زيت زيتون بكر',
    [QualityGrades.REFINED]: 'المكونات: 100% زيت زيتون',
    [POMACE]: 'المكونات: 100% زيت عجوة الزيتون'
  }
};

const ORIGIN: Record<LabelLanguage, string> = {
  FR: 'Tunisie',
  EN: 'Tunisia',
  AR: 'تونس'
};

const EVOO_STATEMENT: Record<LabelLanguage, string> = {
  FR: 'Huile d\'olive de catégorie supérieure obtenue directement des olives et uniquement par des procédés mécaniques.',
  EN: TUNISIA_LABEL_DEFAULTS.evooStatement,
  AR: 'زيت زيتون من الفئة العليا مستخرج مباشرة من الزيتون وبالطرق الميكانيكية فقط.'
};

const STORAGE_DEFAULT: Record<LabelLanguage, string> = {
  FR: TUNISIA_LABEL_DEFAULTS.storageFr,
  EN: TUNISIA_LABEL_DEFAULTS.storageEn,
  AR: 'يُحفظ في مكان بارد وجاف بعيدًا عن الحرارة وأشعة الشمس المباشرة.'
};

const ORIGIN_PREFIX: Record<LabelLanguage, string> = {
  FR: 'Origine',
  EN: 'Origin',
  AR: 'المنشأ'
};

export const PREVIEW_CAROUSEL_LANGUAGES: LabelLanguage[] = ['FR', 'EN', 'AR'];

export function previewLanguageLabel(language: LabelLanguage): string {
  switch (language) {
    case 'FR':
      return 'Français';
    case 'EN':
      return 'English';
    case 'AR':
      return 'العربية';
    default:
      return language;
  }
}

export function buildLocalizedProductName(
  qualityGrade: string | null | undefined,
  language: LabelLanguage
): string {
  if (!qualityGrade) {
    return '';
  }
  return PRODUCT_NAME[language][qualityGrade] ?? PRODUCT_NAME.EN[qualityGrade] ?? '';
}

export function buildLocalizedIngredientDeclaration(
  qualityGrade: string | null | undefined,
  language: LabelLanguage
): string {
  if (!qualityGrade) {
    return '';
  }
  return INGREDIENTS[language][qualityGrade] ?? INGREDIENTS.EN[qualityGrade] ?? '';
}

export function resolveLocalizedOrigin(
  value: string | null | undefined,
  language: LabelLanguage
): string {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.toLowerCase() === 'tunisie' || trimmed.toLowerCase() === 'tunisia') {
    return ORIGIN[language];
  }
  return trimmed;
}

export function resolveLocalizedStorageConditions(
  value: string | null | undefined,
  language: LabelLanguage
): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    return STORAGE_DEFAULT[language];
  }

  if (
    trimmed === TUNISIA_LABEL_DEFAULTS.storageFr ||
    trimmed === TUNISIA_LABEL_DEFAULTS.storageEn ||
    Object.values(STORAGE_DEFAULT).includes(trimmed)
  ) {
    return STORAGE_DEFAULT[language];
  }

  return resolveStorageConditionsDisplay(trimmed);
}

export function buildLocalizedEvooStatement(language: LabelLanguage): string {
  return EVOO_STATEMENT[language];
}

export function buildLocalizedOriginLine(
  originCountry: string | null | undefined,
  language: LabelLanguage
): string {
  return `${ORIGIN_PREFIX[language]} : ${resolveLocalizedOrigin(originCountry, language)}`;
}
