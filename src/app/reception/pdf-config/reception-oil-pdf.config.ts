import { UnifiedDelivery } from '../../shared/models/UnifiedDelivery';
import { PdfConfig } from '../../shared/models/pdf-config.model';
import { QualityControlResultDto } from '../../shared/models/QualityControlResultDto';

export type OilGrade = 'EXTRA_VIRGIN' | 'VIRGIN' | 'LAMPANTE' | 'REFINED' | 'POMACE' | 'UNKNOWN';

export function getOilPdfConfig(delivery: UnifiedDelivery): PdfConfig {
  const OIL_GRADE_ALIASES: Record<Exclude<OilGrade, 'UNKNOWN'>, string[]> = {
    EXTRA_VIRGIN: [
      'extra virgin',
      'extra-virgin',
      'extra_virgin',
      'evoo',
      'extra vierge',
      'extra-virge',
      'extravierge',
      'زيت بكر ممتاز',
      'بكر ممتاز'
    ],
    VIRGIN: ['virgin', 'vierge', 'زيت بكر', 'بكر'],
    LAMPANTE: ['lampante', 'lampant', 'لامبانتي', 'لامبانتيه'],
    REFINED: ['refined', 'raffiné', 'raffine', 'مكرر'],
    POMACE: ['pomace', 'huile de grignons', 'grignons', 'مخلفات الزيتون', 'الجفت']
  };
  const GRADE_RULE_HINTS = [
    'quality',
    'qualite',
    'qualité',
    'oil_grade',
    'grade',
    'Dégustation',
    'dégustation',
    'classe',
    'categorie',
    'catégorie',
    'category',
    'نوع',
    'جودة'
  ];

  function normalize(input: string): string {
    return input
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim();
  }

  function pickFirstTruthy<T>(...vals: (T | null | undefined)[]): T | undefined {
    for (const v of vals) if (v !== null && v !== undefined && String(v).trim() !== '') return v as T;
    return undefined;
  }

  /**
   * Try to map any string to a canonical OilGrade using aliases.
   */
  function toOilGrade(str: string): OilGrade | undefined {
    const n = normalize(str);
    for (const [grade, aliases] of Object.entries(OIL_GRADE_ALIASES) as [OilGrade, string[]][]) {
      if (aliases.some((a) => n === normalize(a))) return grade;
    }
    // also accept exact canonical tokens (already normalized-like)
    switch (n.replace(/\s+/g, '_')) {
      case 'extra_virgin':
        return 'EXTRA_VIRGIN';
      case 'virgin':
        return 'VIRGIN';
      case 'lampante':
        return 'LAMPANTE';
      case 'refined':
        return 'REFINED';
      case 'pomace':
        return 'POMACE';
    }
    return undefined;
  }

  /**
   * Extract a grade-like value from a QC result record.
   * Handles strings, objects with {grade: ...}, or displayValue fallbacks.
   */
  function extractGradeFromQcItem(qc: QualityControlResultDto): OilGrade | undefined {
    // 1) Prefer fields from rules that *look* like grade/quality
    const ruleName = normalize(pickFirstTruthy(qc.rule.ruleKey, qc.rule.ruleName) ?? '');
    const ruleLooksLikeGrade = GRADE_RULE_HINTS.some((h) => ruleName.includes(h));

    const candidate = pickFirstTruthy<string>(qc.measuredValue, typeof qc.rule.ruleName === 'string' ? qc.rule.ruleKey : undefined);

    if (ruleLooksLikeGrade && candidate) {
      const g = toOilGrade(candidate);
      if (g) return g;
    }

    // 2) If value is an object, try common shapes
    if (qc.measuredValue && typeof qc.measuredValue === 'object') {
      const v = qc.measuredValue as any;
      const objCandidate = pickFirstTruthy<string>(v.grade, v.quality, v.oilGrade, v.oil_grade, v.class, v.category, v.nom);
      if (objCandidate) {
        const g = toOilGrade(objCandidate);
        if (g) return g;
      }
    }

    // 3) Even if rule name doesn't match, try any stringy value
    if (candidate) {
      return toOilGrade(candidate);
    }

    return undefined;
  }

  /**
   * Public API:
   * Returns a canonical OilGrade if found, otherwise 'UNKNOWN'.
   * If you prefer to return '' instead, replace the last line accordingly.
   */
  function getOilQuality(delivery: UnifiedDelivery): OilGrade {
    const list = delivery?.qualityControlResults ?? [];
    for (const qc of list) {
      const grade = extractGradeFromQcItem(qc);
      if (grade) return grade;
    }
    return 'UNKNOWN';
  }

  /**
   * Optional: pretty/printer or i18n key mapper for the returned grade.
   */
  function oilGradeLabelKey(grade: OilGrade): string {
    switch (grade) {
      case 'EXTRA_VIRGIN':
        return 'PDF.OIL_GRADE.EXTRA_VIRGIN';
      case 'VIRGIN':
        return 'PDF.OIL_GRADE.VIRGIN';
      case 'LAMPANTE':
        return 'PDF.OIL_GRADE.LAMPANTE';
      case 'REFINED':
        return 'PDF.OIL_GRADE.REFINED';
      case 'POMACE':
        return 'PDF.OIL_GRADE.POMACE';
      default:
        return 'PDF.OIL_GRADE.UNKNOWN';
    }
  }

  return {
    title: 'PDF.RECEPTION_OIL',
    titleTranslatePath: 'AUTO.PDF_RECEPTION_OIL',
    reference: 'FOR-ACH-21',
    date: '01/12/2024',
    revision: '00',
    Number: `${delivery.deliveryNumber} / ${new Date().getFullYear().toString().slice(-2)}`,

    generalInfo: [
      {
        label: 'PDF.DATE',
        labelTranslatePath: 'AUTO.PDF_DATE',
        value: delivery.deliveryDate ? new Date(delivery.deliveryDate).toLocaleDateString() : ''
      },

      {
        label: 'PDF.SUPPLIER',
        labelTranslatePath: 'AUTO.PDF_SUPPLIER',
        value: [delivery.supplier?.name || '', delivery.supplier?.lastname || ''].filter(Boolean).join(' ')
      },
      {
        label: 'PDF.RECPT_NOTE_OR_OLIVE_LOT_NUMBER',
        labelTranslatePath: 'AUTO.PDF_RECPT_NOTE_OR_OLIVE_LOT_NUMBER',
        value: String(delivery.lotOliveNumber || delivery.deliveryNumber)
      },
      { label: 'PDF.CODEECH',
        labelTranslatePath: 'AUTO.PDF_CODEECH', value: String(delivery.lotNumber || '') },
      { label: 'PDF.QUALITY',
        labelTranslatePath: 'AUTO.PDF_QUALITY', value: oilGradeLabelKey(getOilQuality(delivery)) },

      { label: 'PDF.LIEU_DU_STOCKAGE',
        labelTranslatePath: 'AUTO.PDF_LIEU_DU_STOCKAGE', value: String(delivery.storageUnit?.name || 'N/A') },

      { label: 'PDF.OIL_QUANTITY',
        labelTranslatePath: 'AUTO.PDF_OIL_QUANTITY', value: `${(delivery.oilQuantity ?? 0.0).toFixed(2)} kg` },
      { label: 'PDF.UNIT_PRICE',
        labelTranslatePath: 'AUTO.PDF_UNIT_PRICE', value: `${(delivery.unitPrice ?? 0.0).toFixed(2)} TND/kg` }
    ],
    fields: [],

    footerInfo: [{ label: 'PDF.SIGNATURE_AGENT',
                   labelTranslatePath: 'AUTO.PDF_SIGNATURE_AGENT' }, { label: 'PDF.SIGNATURE_RESPONSIBLE',
                                                     labelTranslatePath: 'AUTO.PDF_SIGNATURE_RESPONSIBLE' }],
    fileName: `Bon_Reception_Huile_${delivery.deliveryNumber || 'inconnu'}.pdf`
  };
}
