import { Article } from '../models/article.model';
import { Stock } from '../models/stock.model';

export function articleQuantiteActuelle(article: Article): number {
  return Number(article.quantiteActuelle ?? 0);
}

export function articleQuantiteReservee(article: Article): number {
  return Number(article.quantiteReservee ?? 0);
}

export function articleQuantiteDisponible(article: Article): number {
  return Number(article.quantiteDisponible ?? 0);
}

export function articleBelowMinimum(article: Article): boolean {
  if (article.belowMinimum !== undefined) {
    return article.belowMinimum;
  }

  return articleQuantiteDisponible(article) <= Number(article.stockMinimum ?? 0);
}

export function stockFromArticle(article: Article): Stock | null {
  if (!article.stockId) {
    return null;
  }

  return {
    id: article.stockId,
    article,
    articleId: article.id,
    quantiteActuelle: articleQuantiteActuelle(article),
    quantiteReservee: articleQuantiteReservee(article),
    quantiteDisponible: articleQuantiteDisponible(article),
    emplacement: article.emplacement,
    lastModifiedDate: article.stockLastModifiedDate || article.lastModifiedDate || '',
    actif: article.actif
  };
}

export function mergeStockIntoArticle(article: Article, stock: Stock): Article {
  return {
    ...article,
    stockId: stock.id ?? article.stockId,
    quantiteActuelle: stock.quantiteActuelle,
    quantiteReservee: stock.quantiteReservee,
    quantiteDisponible: stock.quantiteDisponible,
    stockLastModifiedDate: stock.lastModifiedDate,
    emplacement: stock.emplacement,
    belowMinimum: Number(stock.quantiteDisponible ?? 0) <= Number(article.stockMinimum ?? 0)
  };
}
