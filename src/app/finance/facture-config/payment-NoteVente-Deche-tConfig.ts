import {WasteSale} from '../../finance/models/Waste.model';
import {CompanyProfile} from '../../shared/models/CompanyProfile';
import {PdfPaymentNoteConfig} from '../../shared/models/pdf-config.model';

export function paymentNoteVenteDechetConfig(
  sale: WasteSale,
  company: CompanyProfile
): PdfPaymentNoteConfig {
  const supplierName = sale.supplier?.supplierInfo?.name + ' ' + sale.supplier?.supplierInfo?.lastname || '';
  const supplierAddress = sale.supplier?.supplierInfo?.address || '';
  const supplierPhone = sale.supplier?.supplierInfo?.phone || '';

  const totalNum = Number(sale?.totalPrice ?? 0);
  const paidNum = Number(sale?.paidAmount ?? 0);
  const unpaidNum = Number(sale?.unpaidAmount ?? (totalNum - paidNum) ?? 0);

  const fmt = (n: number) => `${n?.toFixed(2)} TND`;

  const paymentType = unpaidNum > 0 ? 'Partiel' : 'Complet';
  const paymentDate = sale?.paymentDate
    ? new Date(sale.paymentDate).toLocaleDateString()
    : sale?.saleDate
      ? new Date(sale.saleDate).toLocaleDateString()
      : new Date().toLocaleDateString();

  return {
    title: 'NOTE DE PAIEMENT VENTE DÉCHETS',
    reference: `NP-VENTE-DECHET-${sale.invoiceNumber || sale.id || ''}`,
    date: new Date().toLocaleDateString(),

    companyInfo: {
      companyName: company?.legalName || '',
      address: company?.addressLine1 || '',
      vatNumber: company?.registrationNumber || company?.cnssNumber || '',
      mobile: company?.phone || '',
      website: company?.website || ''
    },

    generalInfo: [
      {label: 'PDF.CLIENT_NAME', value: supplierName},
      {label: 'PDF.CLIENT_ADDRESS', value: supplierAddress},
      {label: 'PDF.CLIENT_PHONE', value: supplierPhone}
    ],

    paymentDetails: [
      {
        paymentType,
        totalAmount: fmt(totalNum),
        paidAmount: fmt(paidNum),
        paymentDate,
        remainingAmount: fmt(unpaidNum)
      }
    ],

    total: fmt(totalNum),
    paid: fmt(paidNum),
    unpaid: fmt(unpaidNum),
  };
}
