import {UnifiedDelivery} from "../../shared/models/UnifiedDelivery";
import {PdfConfig} from "../../shared/models/pdf-config.model";

export function getOilPdfConfig(delivery: UnifiedDelivery): PdfConfig {

  return {
    title: 'PDF.RECEPTION_OIL',
    reference: delivery.lotNumber || '',
    generalInfo: [
      {
        label: 'PDF.DATE',
        value: delivery.deliveryDate
          ? new Date(delivery.deliveryDate).toLocaleDateString()
          : ''
      },

      {
        label: 'PDF.SUPPLIER',
        value: [
          delivery.supplier?.name || '',
          delivery.supplier?.lastname || ''
        ].filter(Boolean).join(' ')
      },

      {label: 'PDF.LOT', value: String(delivery.lotNumber || '')},
      {label: 'PDF.LOT_GLOBAL', value: String(delivery.globalLotNumber || 'N/A')},

      {label: 'PDF.QUALITY_FIELDS.CATEGORIE_HUILE', value: String(delivery.categoryOliveOil || 'N/A')},


      {label: 'PDF.OIL_QUANTITY', value: `${(delivery.oilQuantity ?? .0).toFixed(2)} kg`},
      {label: 'PDF.TOTAL_PRICE', value: `${(delivery.price ?? .0).toFixed(2)} TND`},
      {label: 'PDF.UNIT_PRICE', value: `${(delivery.unitPrice ?? .0).toFixed(2)} TND/kg`},

    ],
    fields: [],

    footerInfo: [
      {label: 'PDF.SIGNATURE_AGENT'},
      {label: 'PDF.SIGNATURE_RESPONSIBLE'}
    ],
    fileName: `Bon_Reception_Huile_${delivery.deliveryNumber || 'inconnu'}.pdf`
  };
}
