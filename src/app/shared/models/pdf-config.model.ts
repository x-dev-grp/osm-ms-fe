export interface PdfField {
  label: string;
  value: string;
}

export interface PdfFooterInfo {
  label: string;
  placeholder?: string;
}

export interface PdfConfig {
  title: string;
  reference: string;
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
  fields?: { label: string; value: string }[];

  // Informations supplémentaires (poids, colis, livraison, etc.)
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


// stricture de note de payemnt

export interface PdfPaymentNoteConfig {
  title: string;
  reference: string;
  date: string;

  customerInfo: {
    name: string;
    phone?: string;
    address?: string;
  };

  paymentInfo: {
    totalAmount: string;
    paidAmount: string;
    unpaidAmount: string;
    paymentDate: string;
  };

  footerInfo?: { label: string; value?: string }[];
  fileName: string;
}

