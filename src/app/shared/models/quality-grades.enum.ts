export enum QualityGrades {
  VIRGIN = 'VIRGIN',
  EXTRA_VIRGIN = 'EXTRA_VIRGIN',
  LAMPANTE = 'LAMPANTE',
  OTHER = 'OTHER',
  REFINED = 'REFINED'
}

export const QUALITY_GRADE_OFFICIAL_NAMES: Record<QualityGrades, string> = {
  [QualityGrades.EXTRA_VIRGIN]: "Huile d'olive vierge extra",
  [QualityGrades.VIRGIN]: "Huile d'olive vierge",
  [QualityGrades.REFINED]: "Huile d'olive raffinée",
  [QualityGrades.LAMPANTE]: "Huile d'olive lampante",
  [QualityGrades.OTHER]: "Huile d'olive"
};

export function isQualityGrade(value: string | null | undefined): value is QualityGrades {
  return !!value && Object.values(QualityGrades).includes(value as QualityGrades);
}

export function resolveQualityGradeLabel(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }

  if (isQualityGrade(value)) {
    return QUALITY_GRADE_OFFICIAL_NAMES[value];
  }

  return value;
}
