export interface CompanyProfile {
  id?: string;
  legalName: string;
  registrationNumber: string;
  taxId: string;
  cnssNumber?: string;
  legalForm: 'SARL' | 'SUARL' | 'SA' | 'SNC' | 'Autre';
  capital: number;
  creationDate?: string | null;

  email?: string;
  phone?: string;
  website?: string;

  addressLine1?: string;
  city?: string;
  postalCode?: string;
  governorate?: string;
  campaignStartAt?: string;
  campaignEndAt?: string | null;
  campaignStartMonth?: number;
  campaignStartDay?: number;
  campaignEndMonth?: number;
  campaignEndDay?: number;
  logoData?: string;
  logoContentType?: string;

  invoiceFooterNote?: string;
  invoiceLegalMentions?: string;
  preferredThemeColor?: string;
  defaultLanguage?: string;
  timezone?: string;
  pwaShortName?: string;
  invoiceBankName?: string;
  invoiceBankIban?: string;
  invoiceBankSwift?: string;

  enabledModules?: string[];
  active?: boolean;
  deleted?: boolean;
  isDeleted?: boolean;
}
