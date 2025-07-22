// olive-pdf.config.ts
import {PdfConfig} from 'src/app/shared/models/pdf-config.model';
import {UnifiedDelivery} from 'src/app/shared/models/UnifiedDelivery';

export function getOlivePdfConfig(delivery: UnifiedDelivery): PdfConfig {
  return {
    title: 'PDF.RECEPTION_OLIVE',
    reference: delivery.lotNumber || '',
    generalInfo: [
      {label: 'PDF.TYPE', value: delivery.deliveryType || ''},
      {
        label: 'PDF.SUPPLIER',
        value: `${delivery.supplier?.supplierInfo?.name || ''} ${delivery.supplier?.supplierInfo?.lastname || ''}`
      },
      {label: 'PDF.PHONE', value: delivery.supplier?.supplierInfo?.phone || ''},
      {label: 'PDF.ADDRESS', value: delivery.supplier?.supplierInfo?.address || ''}
    ],
    fields: [
      {label: 'PDF.LOT', value: delivery.lotNumber || ''},
      {label: 'PDF.LOT_GLOBAL', value: delivery.globalLotNumber || ''},
      {label: 'PDF.GROSS_WEIGHT', value: `${delivery.poidsBrute || ''} kg`},
      {label: 'PDF.OLIVE_QUANTITY', value: `${delivery.oilQuantity || ''} kg`},
      {label: 'PDF.OLIVE_VARIETY', value: delivery.oliveVariety?.name || ''},
      {label: 'PDF.OLIVE_TYPE', value: delivery.oliveType?.name || ''},
      {label: 'PDF.REGION', value: delivery.region?.name || ''}
    ],
    footerInfo: [
      {label: 'PDF.SIGNATURE_AGENT'},
      {label: 'PDF.SIGNATURE_RESPONSIBLE'}
    ],
    fileName: `Bon_Reception_Olive_${delivery.deliveryNumber || 'inconnu'}.pdf`
  };
}
