export interface PdfField {
  label: string;
  labelTranslatePath?: string;
  value: string;
}

export interface PdfFooterInfo {
  label: string;
  labelTranslatePath?: string;
  placeholder?: string;
}

export interface PdfConfig {
  title: string;
  titleTranslatePath?: string;
  reference: string;
  Number?: string;
  revision?: string;
  layout?: string;
  date?: string;
  fields: PdfField[];
  generalInfo?: PdfField[];
  footerInfo?: PdfFooterInfo[];
  fileName?: string;
}

export interface PdfFactureConfig {
  title: string;
  reference: string;
  date?: string;

  // Informations générales (affichées après le tableau)
  generalInfo?: { label: string; value: string }[];

  // Tableau des lignes (produits)
  fields?: { name?:string;label: string; value: string }[];
  // Informations supplémentaires (poids, colis, réception, etc.)
  additionalInfo?: {

    grossWeight?: string;
    netWeight?: string;
    packages?: string;
    incoterm?: string;
    deliveryAddress?: string;
  };

  // Coordonnées bancaires
  bankInfo?: {
    bankName?: string;
    iban?: string;
    swiftCode?: string;
  };

  // Modalités de paiement
  paymentTerms?: string[];

  // Footer : contact fournisseur
  footerContact?: {
    name?: string;
    phone?: string;
  };

  // Informations de l'entreprise (logo + adresse, etc.)
  companyInfo?: {
    logoUrl?: string;
    companyName?: string;
    address?: string;
    vatNumber?: string;
    mobile?: string;
    website?: string;
  };

  fileName?: string;
}

// <html>TS2345: Argument of type 'PdfFactureConfig | PdfPaymentNoteConfig' is not assignable to parameter of type 'PdfPaymentNoteConfig'.<br/>Type 'PdfFactureConfig' is missing the following properties from type 'PdfPaymentNoteConfig': paymentDetails, total, paid, unpaid
export interface PdfPaymentNoteConfig {
  title: string;
  reference: string;
  date: string;

  companyInfo: {
    companyName: string;
    address?: string;
    vatNumber?: string;
    mobile?: string;
    website?: string;
    logoUrl?:any;
  };

  generalInfo: {
    label: string;
    value: string;
  }[];

  // Nouveau : Tableau des paiements
  paymentDetails: Array<{
    paymentType: string;
    totalAmount: string;
    paidAmount: string;
    paymentDate: string;
    remainingAmount: string;
  }>;

  // Optionnel : Récapitulatif global (si tu veux le garder en bas)
  total: string;
  paid: string;
  unpaid: string;
}






export interface PdfExpeditionConfig {
  title: string;
  reference: string;
  date?: string;
  clientInfo?: {
    name?: string;
    address?: string;
    phone?: string;
  };
  logistics?: {
    carrier?: string;
    driver?: string;
    truck?: string;
    tracking?: string;
    incoterm?: string;
    destination?: string;
  };
  lines: Array<{
    ofCode: string;
    articleName: string;
    quantity: number;
    unit: string;
    lotNumber: string;
  }>;
  traceability?: any; // The snapshot object
  companyInfo?: {
    logoUrl?: string;
    companyName?: string;
    address?: string;
    vatNumber?: string;
    mobile?: string;
    website?: string;
  };
}
