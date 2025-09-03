// config/facture-dechet.config.ts
import {PdfFactureConfig} from '../../shared/models/pdf-config.model';
import {UnifiedDelivery} from '../../shared/models/UnifiedDelivery';
import {CompanyProfile} from '../../shared/models/CompanyProfile';


export function factureDechetConfig(
  delivery: UnifiedDelivery,
  company: CompanyProfile,
): PdfFactureConfig {
  const unitPrice = delivery.unitPrice || 0;
  const quantity = delivery.poidsNet || 0;
  const total = unitPrice * quantity;

  return {
    title: 'FACTURE ' + (delivery.lotNumber ?? 'Sans titre'),
    reference: `${delivery.lotNumber || 'XXXX'} 'PDF.VENTE_DECHET')}`,
    date: new Date().toLocaleDateString(),

    companyInfo: {
      companyName: company.legalName,
      address: `${company.addressLine1 || ''}, ${company.city || ''} ${company.postalCode || ''}`,
      vatNumber: company.taxId,
      mobile: company.phone || '',
      website: company.website || company.email || ''
    },

    generalInfo: [
      {
        label: 'PDF.CUSTOMER',
        value: `${delivery.supplier?.supplierInfo?.name || ''} ${delivery.supplier?.supplierInfo?.lastname || ''}`.trim()
      },
      {label: 'PDF.PHONE', value: delivery.supplier?.supplierInfo?.phone || ''},
      {label: 'PDF.ADDRESS', value: delivery.supplier?.supplierInfo?.address || ''}
    ],

    fields: [
      {
        label: 'PDF.DESCRIPTION',
        value: 'Traitement des déchets oléicoles'
      },
      {
        label: 'PDF.PRICE_UNIT',
        value: `${unitPrice.toFixed(3)} TND/kg`
      },
      {
        label: 'PDF.QUANTITY',
        value: `${quantity} kg`
      },
      {
        label: 'PDF.TOTAL',
        value: `${total.toFixed(3)} TND`
      }
    ],

    fileName: `Facture_${delivery.deliveryNumber || 'inconnu'}.pdf`
  };
}
