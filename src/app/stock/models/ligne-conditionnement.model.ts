export interface LigneConditionnement {
  id?: string;
  code: string;
  nom: string;
  description?: string;
  etat: Statue;
  vitesseNominale?: number;
  tempsPreparation?: number;
  tempsNettoyage?: number;
  responsable?: string;
  dateDerniereMaintenance?: String;
  dateProchaineMaintenance?: String;
  notes?: string;
  lastModifiedDate: string;
  createdDate: string;
  actif?: boolean;
  publicCode?: string;
  qrHex?: string;
  qrUrl?: string;
  qrImageBase64?: string;

}

export enum Statue {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
  EN_MAINTENANCE = 'EN_MAINTENANCE',
  EN_PANNE = 'EN_PANNE'
}
