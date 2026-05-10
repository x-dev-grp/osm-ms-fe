
export interface Certification {
  id?: string;
  tenantId?: string;
  isDeleted?: boolean;
  externalId?: string;
  createdDate?: string;
  createdBy?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
  qrHex?: string;

  name: string;
  code?: string;
  description?: string;
  issuingBody?: string;
  logoData?: string;
  logoContentType?: string;
  websiteUrl?: string;
  category?: string;
  isActive: boolean;
}
