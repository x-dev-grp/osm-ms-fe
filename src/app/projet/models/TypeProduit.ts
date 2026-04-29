export enum TypeProduit {
  EXTRA_VIERGE = 'EXTRA_VIERGE',
  VIERGE = 'VIERGE',
  RAFFINE = 'RAFFINE',
  BLEND = 'BLEND'
}

export enum TypeEmballage {
  BOUTEILLE = 'BOUTEILLE',
  CANETTE = 'CANETTE',
  PET = 'PET',
  VRAC = 'VRAC'
}

export type Unite = 'LITRES' | 'UNITES';

export interface ProjetDto {
  id: string;

  // code metier manuel genere par le back
  code?: string;

  clientId: string;
  clientNom?: string;
  clientEmail?: string;

  typeProduit: TypeProduit;
  typeEmballage: TypeEmballage;

  quantiteCible: number;
  unite: Unite;

  dateLimiteLivraison: string;
  prixUnitaire: number;
  valeurTotale?: number;

  conditionsLivraison: string;

  statut?: string;
  createdDate?: string;

  // QR
  publicCode?: string;
  qrUrl?: string;
  qrImageBase64?: string;
}
