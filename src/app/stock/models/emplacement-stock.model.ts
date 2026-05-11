import {CategorieArticle} from "./article.model";

export interface EmplacementStock {
  id?: string;
  code: string;
  nom?: string;
  typeEmplacement: TypeEmplacement;
  capaciteMaximale?: string;
  capaciteActuelle?: string;
  zone?: string;
  disponible: boolean;
  reservePour?: string;
  conditionsSpeciales?: string;
  temperatureMin?: number;
  temperatureMax?: number;
  description?: string;
  notes?: string;
  actif: boolean;
  createdDate?: string;
  categorieArticleStocke?: CategorieArticle;
}

export enum TypeEmplacement {
  CHAMBRE_FROIDE = 'CHAMBRE_FROIDE',
  CONGELATEUR = 'CONGELATEUR',
  ZONE_DANGEREUSE = 'ZONE_DANGEREUSE',
  ZONE_SECURISEE = 'ZONE_SECURISEE',
  QUAI_RECEPTION = 'QUAI_RECEPTION',
  QUAI_EXPEDITION = 'QUAI_EXPEDITION',
  ZONE_CONTROLE = 'ZONE_CONTROLE',
  ZONE_RECONDITIONNEMENT = 'ZONE_RECONDITIONNEMENT'
}
