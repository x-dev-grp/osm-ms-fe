import {Fournisseur} from "./fournisseur.model";

export interface Article {
  id?: string;
  code?: string;
  nom: string;
  categorie: CategorieArticle;
  fournisseur?: Fournisseur;
  fournisseurId?: string;
  stockMinimum: number;
  stockMaximum: number;
  actif: boolean;
  um: UniteMesure;
  lastModifiedDate?: string;
   createdDate?: string;
  publicCode?: string;
  qrUrl?: string;
  qrImageBase64?: string;
  configuration?: ArticleConfig;
}

export enum CategorieArticle {
  UNITE = 'UNITE',
  COLIS = 'COLIS',
  PALETTE = 'PALETTE',
  EMBALLAGE = 'EMBALLAGE',
  CONSOMMABLE = 'CONSOMMABLE',
  MATIERE_PREMIERE = 'MATIERE_PREMIERE',
  ACCESSOIRE = 'ACCESSOIRE',

}

export const categorieLabels: Record<CategorieArticle, string> = {
  [CategorieArticle.EMBALLAGE]: 'Emballage',
  [CategorieArticle.CONSOMMABLE]: 'Consommable',
  [CategorieArticle.MATIERE_PREMIERE]: 'Matière première',
  [CategorieArticle.ACCESSOIRE]: 'Accessoire',
  [CategorieArticle.UNITE]: 'Unité',
  [CategorieArticle.COLIS]: 'Colis',
  [CategorieArticle.PALETTE]: 'Palette'
};

export enum UniteMesure {
  KG = 'KG',
  LITRE = 'LITRE',
  UNITE = 'UNITE',
  METRE = 'METRE',
  TONNE = 'TONNE'
}
export interface Dimensions {
  length: number;
  width: number;
  height: number;
}
export interface UniteConfig {
  configType: 'UNITE';
  material: string;
  volumeMl: number;
  color: string;
  neckType: string;
  weightGr: number;
}

export interface ColisConfig {
  configType: 'COLIS';
  unitArticleId: string;
  unitsPerColis: number;
  dimensions: Dimensions;
  maxWeightKg: number;
}

export interface PaletteConfig {
  configType: 'PALETTE';
  type: string;
  material: string;
  colisPerLayer: number;
  numberOfLayers: number;
  maxHeightCm: number;
  clientSpecific: boolean;
  colisId: string;
}

export interface EmballageConfig {
  configType: 'EMBALLAGE';
  sousType: string;
  material: string;
  dimensions?: Dimensions;
  clientBranding: boolean;
  poidsGrammes?: number;
}

export interface ConsommableConfig {
  configType: 'CONSOMMABLE';
  type: string;
  volumeLitre: number;
  composition: string;
  temperatureStockageCelsius: number;
}

export interface MatierePremiereConfig {
  configType: 'MATIERE_PREMIERE';
  codeFournisseur: string;
  densite: number;
  origine: string;
  certifieBio: boolean;
}

export interface AccessoireConfig {
  configType: 'ACCESSOIRE';
  usage: string;
  necessiteMontage: boolean;
  garantieMois: string;
}

export type ArticleConfig =
  | UniteConfig
  | ColisConfig
  | PaletteConfig
  | EmballageConfig
  | ConsommableConfig
  | MatierePremiereConfig
  | AccessoireConfig;
