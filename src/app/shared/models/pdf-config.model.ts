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

export interface PdfInvoiceLineItem {
  description: string;
  /** Unit price excluding VAT (prix unitaire HT). */
  unitPrice: number;
  quantity: number;
  /** Line total excluding VAT (montant HT). Computed when omitted. */
  total?: number;
  /** VAT rate in percent (Tunisia: 19%, 13%, 7% or 0%). Defaults to 19% for TND invoices. */
  vatRatePercent?: number;
  /** Billing unit for unified deliveries: kg (olive) or L (oil). */
  unit?: string;
}

export interface PdfFactureClientInfo {
  name?: string;
  addressLines?: string[];
  /** Client matricule fiscal (when subject to fiscal registration). */
  taxId?: string;
}

export interface PdfFactureConfig {
  title: string;
  reference: string;
  date?: string;
  currency?: string;
  conditions?: string;
  /** Default VAT % when line items omit vatRatePercent (Tunisia standard: 19). */
  defaultVatRatePercent?: number;
  /** Optional suspended VAT amount (taxe suspendue) per Art. 18 Code TVA. */
  suspendedVatAmount?: number;

  clientInfo?: PdfFactureClientInfo;
  lineItems?: PdfInvoiceLineItem[];

  // Legacy flat lines (converted to lineItems when lineItems is absent)
  generalInfo?: { label: string; value: string }[];
  fields?: { name?: string; label: string; value: string }[];
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
    companyName?: string;
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
