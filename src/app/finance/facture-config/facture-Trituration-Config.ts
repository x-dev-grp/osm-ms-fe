// config/facture-trituration.config.ts
import {PdfFactureConfig} from '../../shared/models/pdf-config.model';
import {UnifiedDelivery} from '../../shared/models/UnifiedDelivery';
import {CompanyProfile} from '../../shared/models/CompanyProfile';

export function factureTriturationConfig(
  delivery: UnifiedDelivery,
  company: CompanyProfile
): PdfFactureConfig {
  const unitPrice = delivery.unitPrice || 9.500;

  return {
    title: 'FACTURE ' + (delivery.lotNumber ?? "Sans titre"),
    reference: `${delivery.lotNumber || 'XXXX'} ` + ' ' + delivery.operationType,
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
        value: `${delivery.supplier?.supplierInfo?.name || ''} ${delivery.supplier?.supplierInfo?.lastname || ''}`
      },
      {label: 'PDF.PHONE', value: delivery.supplier?.supplierInfo?.phone || ''},
      {label: 'PDF.ADDRESS', value: delivery.supplier?.supplierInfo?.address || ''}
    ],
    fields: [
      {label: 'PDF.DESCRIPTION', value: delivery.deliveryType || 'Huile d\'olive'},
      {label: 'PDF.PRICE_UNIT', value: `${unitPrice} TND/kg`},
      {label: 'PDF.QUANTITY', value: `${delivery.oilQuantity} kg`},
      {label: 'PDF.TOTAL', value: `${delivery.paidAmount?.toFixed(2)} TND`}
    ],
    fileName: `Facture_${delivery.deliveryNumber || 'inconnu'}.pdf`
  };
}
