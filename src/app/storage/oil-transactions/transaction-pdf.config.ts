// src/app/shared/pdf-configs/oil-transaction-pdf.config.ts

import {PdfConfig} from 'src/app/shared/models/pdf-config.model';
import {OilTransaction} from 'src/app/shared/models/OilTransaction';

/**
 * Génère la configuration PDF pour un bon de transaction d'huile
 */
export function getOilTransactionPdfConfig(data: OilTransaction): PdfConfig {
  const reception = data.reception;
  const supplier = reception?.supplier;

  return {
    title: 'PDF.TRANSACTION_OIL',
    reference: reception?.lotNumber || data.id || '',
    date: data.createdDate,
    generalInfo: [
      {
        label: 'PDF.DESTINATION_UNIT',
        value: data.storageUnitDestination?.name || '---'
      },
      {
        label: 'PDF.TRANSACTION_STATE',
        value: data.transactionState ? `PDF.${data.transactionState}` : '---'
      },
      {
        label: 'PDF.CREATED_DATE',
        value: data.createdDate ? data.createdDate.toString() : '---'
      },
      {
        label: 'PDF.QUALITY_GRADE',
        value: data.qualityGrade || '---'
      },
      {
        label: 'PDF.RECEPTION_DATE',
        value: reception?.deliveryDate ? reception.deliveryDate.toString() : '---'
      },
      {
        label: 'PDF.QUANTITY',
        value: `${data.quantityKg || 0} kg`
      }
    ],
    fields: [
      {label: 'PDF.RECEPTION_ID', value: reception?.lotNumber || '---'},
      {
        label: 'PDF.RECEPTION_SUPPLIER', value: supplier
          ? `${supplier.supplierInfo?.name || ''} ${supplier.supplierInfo?.lastname || ''}`.trim()
          : '---'
      },
      {label: 'PDF.RECEPTION_DATE', value: reception?.deliveryDate ? reception.deliveryDate.toString() : '---'},
      {label: 'PDF.RECEPTION_REGION', value: reception?.region?.name || '---'}
    ],
    footerInfo: [
      {label: 'PDF.SIGNATURE_AGENT'},
      {label: 'PDF.SIGNATURE_RESPONSIBLE'}
    ],
    fileName: `Bon_Transaction_Huile_${reception?.lotNumber || data.id || 'inconnu'}.pdf`
  };
}

/**
 * Configuration par défaut en cas de données invalides
 */
function getDefaultOilTransactionPdfConfig(): PdfConfig {
  return {
    title: 'PDF.TRANSACTION_OIL',
    reference: '---',
    generalInfo: [{label: 'PDF.ERROR', value: 'Données manquantes'}],
    fields: [],
    footerInfo: [],
    fileName: 'Erreur_Donnees_Manquantes.pdf'
  };
}
