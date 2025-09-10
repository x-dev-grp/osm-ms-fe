import {PdfConfig} from "../../shared/models/pdf-config.model";
import {OilTransaction} from "../../shared/models/OilTransaction";

export function getOilSortiePdfConfig(data: OilTransaction): PdfConfig {

  return {
    title: 'PDF.OIL_DISPATCH', // ← New key: Bon de Sortie
    reference: data.reception?.lotNumber || '',
    generalInfo: [
      {
        label: 'PDF.DATE',
        value: data.createdDate
          ? new Date(data.createdDate).toLocaleDateString()
          : ''
      },
      {
        label: 'PDF.SUPPLIER',
        value: [
          data.reception?.supplier?.supplierInfo?.name || '',
          data?.reception?.supplier?.supplierInfo?.lastname || ''
        ].filter(Boolean).join(' ')
      },

      {
        label: 'OLIVE_RECEPTION.FORM.FIELDS.TRUCK_PLATE', // ← matricule
        value: String(data.reception?.matriculeCamion || 'N/A')
      },
      {
        label: 'PDF.LOT',
        value: String(data.reception?.lotNumber || '')
      },
      {
        label: 'PDF.OIL_TYPE',
        value: String(data.reception?.oilType || 'N/A')
      },
      {
        label: 'PDF.RECIPIENT', // ← destinataire
        value: String(data.reception?.supplier?.supplierInfo.name + ' ' + data.reception?.supplier.supplierInfo.lastname || 'N/A')
      }
    ],

    fields: [
      {
        label: 'PDF.TANK_NUMBER',     // ← num citerne
        value: String(data.reception?.matriculeCamion || 'N/A')
      },
      {
        label: 'PDF.DESIGNATION',
        value: '??????'
      },
      {
        label: 'PDF.QUANTITY',
        value: `${data?.quantityKg.toFixed(2)} kg`
      },
      {
        label: 'PDF.UNIT_PRICE',
        value: `${data?.unitPrice.toFixed(2)} TND/kg`
      },
      {
        label: 'PDF.TOTAL_PRICE',
        value: `${data?.totalPrice.toFixed(2)} TND`
      }
    ],

    footerInfo: [
      {label: 'PDF.SIGNATURE_AGENT'},
      {label: 'PDF.SIGNATURE_RESPONSIBLE'}
    ],
    fileName: `Bon_Sortie_Huile || 'inconnu'}.pdf`
  };
}
