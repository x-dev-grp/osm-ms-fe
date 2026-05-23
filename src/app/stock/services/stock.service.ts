import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Stock } from '../models/stock.model';
import {environment} from "../../../environments/environment";
import {MouvementStock} from "../models/mouvement-stock.model";


@Injectable({
  providedIn: 'root'
})
export class StockService {
  // Fixed as part of TICKET-002: Derive base URL from environment config
  private apiUrl = `${environment.apiUrl}/api/inventaire/stocks`;

  constructor(private http: HttpClient) {
  }
  getStockByArticle(articleId: string): Observable<Stock> {
    return this.http.get<Stock>(`${this.apiUrl}/article/${articleId}`);
  }
  getAllMouvements(): Observable<MouvementStock[]> {
    return this.http.get<MouvementStock[]>(`${this.apiUrl}/mouvements`);
  }
  entreeStock(articleId: string, quantite: number, motif?: string): Observable<Stock> {
    return this.http.put<Stock>(`${this.apiUrl}/${articleId}/entree`, {quantite, motif});
  }
  sortieStock(articleId: string, quantite: number, motif?: string): Observable<Stock> {
    return this.http.put<Stock>(`${this.apiUrl}/${articleId}/sortie`, {quantite, motif});
  }
  getMouvementsByArticle(articleId: string): Observable<MouvementStock[]> {
    return this.http.get<MouvementStock[]>(`${this.apiUrl}/mouvements/article/${articleId}`);
  }
  getAllStocks(): Observable<Stock[]> {
    return this.http.get<Stock[]>(this.apiUrl);
  }
  ajusterStock(articleId: string, quantite: number, motif?: string): Observable<Stock> {
    return this.http.put<Stock>(`${this.apiUrl}/${articleId}/ajuster`, {quantite, motif});
  }

  assignerEmplacement(stockId: string, emplacementId: string): Observable<Stock> {
    return this.http.put<Stock>(`${this.apiUrl}/${stockId}/assigner-emplacement/${emplacementId}`, {});
  }

  retirerEmplacement(stockId: string): Observable<Stock> {
    return this.http.put<Stock>(`${this.apiUrl}/${stockId}/retirer-emplacement`, {});
  }




}
