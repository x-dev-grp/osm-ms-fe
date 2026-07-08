// src/app/shared/models/company-profile.ts

export interface CompanyProfile {
  id?: string;
  legalName: string; // Raison sociale
  registrationNumber: string; // RC
  taxId: string; // Matricule fiscale
  cnssNumber?: string; // CNSS ID
  legalForm: 'SARL' | 'SUARL' | 'SA' | 'SNC' | 'Autre';
  capital: number; // en TND

  email?: string;
  phone?: string;
  website?: string;

  addressLine1?: string;
  city?: string;
  postalCode?: string;
  governorate?: string;
  campaignStartAt?: string;
  campaignEndAt?: string;
  campaignStartMonth?: number;
  campaignStartDay?: number;
  campaignEndMonth?: number;
  campaignEndDay?: number;
  /** Base64‑encoded image data for logo */
  logoData?: string;
  /** MIME type of the logo (e.g. "image/png") */
  logoContentType?: string;

  enabledModules?: string[];

  // read‑only list of bank accounts
 }
