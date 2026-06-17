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
    titleTranslatePath: 'AUTO.PDF_TRANSACTION_OIL',
    reference: reception?.lotNumber || data.id || '',
    date: data.createdDate,
    generalInfo: [

      {

        label: 'PDF.DATE',
        labelTranslatePath: 'AUTO.PDF_DATE',
        value: data.createdDate
          ? new Date(data.createdDate).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
          : 'N/A'
      },
      {
        label: 'PDF.SOURCE_UNIT',
        labelTranslatePath: 'AUTO.PDF_SOURCE_UNIT',
        value: data.storageUnitSource?.name || '---'
      },
      {
        label: 'PDF.DESTINATION_UNIT',
        labelTranslatePath: 'AUTO.PDF_DESTINATION_UNIT',
        value: data.storageUnitDestination?.name || '---'
      },

      {
        label: 'PDF.TRANSACTION_STATE',
        labelTranslatePath: 'AUTO.PDF_TRANSACTION_STATE',
        value: data.transactionState ? `PDF.${data.transactionState}` : '---'
      },
      {
        label: 'PDF.CREATED_DATE',
        labelTranslatePath: 'AUTO.PDF_CREATED_DATE',
        value: data.createdDate ? new Date(data.createdDate).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
          : 'N/A'
      },
      {
        label: 'PDF.QUALITY_GRADE',
        labelTranslatePath: 'AUTO.PDF_QUALITY_GRADE',
        value: data.qualityGrade || '---'
      },
      {
        label: 'PDF.RECEPTION_DATE',
        labelTranslatePath: 'AUTO.PDF_RECEPTION_DATE',
        value: data.createdDate ? new Date(data.createdDate).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
          : 'N/A'
      },
      {
        label: 'PDF.QUANTITY',
        labelTranslatePath: 'AUTO.PDF_QUANTITY',
        value: `${data.quantityKg || 0} kg`
      }
    ],
    fields: [
      {label: 'PDF.RECEPTION_ID',
       labelTranslatePath: 'AUTO.PDF_RECEPTION_ID', value: reception?.lotNumber || '---'},
      {
        label: 'PDF.RECEPTION_SUPPLIER',
        labelTranslatePath: 'AUTO.PDF_RECEPTION_SUPPLIER', value: supplier
          ? `${supplier?.name || ''} ${supplier?.lastname || ''}`.trim()
          : '---'
      },
      {
        label: 'PDF.RECEPTION_DATE',
        labelTranslatePath: 'AUTO.PDF_RECEPTION_DATE',
        value: reception?.deliveryDate ? new Date(reception.deliveryDate).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
          : 'N/A',
      },

      {
        label: 'PDF.RECEPTION_REGION',
        labelTranslatePath: 'AUTO.PDF_RECEPTION_REGION', value: reception?.region?.name || '---'
      }
    ],
    footerInfo: [
      {label: 'PDF.SIGNATURE_AGENT',
       labelTranslatePath: 'AUTO.PDF_SIGNATURE_AGENT'},
      {label: 'PDF.SIGNATURE_RESPONSIBLE',
       labelTranslatePath: 'AUTO.PDF_SIGNATURE_RESPONSIBLE'}
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
    titleTranslatePath: 'AUTO.PDF_TRANSACTION_OIL',
    reference: '---',
    generalInfo: [{label: 'PDF.ERROR',
                   labelTranslatePath: 'AUTO.PDF_ERROR', value: 'Données manquantes'}],
    fields: [],
    footerInfo: [],
    fileName: 'Erreur_Donnees_Manquantes.pdf'
  };
}
