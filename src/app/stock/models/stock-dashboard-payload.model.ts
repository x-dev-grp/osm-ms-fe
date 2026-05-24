import { StatistiquesStock } from './statistiques.model';

export interface ArticleCritique {
  id?: string;
  sku?: string;
  nom?: string;
  stockActuel?: number;
  stockMinimum?: number;
  stockDisponible?: number;
  categorie?: string;
}

export interface MouvementRecent {
  id?: string;
  typeMouvement?: string;
  quantite?: number;
  dateMouvement?: string;
  motif?: string;
  articleId?: string;
  articleSku?: string;
  articleNom?: string;
  uniteMesure?: string;
}

export interface StockDashboardPayload {
  statistiques: StatistiquesStock;
  articlesCritiques: ArticleCritique[];
  mouvementsRecents: MouvementRecent[];
}
