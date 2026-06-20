import { MaterielSupplier } from './materiel-supplier.model';
import { EmplacementStock } from './emplacement-stock.model';

export interface Article {
  id?: string;
  code?: string;
  nom: string;
  categorie: CategorieArticle;
  materielSupplier?: MaterielSupplier;
  materielSupplierId?: string;
  stockMinimum: number;
  stockMaximum: number;
  actif: boolean;
  um: UniteMesure;
  lastModifiedDate?: string;
  createdDate?: string;
  publicCode?: string;
  qrHex?: string;
  qrUrl?: string;
  qrImageBase64?: string;
  configuration?: ArticleConfig;
  /** Stock snapshot returned with article — same fields used by list and detail. */
  stockId?: string;
  quantiteActuelle?: number;
  quantiteReservee?: number;
  quantiteDisponible?: number;
  belowMinimum?: boolean;
  stockLastModifiedDate?: string;
  emplacement?: EmplacementStock;
}

export enum CategorieArticle {
  UNITE = 'UNITE',
  COLIS = 'COLIS',
  PALETTE = 'PALETTE',
  EMBALLAGE = 'EMBALLAGE',
  CONSOMMABLE = 'CONSOMMABLE'
}

export const categorieLabels: Record<CategorieArticle, string> = {
  [CategorieArticle.EMBALLAGE]: 'Emballage',
  [CategorieArticle.CONSOMMABLE]: 'Consommable',
  [CategorieArticle.UNITE]: 'Unité',
  [CategorieArticle.COLIS]: 'Colis',
  [CategorieArticle.PALETTE]: 'Palette'
};

export enum UniteMesure {
  KG = 'KG',
  LITRE = 'LITRE',
  UNITE = 'UNITE',
  METRE = 'METRE'
}

export interface UniteMesureOption {
  value: string;
  label: string;
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
  sousType: string;
  usage: string;
  unit: string;
  quantity: number;
  temperatureStockageCelsius: number;
}

export type ArticleConfig = UniteConfig | ColisConfig | PaletteConfig | EmballageConfig | ConsommableConfig;
