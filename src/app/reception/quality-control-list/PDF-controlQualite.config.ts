import {UnifiedDelivery} from "../../shared/models/UnifiedDelivery";
import {PdfConfig} from "../../shared/models/pdf-config.model";
import {QualityControlResultDto} from "../../shared/models/QualityControlResultDto";

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

// Parcourir TOUS les résultats de contrôle qualité
  if (delivery.qualityControlResults && delivery.qualityControlResults.length > 0) {

    delivery.qualityControlResults.filter(value => value.rule.ruleType!= 'STRING').forEach(result => {
      if (!result.rule) return; // Ignorer si pas de règle associée

      const ruleName = result.rule.ruleName || 'Règle sans nom';
      const label = pickLabel(ruleName, ruleName); // Utilise le mécanisme existant pour traduire/normaliser
      const value = getValue(result);

      fields.push({label, value});
    });
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
        value: `${delivery.supplier?.name || ''} ${delivery.supplier?.lastname || ''}`.trim() || 'N/A',
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
