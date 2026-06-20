import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Stock } from '../models/stock.model';
import { environment } from '../../../environments/environment';
import { MouvementStock } from '../models/mouvement-stock.model';
import { ArticleStockSummary } from '../models/article-stock-summary.model';
import { ApiResponse } from '../../shared/models/api-response';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  // Fixed as part of TICKET-002: Derive base URL from environment config
  private apiUrl = `${environment.apiUrl}/api/inventaire/stocks`;

  constructor(private http: HttpClient) {}
  getStockByArticle(articleId: string): Observable<Stock> {
    return this.http.get<Stock>(`${this.apiUrl}/article/${articleId}`);
  }
  getAllMouvements(): Observable<MouvementStock[]> {
    return this.http.get<MouvementStock[]>(`${this.apiUrl}/mouvements`);
  }
  entreeStock(articleId: string, quantite: number, motif?: string): Observable<Stock> {
    return this.http.put<Stock>(`${this.apiUrl}/${articleId}/entree`, { quantite, motif });
  }
  sortieStock(articleId: string, quantite: number, motif?: string): Observable<Stock> {
    return this.http.put<Stock>(`${this.apiUrl}/${articleId}/sortie`, { quantite, motif });
  }
  getMouvementsByArticle(articleId: string): Observable<MouvementStock[]> {
    return this.http.get<MouvementStock[]>(`${this.apiUrl}/mouvements/article/${articleId}`);
  }

  getMouvementById(id: string): Observable<MouvementStock> {
    return this.http.get<MouvementStock>(`${environment.apiUrl}/api/inventaire/mouvements-stocks/${id}`);
  }
  getAllStocks(): Observable<Stock[]> {
    return this.http.get<ApiResponse<Stock>>(`${this.apiUrl}/fetchAll`).pipe(map((response) => response?.data ?? []));
  }

  getStockSummary(): Observable<ArticleStockSummary[]> {
    return this.http.get<ArticleStockSummary[]>(`${this.apiUrl}/summary`);
  }
  ajusterStock(articleId: string, quantite: number, motif?: string): Observable<Stock> {
    return this.http.put<Stock>(`${this.apiUrl}/${articleId}/ajuster`, { quantite, motif });
  }

  assignerEmplacement(stockId: string, emplacementId: string): Observable<Stock> {
    return this.http.put<Stock>(`${this.apiUrl}/${stockId}/assigner-emplacement/${emplacementId}`, {});
  }

  retirerEmplacement(stockId: string): Observable<Stock> {
    return this.http.put<Stock>(`${this.apiUrl}/${stockId}/retirer-emplacement`, {});
  }
}
