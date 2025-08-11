// src/app/shared/pdf/production-pdf.config.ts

import {PdfConfig} from "../../../shared/models/pdf-config.model";

export function getProductionPdfConfig(dataEntry: any): PdfConfig {
  const dateLivraison = new Date(dataEntry.deliveryDate).toLocaleDateString();
  const dateTrituration = new Date(dataEntry.trtDate).toLocaleDateString();

  const poidsNetOlives = `${dataEntry.poidsNet} kg`;
  const qteHuile = `${dataEntry.oilQuantity || 0} L`;
  const rendement = `${(dataEntry.rendement || 0).toFixed(2)} %`;
  const prixTriturationParKg = '0.15 DNT/kg';
  const prixTotalTrituration = `${(dataEntry.poidsNet * 0.15).toFixed(2)} DNT`;

  return {
    title: 'PDF.PRODUCTION_RECEIPT',
    reference: dataEntry.deliveryNumber || 'N/A',
    date: new Date().toLocaleDateString(),
    generalInfo: [
      {label: 'PDF.LOT_NUMBER', value: dataEntry.lotNumber || '-'},
      {label: 'PDF.RECEPTION_NUMBER', value: dataEntry.deliveryNumber || '-'},
      {label: 'PDF.DELIVERY_DATE', value: dateLivraison},
      {label: 'PDF.OLIVE_NET_WEIGHT', value: poidsNetOlives},
      {label: 'PDF.SUPPLIER', value: dataEntry.supplier?.supplierInfo?.name || '-'},
      {label: 'PDF.REGION', value: dataEntry.region?.name || '-'},
      {label: 'PDF.OLIVE_VARIETY', value: dataEntry.oliveVariety?.name || '-'},
      {label: 'PDF.OLIVE_TYPE', value: dataEntry.oliveType?.name || '-'}
    ],
    fields: [
      {label: 'PDF.OIL_QUANTITY', value: qteHuile},
      {label: 'PDF.YIELD', value: rendement},
      {label: 'PDF.CRUSHING_PRICE_PER_KG', value: prixTriturationParKg},
      {label: 'PDF.CRUSHING_TOTAL_PRICE', value: prixTotalTrituration},
      {label: 'PDF.CRUSHING_DATE', value: dateTrituration}
    ],
    footerInfo: [
      {label: 'PDF.QUALITY_MANAGER'},
      {label: 'PDF.PRODUCTION_MANAGER'},
      {label: 'PDF.SIGNATURE'},
      {label: 'PDF.DATE'}
    ],
    fileName: `BonProduction_${dataEntry.lotNumber || 'LOT'}`
  };
}
