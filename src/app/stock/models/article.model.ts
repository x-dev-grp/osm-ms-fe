import {Fournisseur} from "./fournisseur.model";

export interface Article {
  id?: string;
  nom: string;
  categorie: CategorieArticle;
  fournisseur?: Fournisseur;
  fournisseurId?: string;
  stockMinimum: number;
  stockMaximum: number;
  actif: boolean;
  um: UniteMesure;
  lastModifiedDate?: string;
}

export enum CategorieArticle {
  EMBALLAGE = 'EMBALLAGE',
  CONSOMMABLE = 'CONSOMMABLE',
  MATIERE_PREMIERE = 'MATIERE_PREMIERE',
  ACCESSOIRE = 'ACCESSOIRE',
  UNITE = 'UNITE',
  COLIS = 'COLIS',
  PALETTE = 'PALETTE'
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
