// olive-pdf.config.ts
import {PdfConfig} from 'src/app/shared/models/pdf-config.model';
import {UnifiedDelivery} from 'src/app/shared/models/UnifiedDelivery';

export function getOlivePdfConfig(delivery: UnifiedDelivery): PdfConfig {
  return {
    title: 'PDF.RECEPTION_OLIVE',
    reference: delivery.lotNumber || '',
    generalInfo: [
      {
        label: 'PDF.DATE',
        value: delivery.deliveryDate
          ? new Date(delivery.deliveryDate).toLocaleDateString() // Convert Date to string
          : ''
      },
      {
        label: 'PDF.SUPPLIER',
        value: [
          delivery.supplier?.supplierInfo?.name || '',
          delivery.supplier?.supplierInfo?.lastname || ''
        ].filter(Boolean).join(' ') // Safely join name + lastname
      },
      {label: 'PDF.PARCEL', value: String(delivery.parcel || '')},
      {label: 'PDF.LOT', value: String(delivery.lotNumber || '')},
      {label: 'PDF.TYPE', value: String(delivery.deliveryType || '')},
    ],
    fields: [
      {label: 'PDF.PARCEL', value: String(delivery.parcel?.name || '')},
      {
        label: 'PDF.OLIVE_VARIETY',
        value: String(delivery.oliveVariety?.name || '') // Coerce to string
      },
      {
        label: 'PDF.NCOLIS',
        value: delivery.sackCount != null ? String(delivery.sackCount) : 'N/A' // Handle number | string
      },
      {
        label: 'PDF.GROSS_WEIGHT',
        value: delivery.poidsBrute != null ? `${delivery.poidsBrute} kg` : 'N/A'
      },
      {
        label: 'PDF.OLIVE_QUANTITY',
        value: delivery.poidsNet != null ? `${delivery.poidsNet} kg` : 'N/A'
      }
    ],
    footerInfo: [
      {label: 'PDF.SIGNATURE_AGENT'},
      {label: 'PDF.SIGNATURE_RESPONSIBLE'}
    ],
    fileName: `Bon_Reception_Olive_${delivery.deliveryNumber || 'inconnu'}.pdf`
  };
}
