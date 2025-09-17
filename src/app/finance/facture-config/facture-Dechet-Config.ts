import {PdfFactureConfig} from '../../shared/models/pdf-config.model';
import {WasteSale} from '../../finance/models/Waste.model';
import {CompanyProfile} from '../../shared/models/CompanyProfile';

export function factureVenteDechetConfig(
  sale: WasteSale,
  company: CompanyProfile
): PdfFactureConfig {
  const unitPrice = sale.unitPrice || 0;
  const quantity = sale.quantityInKg || 0;
  const total = sale.totalPrice || unitPrice * quantity;

  return {
    title: 'PDF.FACTURE_VENTE_DECHET',
    operation_Type: sale.type,
    reference: `VENTE-DECHET-${sale.invoiceNumber || sale.id || 'XXXX'}`,
    date: sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : new Date().toLocaleDateString(),

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
        value: `${sale.supplier?.supplierInfo?.name || ''} ${sale.supplier?.supplierInfo?.lastname || ''}`.trim()
      },
      {label: 'PDF.PHONE', value: sale.supplier?.supplierInfo?.phone || ''},
      {label: 'PDF.ADDRESS', value: sale.supplier?.supplierInfo?.address || ''}
    ],

    fields: [
      {label: 'PDF.DESCRIPTION', value: sale.description || `Vente de déchets (${sale.type})`},
      {label: 'PDF.PRICE_UNIT', value: `${unitPrice.toFixed(3)} TND/kg`},
      {label: 'PDF.QUANTITY', value: `${quantity} kg`},
      {label: 'PDF.TOTAL', value: `${total.toFixed(3)} TND`}
    ],

    fileName: `Facture_Vente_Dechet_${sale.invoiceNumber || sale.id || 'inconnu'}.pdf`
  };
}
