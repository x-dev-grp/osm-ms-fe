import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StatistiquesStock } from '../models/statistiques.model';

@Injectable({
  providedIn: 'root'
})
export class StatistiqueService {
  private apiUrl = 'http://localhost:8080/api/inventaire/statistiques';

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<StatistiquesStock> {
    return this.http.get<StatistiquesStock>(`${this.apiUrl}/dashboard`);
  }

  getArticlesCritiques(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/articles/critiques`);
  }

  getMouvementsRecents(limit: number = 10): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/mouvements/recents?limit=${limit}`);
  }

  getTauxRupture(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stock/taux-rupture`);
  }

  getValeurStock(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stock/valeur`);
  }

  getDelaiValidation(): Observable<any> {
    return this.http.get(`${this.apiUrl}/achats/delai-validation`);
  }
}
