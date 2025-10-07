import { PdfConfig } from '../../shared/models/pdf-config.model';
import { UnifiedDelivery } from '../../shared/models/UnifiedDelivery';

export function getProductionPdfConfig(data: UnifiedDelivery, parameters: any): PdfConfig {
  // récupération du prix de trituration depuis les paramètres
  const prixUnitaire = parseFloat(parameters?.PRIX_TRITURATION_KG?.value || '0') || 0.170;

  // calculs
  const qteHuile = data.oilQuantity || 0;
  const qteOlive = data.poidsNet || 0;
  const rendement = data.rendement || 0;
  const storageunit = data.storageUnit?.name || 'N/A';
  const prixTotal = +(qteHuile * prixUnitaire).toFixed(3); // prix total formaté
  const dateTrituration = data.trtDate
    ? new Date(data.trtDate).toLocaleDateString()
    : new Date().toLocaleDateString();

  return {
    title: 'PDF.PRODUCTION_RECEIPT',
    reference: 'FOR-CQH-01',
    date:  '01/12/2024',
    Number: `${data.deliveryNumber} / ${new Date().getFullYear().toString().slice(-2)}`,
    revision:'00',
    generalInfo: [
      { label: 'PDF.LOT_NUMBER', value: data.globalLotNumber || data.lotNumber || '-' },
      { label: 'PDF.RECEPTION_NUMBER', value: data.deliveryNumber || '-' },
      {
        label: 'PDF.SUPPLIER',
        value: data.supplier?.name + ' ' + data.supplier.lastname || '-'
      },
      { label: 'PDF.REGION', value: data.region?.name || '-' },
      { label: 'PDF.OLIVE_VARIETY', value: data.oliveVariety?.name || '-' },
      { label: 'PDF.OLIVE_TYPE', value: data.oliveType || '-' }
    ],
    fields: [
      {label: 'PDF.CRUSHING_DATE', value: dateTrituration},
      {label: 'DELIVERIES.FIELDS.OLIVE_QUANTITY', value: `${qteOlive} kg`},
      {label: 'PDF.OIL_QUANTITY', value: `${qteHuile} kg`},
      { label: 'PDF.YIELD', value: `${rendement.toFixed(3)} %` },
      {label: 'CONTROLE_QUALITE.STORAGE_UNIT.LABEL', value: `${storageunit} `},
      // {label: 'PDF.CRUSHING_PRICE_PER_KG', value: `${prixUnitaire.toFixed(3)} TND/kg`},
      // {label: 'PDF.CRUSHING_TOTAL_PRICE', value: `${prixTotal} TND`},
    ],
    footerInfo: [
      {label: 'PDF.QUALITY_MANAGER'},
      {label: 'PDF.PRODUCTION_MANAGER'},
      {label: 'PDF.SIGNATURE'},
      {label: 'PDF.DATE'}
    ],
    fileName: `BonProduction_${data.lotNumber || 'LOT'}`
  };
}
