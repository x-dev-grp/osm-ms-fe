// oil-pdf.config.ts
import {PdfConfig} from 'src/app/shared/models/pdf-config.model';
import {UnifiedDelivery} from 'src/app/shared/models/UnifiedDelivery';

export function getOilPdfConfig(delivery: UnifiedDelivery): PdfConfig {
  return {
    title: 'Bon De Réception Huile',
    reference: delivery.lotNumber || '',
    generalInfo: [
      {label: 'Type', value: delivery.deliveryType || ''},
      {
        label: 'Fournisseur',
        value: `${delivery.supplier?.supplierInfo?.name || ''} ${delivery.supplier?.supplierInfo?.lastname || ''}`
      },
      {label: 'Téléphone', value: delivery.supplier?.supplierInfo?.phone || ''},
      {label: 'Adresse', value: delivery.supplier?.supplierInfo?.address || ''}
    ],
    fields: [
      {label: 'Lot', value: delivery.lotNumber || ''},
      {label: 'Lot Global', value: delivery.globalLotNumber || ''},
      {label: 'Poids Brut', value: `${delivery.poidsBrute || ''} kg`},
      {label: "Quantité d'huile", value: `${delivery.oilQuantity || ''} kg`},
      {label: 'Variété Huile', value: delivery.oilVariety?.name || ''},
      {label: 'Type Huile', value: delivery.oilType?.name || ''},
      {label: 'Région', value: delivery.region?.name || ''}
    ],
    footerInfo: [
      {label: 'Signature Agent (bascule)'},
      {label: 'Signature Responsable CQ'}
    ],
    fileName: `Bon_Reception_Huile_${delivery.deliveryNumber || 'inconnu'}.pdf`
  };
}
