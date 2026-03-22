export interface Fournisseur {
  id?: string;
  code: string;
  nom: string;
  nomCommercial?: string;
  email?: string;
  telephone?: string;
  fax?: string;
  siteWeb?: string;
  numeroTva?: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  pays?: string;
  contactNom?: string;
  contactPrenom?: string;
  contactEmail?: string;
  contactTelephone?: string;
  currency?: Currency;
  categorieFournisseur?: CategorieFournisseur;
  delaiLivraisonMoyen?: number;
  conditionsPaiement?: string;
  actif: boolean;
  certifications?: string;
  dateDerniereCommande?: Date;
}

export enum Currency {
  EUR = 'EUR',
  USD = 'USD',
  GBP = 'GBP',
  CHF = 'CHF'
}

export enum CategorieFournisseur {
  MATIERES_PREMIERES = 'MATIERES_PREMIERES',
  EMBALLAGES = 'EMBALLAGES',
  PRODUITS_FINIS = 'PRODUITS_FINIS',
  ETIQUETTES = 'ETIQUETTES',
  BOUCHONS = 'BOUCHONS',
  CAPSULES = 'CAPSULES',
  OPERCULES = 'OPERCULES',
  FILMS = 'FILMS',
  CARTONS = 'CARTONS',
  PALETTES = 'PALETTES',
  SERVICES = 'SERVICES',
  TRANSPORT = 'TRANSPORT',
  AUTRE = 'AUTRE'
}
