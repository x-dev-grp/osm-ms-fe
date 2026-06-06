export interface ArticleStockSummary {
  articleId: string;
  quantiteActuelle: number;
  quantiteReservee: number;
  quantiteDisponible: number;
  belowMinimum?: boolean;
}
