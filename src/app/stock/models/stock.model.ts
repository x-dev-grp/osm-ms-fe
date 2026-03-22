import { Article } from "./article.model";
import { EmplacementStock } from "./emplacement-stock.model";

export interface Stock {
  id?: string;
  article: Article;
  articleId?: string;
  quantiteActuelle: number;
  emplacement?: EmplacementStock;
  emplacementId?: string;
  lastModifiedDate: string;
  actif:boolean
}
