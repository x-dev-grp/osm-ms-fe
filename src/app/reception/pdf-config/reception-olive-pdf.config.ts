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
    reference:'FOR-CQH-01',
    revision:'00',
    date:  '01/12/2024',
    Number: `${delivery.deliveryNumber} / ${new Date().getFullYear().toString().slice(-2)}`,
    generalInfo: [
      {
        label: 'PDF.DATE',
        value: delivery.deliveryDate
          ? new Date(delivery.deliveryDate).toLocaleDateString() // Convert Date to string
          : ''
      },
      {
        label: 'PDF.PRODUCER',
        value: [delivery.supplier?.name || '', delivery.supplier?.lastname || ''].filter(Boolean).join(' ') // Safely join name + lastname
      },
      { label: 'PDF.FERME', value: String(delivery.parcel?.name || '') },
      {
        label: 'PDF.LOT',
        value: String(delivery.lotNumber || '')
      },
      { label: 'PDF.TYPE', value: getoliveType(delivery) }
    ],
    fields: [
      { label: 'PDF.PARCEL', value: String(delivery.parcel?.name || '') },
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
        label: 'DELIVERIES.FIELDS.NET_WEIGHT',
        value: delivery.poidsNet != null ? `${delivery.poidsNet} kg` : 'N/A'
      }
    ],
    footerInfo: [{ label: 'PDF.SIGNATURE_AGENT' }, { label: 'PDF.TRANSPORTER' }, { label: 'PDF.BASCULE' }],
    fileName: `Bon_Reception_Olive_${delivery.deliveryNumber || 'inconnu'}.pdf`
  };
}
