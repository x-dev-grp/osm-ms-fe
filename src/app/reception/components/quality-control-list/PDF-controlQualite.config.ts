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

  const resultMap = new Map<string, QualityControlResultDto>(
    (delivery.qualityControlResults || []).map(result => [result.rule?.ruleName?.toUpperCase() || '', result])
  );

  const getValue = (result?: QualityControlResultDto): string =>
    result?.measuredValue != null ? `${result.measuredValue}` : 'N/A';

  const fields: { label: string, value: string }[] = [];

  if (isOil) {
    fields.push(
      {label: 'Acidité', value: getValue(resultMap.get('ACIDITÉ'))},
      {label: 'Delta K', value: getValue(resultMap.get('DELTA K'))},
      {label: 'Indice Peroxyde', value: getValue(resultMap.get('INDICE PEROXYDE'))},
      {label: 'K232', value: getValue(resultMap.get('K232'))},
      {label: 'K270', value: getValue(resultMap.get('K270'))},
      {label: 'Catégorie Huile', value: getValue(resultMap.get('CATÉGORIE HUIL'))}
    );
  } else if (isOlive) {
    fields.push(
      {label: 'Endommagées %', value: getValue(resultMap.get('ENDOMMAGÉES %'))},
      {label: 'Fermentées %', value: getValue(resultMap.get('FERMENTÉES %'))},
      {label: 'Infestées %', value: getValue(resultMap.get('INFESTÉES %'))},
      {label: 'Catégorie Olive', value: getValue(resultMap.get('CATÉGORIE OLIVE'))}
    );
  } else {
    fields.push({label: 'PDF.NO_QUALITY_DATA', value: 'N/A'});
  }

  return {
    title,
    reference: delivery.lotNumber || 'N/A',

    generalInfo: [
      {label: 'PDF.DATE', value: delivery.deliveryDate ? new Date(delivery.deliveryDate).toLocaleDateString() : 'N/A'},
      {
        label: 'PDF.SUPPLIER',
        value: `${delivery.supplier?.supplierInfo?.name || ''} ${delivery.supplier?.supplierInfo?.lastname || ''}`.trim() || 'N/A'
      },
      {label: 'PDF.EXPENSE_RECEIPT_NUMBER', value: delivery.deliveryNumber || 'N/A'},
      {label: 'PDF.VEHICLE_REGISTRATION', value: delivery.matriculeCamion || 'N/A'},
      {label: 'PDF.TRUCK_STATE', value: delivery.etatCamion || 'N/A'}
    ],

    fields,

    footerInfo: [
      {label: 'PDF.SIGNATURE_AGENT'},
      {label: 'PDF.SIGNATURE_RESPONSIBLE'}
    ],

    fileName: `Bon_Reception_${isOil ? 'Huile' : isOlive ? 'Olive' : 'Inconnu'}_${delivery.deliveryNumber || 'inconnu'}.pdf`
  };
}
