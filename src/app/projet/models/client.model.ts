export interface Client {
  id?: string;
  nom?: string;
  codeClient?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  codePostal?: string;
  privateLabel?: boolean;
  siret?: string;
  numeroTva?: string;
  notes?: string;
   actif: boolean;
  createdDate?: string;
}
