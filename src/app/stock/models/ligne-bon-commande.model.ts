import { Article } from "./article.model";
import { BonCommande } from "./bon-commande.model";

export interface LigneBonCommande {
  id?: string;
  bonCommande?: BonCommande;
  bonCommandeId?: string;
  article: Article;
  articleId?: string;
  quantiteCommandee: number;
  quantiteRecue: number;
  prixUnitaire?: number;
  remarque?: string;
}
