import {UnifiedDelivery} from "../../../shared/models/UnifiedDelivery";
import {PdfConfig} from "../../../shared/models/pdf-config.model";

export function getOilPdfConfig(delivery: UnifiedDelivery): PdfConfig {
  return {
    title: 'PDF.RECEPTION_OIL',
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
      {label: 'OLIVE_RECEPTION.FORM.FIELDS.TRUCK_PLATE', value: delivery.matriculeCamion || ''},
      {label: 'PDF.LOT_GLOBAL', value: delivery.globalLotNumber || 'N/A'},
      {label: 'PDF.GROSS_WEIGHT', value: `${delivery.poidsBrute || ''} kg`},
      {label: 'PDF.OIL_QUANTITY', value: `${delivery.oilQuantity || ''} kg`},
      {label: 'PDF.OIL_VARIETY', value: delivery.oilVariety?.name || ''},
      {label: 'PDF.OIL_TYPE', value: delivery.oilType || ''},
      {label: 'PDF.REGION', value: delivery.region?.name || ''}
    ],
    footerInfo: [
      {label: 'PDF.SIGNATURE_AGENT'},
      {label: 'PDF.SIGNATURE_RESPONSIBLE'}
    ],
    fileName: `Bon_Reception_Huile_${delivery.deliveryNumber || 'inconnu'}.pdf`
  };
}
