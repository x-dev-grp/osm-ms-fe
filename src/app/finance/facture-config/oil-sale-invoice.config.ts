import {PdfConfig} from '../../shared/models/pdf-config.model';
import {UnifiedDelivery} from '../../shared/models/UnifiedDelivery';

export function getInvoicePdfConfig(delivery: UnifiedDelivery): PdfConfig {
  // Quantité d'huile
  const oilQuantity = delivery.oilQuantity || 0;
  const unitPrice = delivery.unitPrice ?? 8.5; // Prix unitaire en TND/kg
  const total = oilQuantity * unitPrice; // Pas de TVA

  return {
    title: 'FACTURE' + ' ' + (delivery.lotNumber ?? "Sans titre"),
    reference: `INV-${delivery.lotNumber || 'XXXX'}`,
    date: new Date().toLocaleDateString(),

    generalInfo: [
      {
        label: 'PDF.CUSTOMER',
        value: delivery.supplier.supplierInfo.name + ' ' + delivery.supplier.supplierInfo.lastname
      }, // Client : "Cooperative Agricole"
      {label: 'PDF.INVOICE_NUMBER', value: delivery.deliveryNumber || 'N/A'},
      {label: 'PDF.INVOICE_DATE', value: new Date().toLocaleDateString()},
      {
        label: 'PDF.SUPPLIER',
        value: `${delivery.supplier?.supplierInfo?.name || ''} ${delivery.supplier?.supplierInfo?.lastname || ''}`
      },
      {label: 'PDF.PHONE', value: delivery.supplier?.supplierInfo?.phone || ''},
      {label: 'PDF.ADDRESS', value: delivery.supplier?.supplierInfo?.address || ''}
    ],

    fields: [
      {label: 'PDF.PRODUCT', value: delivery.unitPrice + ' ' + delivery.oliveQuantity},

    ],

    footerInfo: [
      // Ligne 1
      {label: 'PDF.COMPANY_ADDRESS', placeholder: ''},
      {label: 'PDF.COMPANY_EMAIL', placeholder: ''},
      {label: 'PDF.COMPANY_PHONE', placeholder: ''},
      {label: 'PDF.COMPANY_FAX', placeholder: ''},

      // Ligne 2
      {label: 'PDF.COMPANY_RIB', placeholder: ''},
      {label: 'PDF.COMPANY_TAX_NUMBER', placeholder: ''},
      {label: 'PDF.COMPANY_WEBSITE', placeholder: ''}
      // 4ème champ optionnel (vide ou tu peux ajouter autre chose)
    ],

    fileName: `Facture_${delivery.deliveryNumber || 'inconnu'}.pdf`
  };
}
