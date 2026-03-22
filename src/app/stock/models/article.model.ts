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
  ACCESSOIRE = 'ACCESSOIRE'
}

export enum UniteMesure {
  KG = 'KG',
  LITRE = 'LITRE',
  UNITE = 'UNITE',
  METRE = 'METRE',
  TONNE = 'TONNE'
}
