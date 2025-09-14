import {UnifiedDelivery} from "../../shared/models/UnifiedDelivery";
import {CompanyProfile} from "../../shared/models/CompanyProfile";
import {PdfPaymentNoteConfig} from '../../shared/models/pdf-config.model';

export function paymentNoteConfig(
  delivery: UnifiedDelivery,
  company: CompanyProfile
): PdfPaymentNoteConfig {
  return {
    title: 'NOTE DE PAIEMENT',
    reference: `NP_${delivery.lotNumber || 'XXXX'}`,
    date: new Date().toLocaleDateString(),

    customerInfo: {
      name: `${delivery.supplier?.supplierInfo?.name || ''} ${delivery.supplier?.supplierInfo?.lastname || ''}`.trim(),
      phone: delivery.supplier?.supplierInfo?.phone || '',
      address: delivery.supplier?.supplierInfo?.address || ''
    },

    paymentInfo: {
      totalAmount: `${delivery.price || 0} TND`,
      paidAmount: `${delivery.paidAmount || 0} TND`,
      unpaidAmount: `${delivery.unpaidAmount || 0} TND`,
      paymentDate: new Date().toLocaleDateString() // ou delivery.paymentDate si dispo
    },

    footerInfo: [
      {label: 'Signature Client'},
      {label: 'Signature Responsable'}
    ],

    fileName: `NotePaiement_${delivery.deliveryNumber || 'inconnu'}.pdf`
  };
}
