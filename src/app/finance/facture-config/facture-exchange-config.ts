import {PdfFactureConfig} from '../../shared/models/pdf-config.model';
import {UnifiedDelivery} from '../../shared/models/UnifiedDelivery';

export function getInvoicePdfConfig(delivery: UnifiedDelivery): PdfFactureConfig {
  const oilQuantity = delivery.oilQuantity || 0;
  const unitPrice = delivery.unitPrice ?? 8.5;
  const total = oilQuantity * unitPrice;

  return {
    title: 'Facture commerciale',
    reference: `INV-${delivery.lotNumber || 'XXXX'}`,
    date: new Date().toLocaleDateString(),

    // Infos entreprise (à afficher en haut à gauche)
    companyInfo: {
      companyName: 'Majel Belabbes 1214 KASSERINE',
      address: 'Tunisie',
      vatNumber: 'VAT 1778521 Y N M 000',
      mobile: '+216 29 910 458',
      website: 'contact@abiooc.com'
    },

    // Titre et numéro de facture (à droite)
    // Ces infos sont déjà dans `title` et `reference`, mais peuvent être enrichies si besoin

    // Informations générales (client, numéro de livraison, etc.)
    generalInfo: [
      {
        label: 'PDF.CUSTOMER',
        value: `${delivery.supplier.supplierInfo.name} ${delivery.supplier.supplierInfo.lastname}`
      },
      {label: 'PDF.INVOICE_NUMBER', value: delivery.deliveryNumber || 'N/A'},
      {label: 'PDF.INVOICE_DATE', value: new Date().toLocaleDateString()},
      {
        label: 'PDF.SUPPLIER',
        value: `${delivery.supplier?.supplierInfo?.name || ''} ${delivery.supplier?.supplierInfo?.lastname || ''}`
      },
      {label: 'PDF.PHONE', value: delivery.supplier?.supplierInfo?.phone || ''},
      {label: 'PDF.ADDRESS', value: delivery.supplier?.supplierInfo?.address || ''}
    ],

    // Tableau des produits
    fields: [
      {label: 'PDF.PRODUCT', value: `${delivery.deliveryType} ${delivery.categoryOliveOil}`},
      {label: 'PDF.LOT', value: delivery.lotNumber || 'N/A'},
      {label: 'PDF.QUANTITY', value: `${oilQuantity} kg`},
      {label: 'PDF.UNIT_PRICE', value: `${unitPrice} TND/kg`},
      {label: 'PDF.HUILE_TYPE', value: delivery.oilType || 'N/A'},
      {label: 'PDF.SUBTOTAL', value: `${total.toFixed(3)} TND`},
      {label: 'PDF.TOTAL', value: `${total.toFixed(3)} TND`}
    ],

    // Informations complémentaires
    additionalInfo: {
      grossWeight: `Poids Brut total : ${oilQuantity * 1.2} kg`,
      netWeight: `Poids Net total : ${oilQuantity} kg`,
      packages: 'Nombre de colis : 3 palettes (2 palettes x 75 cartons 1000 ml) + (1 palette x 144 cartons 500 ml)',
      incoterm: 'Incoterm DAP Suisse Depot',
      deliveryAddress: 'Adresse de livraison : Wasserstrasse 4 2555 Brugg-Suisse'
    },

    // Coordonnées bancaires
    bankInfo: {
      bankName: 'ZITOUNA BANQUE AGENCE FRIANA',
      iban: 'TN59 25 155 000 0001387494 94',
      swiftCode: 'BZTTNTTXXX'
    },

    // Modalités de paiement
    paymentTerms: [
      '50 % paiement anticipé',
      '50 % à la livraison'
    ],

    // Footer contact fournisseur
    footerContact: {
      name: 'ABIOOC',
      phone: '+216 29 910 458'
    },

    fileName: `Facture_${delivery.deliveryNumber || 'inconnu'}.pdf`
  };
}
