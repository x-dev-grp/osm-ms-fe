import {UnifiedDelivery} from "../../../shared/models/UnifiedDelivery";
import {PdfConfig} from "../../../shared/models/pdf-config.model";
import {QualityControlResultDto} from "../../../shared/models/QualityControlResultDto";

export function getControlQualitePdfConfig(delivery: UnifiedDelivery, deliveryType: string): PdfConfig {
  const type = deliveryType?.toUpperCase();
  const isOil = type === 'OIL' || type === 'HUILE';
  const isOlive = type === 'OLIVE';

  const title = isOil
    ? 'PDF.FICH_CONTROL_QUALITE_HUIL'
    : isOlive
      ? 'PDF.FICH_CONTROL_QUALITE_OLIVE'
      : 'PDF.FICH_CONTROL_QUALITE';

  // -- helpers -------------------------------------------------------------

  // Normalize to build robust keys (uppercase, no accents, trim multi-spaces)
  const norm = (s?: string) =>
    (s ?? '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip diacritics
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();

  // Build a map of results by normalized rule name
  const resultMap = new Map<string, QualityControlResultDto>(
    (delivery.qualityControlResults || []).map(result => [norm(result.rule?.ruleName), result])
  );

  // Prefer rule/result.labelTranslation → else FR fallback → else rule.label / rule.ruleName / provided key
  const pickLabel = (ruleKey: string, frFallback: string): string => {
    const r = resultMap.get(norm(ruleKey));
    const fromTranslation =
      (r?.rule as any)?.labelTranslation ??
      (r as any)?.labelTranslation;
    const fromLabelAttr =
      (r?.rule as any)?.label ??
      (r as any)?.label ??
      r?.rule?.ruleName;

    return (typeof fromTranslation === 'string' && fromTranslation.trim().length > 0)
      ? fromTranslation
      : (frFallback || fromLabelAttr || ruleKey);
  };

  const getValue = (result?: QualityControlResultDto): string =>
    result?.measuredValue != null ? `${result.measuredValue}` : 'N/A';

  // Fetch by a human key (with accents if you like); lookup is normalized
  const by = (key: string) => resultMap.get(norm(key));

  // -- fields --------------------------------------------------------------

  const fields: { label: string; value: string }[] = [];

  if (isOil) {
    fields.push(
      { label: pickLabel('ACIDITÉ', 'Acidité'), value: getValue(by('ACIDITÉ')) },
      { label: pickLabel('DELTA K', 'Delta K'), value: getValue(by('DELTA K')) },
      { label: pickLabel('INDICE PEROXYDE', 'Indice Peroxyde'), value: getValue(by('INDICE PEROXYDE')) },
      { label: pickLabel('K232', 'K232'), value: getValue(by('K232')) },
      { label: pickLabel('K270', 'K270'), value: getValue(by('K270')) },
      { label: pickLabel('CATÉGORIE HUIL', 'Catégorie Huile'), value: getValue(by('CATÉGORIE HUIL')) },
    );
  } else if (isOlive) {
    fields.push(
      { label: pickLabel('ENDOMMAGÉES %', 'Endommagées %'), value: getValue(by('ENDOMMAGÉES %')) },
      { label: pickLabel('FERMENTÉES %', 'Fermentées %'), value: getValue(by('FERMENTÉES %')) },
      { label: pickLabel('INFESTÉES %', 'Infestées %'), value: getValue(by('INFESTÉES %')) },
      { label: pickLabel('CATÉGORIE OLIVE', 'Catégorie Olive'), value: getValue(by('CATÉGORIE OLIVE')) },
    );
  } else {
    fields.push({ label: 'PDF.NO_QUALITY_DATA', value: 'N/A' });
  }

  // -- config --------------------------------------------------------------

  return {
    title,
    reference: delivery.lotNumber || 'N/A',

    generalInfo: [
      { label: 'PDF.DATE', value: delivery.deliveryDate ? new Date(delivery.deliveryDate).toLocaleDateString() : 'N/A' },
      {
        label: 'PDF.SUPPLIER',
        value: `${delivery.supplier?.supplierInfo?.name || ''} ${delivery.supplier?.supplierInfo?.lastname || ''}`.trim() || 'N/A',
      },
      { label: 'PDF.EXPENSE_RECEIPT_NUMBER', value: delivery.deliveryNumber || 'N/A' },
      { label: 'PDF.VEHICLE_REGISTRATION', value: delivery.matriculeCamion || 'N/A' },
      { label: 'PDF.TRUCK_STATE', value: delivery.etatCamion || 'N/A' },
    ],

    fields,

    footerInfo: [
      { label: 'PDF.SIGNATURE_AGENT' },
      { label: 'PDF.SIGNATURE_RESPONSIBLE' },
    ],

    fileName: `Bon_Reception_${isOil ? 'Huile' : isOlive ? 'Olive' : 'Inconnu'}_${delivery.deliveryNumber || 'inconnu'}.pdf`,
  };
}
