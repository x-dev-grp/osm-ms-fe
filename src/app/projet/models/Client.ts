export interface Client {
  id?: string;
  nom: string;
  email: string;
  telephone: string;
  type: 'BUYER' | 'BRAND_OWNER';
  adresse: string;

}
