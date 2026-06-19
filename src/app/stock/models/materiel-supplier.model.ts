export interface MaterielSupplier {
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
  category?: MaterielSupplierCategory;
  delaiLivraisonMoyen?: number;
  conditionsPaiement?: string;
  actif: boolean;
  certifications?: string;
  dateDerniereCommande?: Date;
  createdDate?: string;
  publicCode?: string;
  qrHex?: string;
  qrUrl?: string;
  qrImageBase64?: string;
}

export enum Currency {
  TND = 'TND',
  EUR = 'EUR',
  USD = 'USD',
  GBP = 'GBP',
  CHF = 'CHF'
}

export const MATERIEL_SUPPLIER_CURRENCIES: Currency[] = [
  Currency.TND,
  Currency.EUR,
  Currency.USD
];

export enum MaterielSupplierCategory {
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

export const materielSupplierCategoryLabels: Record<MaterielSupplierCategory, string> = {
  [MaterielSupplierCategory.MATIERES_PREMIERES]: 'MATERIEL_SUPPLIER.CATEGORIES.MATIERES_PREMIERES',
  [MaterielSupplierCategory.EMBALLAGES]: 'MATERIEL_SUPPLIER.CATEGORIES.EMBALLAGES',
  [MaterielSupplierCategory.PRODUITS_FINIS]: 'MATERIEL_SUPPLIER.CATEGORIES.PRODUITS_FINIS',
  [MaterielSupplierCategory.ETIQUETTES]: 'MATERIEL_SUPPLIER.CATEGORIES.ETIQUETTES',
  [MaterielSupplierCategory.BOUCHONS]: 'MATERIEL_SUPPLIER.CATEGORIES.BOUCHONS',
  [MaterielSupplierCategory.CAPSULES]: 'MATERIEL_SUPPLIER.CATEGORIES.CAPSULES',
  [MaterielSupplierCategory.OPERCULES]: 'MATERIEL_SUPPLIER.CATEGORIES.OPERCULES',
  [MaterielSupplierCategory.FILMS]: 'MATERIEL_SUPPLIER.CATEGORIES.FILMS',
  [MaterielSupplierCategory.CARTONS]: 'MATERIEL_SUPPLIER.CATEGORIES.CARTONS',
  [MaterielSupplierCategory.PALETTES]: 'MATERIEL_SUPPLIER.CATEGORIES.PALETTES',
  [MaterielSupplierCategory.SERVICES]: 'MATERIEL_SUPPLIER.CATEGORIES.SERVICES',
  [MaterielSupplierCategory.TRANSPORT]: 'MATERIEL_SUPPLIER.CATEGORIES.TRANSPORT',
  [MaterielSupplierCategory.AUTRE]: 'MATERIEL_SUPPLIER.CATEGORIES.AUTRE'
};

export function materielSupplierDisplayName(supplier: MaterielSupplier | null | undefined): string {
  if (!supplier) {
    return '';
  }
  if (supplier.nomCommercial?.trim()) {
    return supplier.nomCommercial.trim();
  }
  return supplier.nom?.trim() ?? '';
}
