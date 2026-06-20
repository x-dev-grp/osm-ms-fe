import { QualityGrades } from '../../models/quality-grades.enum';

export const TUNISIA_OIL_CATEGORY_LABELS = {
  EXTRA_VIERGE: 'Extra Vierge',
  VIERGE: 'Vierge',
  LAMPANTE: 'Lampante'
} as const;

/** QC dropdown / reception labels → product QualityGrades enum */
const QC_CATEGORY_TO_GRADE: Record<string, QualityGrades> = {
  'Extra Vierge': QualityGrades.EXTRA_VIRGIN,
  'Vierge Extra': QualityGrades.EXTRA_VIRGIN,
  Extra: QualityGrades.EXTRA_VIRGIN,
  Vierge: QualityGrades.VIRGIN,
  Lampante: QualityGrades.LAMPANTE,
  EXTRA_VIRGIN: QualityGrades.EXTRA_VIRGIN,
  VIRGIN: QualityGrades.VIRGIN,
  LAMPANTE: QualityGrades.LAMPANTE
};

const GRADE_TO_QC_CATEGORY: Partial<Record<QualityGrades, string>> = {
  [QualityGrades.EXTRA_VIRGIN]: TUNISIA_OIL_CATEGORY_LABELS.EXTRA_VIERGE,
  [QualityGrades.VIRGIN]: TUNISIA_OIL_CATEGORY_LABELS.VIERGE,
  [QualityGrades.LAMPANTE]: TUNISIA_OIL_CATEGORY_LABELS.LAMPANTE
};

export function mapQcCategoryToGrade(label: string | null | undefined): QualityGrades | null {
  if (!label?.trim()) {
    return null;
  }
  return QC_CATEGORY_TO_GRADE[label.trim()] ?? null;
}

export function mapGradeToQcCategory(grade: QualityGrades | string | null | undefined): string | null {
  if (!grade) {
    return null;
  }
  if (Object.values(QualityGrades).includes(grade as QualityGrades)) {
    return GRADE_TO_QC_CATEGORY[grade as QualityGrades] ?? null;
  }
  return QC_CATEGORY_TO_GRADE[grade] ? (GRADE_TO_QC_CATEGORY[QC_CATEGORY_TO_GRADE[grade]] ?? grade) : grade;
}

export const COI_EVOO_LIMITS = {
  acidity: 0.8,
  k232: 2.5,
  k270: 0.22,
  deltaK: 0.01,
  peroxide: 20
} as const;

export const COI_VIRGIN_LIMITS = {
  acidity: 2.0,
  k232: 2.6,
  k270: 0.25,
  deltaK: 0.01,
  peroxide: 20
} as const;

export const TUNISIA_QC_REGULATORY_MARKER = 'Tunisia default';

export interface OilMeasurementValues {
  acidity?: number | null;
  k232?: number | null;
  k270?: number | null;
  deltaK?: number | null;
  peroxide?: number | null;
}

function within(value: number | null | undefined, max: number): boolean {
  return value == null || Number.isNaN(value) || value <= max;
}

function withinEvoo(values: OilMeasurementValues): boolean {
  return (
    within(values.acidity, COI_EVOO_LIMITS.acidity) &&
    within(values.k232, COI_EVOO_LIMITS.k232) &&
    within(values.k270, COI_EVOO_LIMITS.k270) &&
    within(values.deltaK, COI_EVOO_LIMITS.deltaK) &&
    within(values.peroxide, COI_EVOO_LIMITS.peroxide)
  );
}

function withinVirgin(values: OilMeasurementValues): boolean {
  return (
    within(values.acidity, COI_VIRGIN_LIMITS.acidity) &&
    within(values.k232, COI_VIRGIN_LIMITS.k232) &&
    within(values.k270, COI_VIRGIN_LIMITS.k270) &&
    within(values.deltaK, COI_VIRGIN_LIMITS.deltaK) &&
    within(values.peroxide, COI_VIRGIN_LIMITS.peroxide)
  );
}

export function suggestOilGrade(values: OilMeasurementValues): string | null {
  const hasAny = values.acidity != null || values.k232 != null || values.k270 != null || values.deltaK != null || values.peroxide != null;

  if (!hasAny) {
    return null;
  }
  if (withinEvoo(values)) {
    return TUNISIA_OIL_CATEGORY_LABELS.EXTRA_VIERGE;
  }
  if (withinVirgin(values)) {
    return TUNISIA_OIL_CATEGORY_LABELS.VIERGE;
  }
  return TUNISIA_OIL_CATEGORY_LABELS.LAMPANTE;
}

export function extractOilMeasurements(values: Record<string, string | number | boolean | null | undefined>): OilMeasurementValues {
  const num = (key: string): number | null => {
    const raw = values[key];
    if (raw == null || raw === '') {
      return null;
    }
    const parsed = typeof raw === 'number' ? raw : Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
  };

  return {
    acidity: num('Acidite'),
    k232: num('K232'),
    k270: num('K270'),
    deltaK: num('DeltaK'),
    peroxide: num('IndicePreoxyde')
  };
}

export function isTunisiaDefaultRule(description?: string | null): boolean {
  return !!description?.includes(TUNISIA_QC_REGULATORY_MARKER);
}

export function isAboveVirginCoiLimit(ruleKey: string, maxValue?: number | null): boolean {
  if (maxValue == null) {
    return false;
  }
  switch (ruleKey) {
    case 'Acidite':
      return maxValue > COI_VIRGIN_LIMITS.acidity;
    case 'K232':
      return maxValue > COI_VIRGIN_LIMITS.k232;
    case 'K270':
      return maxValue > COI_VIRGIN_LIMITS.k270;
    case 'DeltaK':
      return maxValue > COI_VIRGIN_LIMITS.deltaK;
    case 'IndicePreoxyde':
      return maxValue > COI_VIRGIN_LIMITS.peroxide;
    default:
      return false;
  }
}
