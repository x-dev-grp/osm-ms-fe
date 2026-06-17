// olive-pdf.config.ts
import { PdfConfig } from 'src/app/shared/models/pdf-config.model';
import { UnifiedDelivery } from 'src/app/shared/models/UnifiedDelivery';
import { Olive_Oil_Type } from '../../shared/models/olive-type.enum';

export function getOlivePdfConfig(delivery: UnifiedDelivery): PdfConfig {
  function getoliveType(delivery: UnifiedDelivery) {
    if (delivery.deliveryType==='OLIVE' && delivery.oliveType === Olive_Oil_Type.OC) {
      return 'Conventionnelle';
    } else {
      return 'Biologique';
    }
    if (delivery.deliveryType==='OIL' && delivery.oilType === Olive_Oil_Type.OC) {
      return 'Conventionnelle';
    } else {
      return 'Biologique';
    }
  }

  return {
    title: 'PDF.RECEPTION_OLIVE',
    titleTranslatePath: 'AUTO.PDF_RECEPTION_OLIVE',
    reference:'FOR-CQH-01',
    revision:'00',
    date:  '01/12/2024',
    Number: `${delivery.deliveryNumber} / ${new Date().getFullYear().toString().slice(-2)}`,
    generalInfo: [
      {
        label: 'PDF.DATE',
        labelTranslatePath: 'AUTO.PDF_DATE',
        value: delivery.deliveryDate
          ? new Date(delivery.deliveryDate).toLocaleDateString() // Convert Date to string
          : ''
      },
      {
        label: 'PDF.PRODUCER',
        labelTranslatePath: 'AUTO.PDF_PRODUCER',
        value: [delivery.supplier?.name || '', delivery.supplier?.lastname || ''].filter(Boolean).join(' ') // Safely join name + lastname
      },
      { label: 'PDF.FERME',
        labelTranslatePath: 'AUTO.PDF_FERME', value: String(delivery.parcel?.name || '') },
      {
        label: 'PDF.LOT',
        labelTranslatePath: 'AUTO.PDF_LOT',
        value: String(delivery.lotNumber || '')
      },
      { label: 'PDF.TYPE',
        labelTranslatePath: 'AUTO.PDF_TYPE', value: getoliveType(delivery) }
    ],
    fields: [
      { label: 'PDF.PARCEL',
        labelTranslatePath: 'AUTO.PDF_PARCEL', value: String(delivery.parcel?.name || '') },
      {
        label: 'PDF.OLIVE_VARIETY',
        labelTranslatePath: 'AUTO.PDF_OLIVE_VARIETY',
        value: String(delivery.oliveVariety?.name || '') // Coerce to string
      },
      {
        label: 'PDF.NCOLIS',
        labelTranslatePath: 'AUTO.PDF_NCOLIS',
        value: delivery.sackCount != null ? String(delivery.sackCount) : 'N/A' // Handle number | string
      },
      {
        label: 'PDF.GROSS_WEIGHT',
        labelTranslatePath: 'AUTO.PDF_GROSS_WEIGHT',
        value: delivery.poidsBrute != null ? `${delivery.poidsBrute} kg` : 'N/A'
      },
      {
        label: 'DELIVERIES.FIELDS.NET_WEIGHT',
        labelTranslatePath: 'AUTO.DELIVERIES_FIELDS_NET_WEIGHT',
        value: delivery.poidsNet != null ? `${delivery.poidsNet} kg` : 'N/A'
      }
    ],
    footerInfo: [{ label: 'PDF.SIGNATURE_AGENT',
                   labelTranslatePath: 'AUTO.PDF_SIGNATURE_AGENT' }, { label: 'PDF.TRANSPORTER',
                                                     labelTranslatePath: 'AUTO.PDF_TRANSPORTER' }, { label: 'PDF.BASCULE',
                                                                                   labelTranslatePath: 'AUTO.PDF_BASCULE' }],
    fileName: `Bon_Reception_Olive_${delivery.deliveryNumber || 'inconnu'}.pdf`
  };
}
