// config/facture-vente-huile.config.ts
import {PdfFactureConfig} from '../../shared/models/pdf-config.model';
import {UnifiedDelivery} from '../../shared/models/UnifiedDelivery';
import {CompanyProfile} from '../../shared/models/CompanyProfile';

export function factureVenteHuileConfig(
  delivery: UnifiedDelivery,
  company: CompanyProfile
): PdfFactureConfig {
  const oilQuantity = delivery.oilQuantity || 0;
  const unitPrice = delivery.unitPrice ?? 8.5;
  const total = delivery.paidAmount;

  return {
    title: 'FACTURE ' + (delivery.lotNumber ?? 'Sans titre'),
    reference: `${delivery.lotNumber || 'XXXX'} Vente Huile `,
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
        value: delivery.deliveryType || 'Huile d\'olive vierge extra'
      },
      {
        label: 'PDF.PRICE_UNIT',
        value: `${unitPrice.toFixed(3)} TND/kg`
      },
      {
        label: 'PDF.QUANTITY',
        value: `${oilQuantity} kg`
      },
      {
        label: 'PDF.TOTAL',
        value: `${total} TND`
      }
    ],

    fileName: `Facture_${delivery.deliveryNumber || 'inconnu'}.pdf`
  };
}
