import {OilSale} from '../models/oil-sale.model';
import {CompanyProfile} from '../../shared/models/CompanyProfile';

export function factureVenteHuileConfig(
  sale: OilSale,
  company: CompanyProfile
): {
  reference: string;
  date: string;
  fileName: string;
  companyInfo: {
    website: string;
    address: string;
    companyName: string;
    mobile: string;
    vatNumber: string;
  };
  generalInfo: { label: string; value: string }[];
  title: string;
  fields: { label: string; value: string }[];
} {
  const unitPrice = sale.unitPrice || 0;

  return {
    title: 'PDF.FACTURE_VENTE_HUILE',
    reference: `VH-${sale.invoiceNumber || 'XXXX'}`,
    date: sale.saleDate
      ? new Date(sale.saleDate).toLocaleDateString()
      : new Date().toLocaleDateString(),

    companyInfo: {
      companyName: company.legalName,
      address: `${company.addressLine1 || ''}, ${company.city || ''} ${company.postalCode || ''}`.trim(),
      vatNumber: company.taxId,
      mobile: company.phone || '',
      website: company.website || company.email || ''
    },

    generalInfo: [
      {
        label: 'PDF.CUSTOMER',
        value: `${sale.supplier?.supplierInfo?.name || ''} ${sale.supplier?.supplierInfo?.lastname || ''}`.trim()
      },
      {label: 'PDF.PHONE', value: sale.supplier?.supplierInfo?.phone || ''},
      {label: 'PDF.ADDRESS', value: sale.supplier?.supplierInfo?.address || ''}
    ],

    fields: [
      {label: 'PDF.DESCRIPTION', value: sale.description || "Vente Huile d'olive"},
      {label: 'PDF.PRICE_UNIT', value: `${unitPrice} TND/kg`},
      {label: 'PDF.QUANTITY', value: `${sale.quantity} kg`},
      {label: 'PDF.TOTAL', value: `${sale.totalAmount?.toFixed(2)} TND`}
    ],

    fileName: `Facture_Vente_${sale.invoiceNumber || sale.id || 'inconnu'}.pdf`
  }

}
