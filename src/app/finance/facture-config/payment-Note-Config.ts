import {UnifiedDelivery} from "../../shared/models/UnifiedDelivery";
import {CompanyProfile} from "../../shared/models/CompanyProfile";
import {PdfPaymentNoteConfig} from '../../shared/models/pdf-config.model';

// paymentNoteConfig.ts
export function paymentNoteConfig(delivery: UnifiedDelivery, company: CompanyProfile): PdfPaymentNoteConfig {
  const supplier = delivery?.supplier || {};
  const supplierName = delivery.supplier?.supplierInfo.name + ' ' + delivery.supplier?.supplierInfo.lastname || '';
  const supplierAddress = delivery.supplier?.supplierInfo?.address || '';
  const supplierPhone = delivery.supplier?.supplierInfo.phone || '';

  const totalNum = Number(delivery?.price ?? 0);
  const paidNum = Number(delivery?.paidAmount ?? 0);
  const unpaidNum = Number(delivery?.unpaidAmount ?? (totalNum - paidNum) ?? 0);

  const fmt = (n: number) => `${n?.toFixed(2)} TND`;

  // Déterminer le type de paiement
  const paymentType = 'Partiel';
  const paymentDate = delivery?.deliveryDate
    ? new Date(delivery.deliveryDate).toLocaleDateString()
    : delivery?.trtDate
      ? new Date(delivery.trtDate).toLocaleDateString()
      : new Date().toLocaleDateString();

  return {
    title: 'NOTE DE PAIEMENT',
    reference: `NP-${delivery?.lotNumber ?? delivery?.deliveryNumber ?? delivery?.id ?? ''}`,
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
        paymentType: paymentType,
        totalAmount: fmt(totalNum),
        paidAmount: fmt(paidNum),
        paymentDate: paymentDate,
        remainingAmount: fmt(unpaidNum)
      }
    ],

    // Optionnel : garder les totaux globaux en bas si besoin
    total: fmt(totalNum),
    paid: fmt(paidNum),
    unpaid: fmt(unpaidNum),
  };


}
