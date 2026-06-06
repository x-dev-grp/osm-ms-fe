import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { StatistiquesStock } from '../models/statistiques.model';
import {
  StockDashboardPayload,
  ArticleCritique,
  MouvementRecent
} from '../models/stock-dashboard-payload.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StatistiqueService {
  private apiUrl = `${environment.apiUrl}/api/inventaire/statistiques`;

  constructor(private http: HttpClient) {}

  /** Preferred: single round-trip for the stock dashboard. */
  getDashboardPayload(limit = 10): Observable<StockDashboardPayload> {
    return this.http
      .get<StockDashboardPayload>(`${this.apiUrl}/dashboard/payload`, {
        params: { limit: String(limit) }
      })
      .pipe(map((body) => this.normalizePayload(body)));
  }

  getDashboard(): Observable<StatistiquesStock> {
    return this.http
      .get<StatistiquesStock | { data: StatistiquesStock }>(`${this.apiUrl}/dashboard`)
      .pipe(map((body) => this.unwrap(body)));
  }

  getArticlesCritiques(): Observable<ArticleCritique[]> {
    return this.http
      .get<ArticleCritique[] | { data: ArticleCritique[] }>(`${this.apiUrl}/articles/critiques`)
      .pipe(map((body) => this.unwrapList(body)));
  }

  getMouvementsRecents(limit: number = 10): Observable<MouvementRecent[]> {
    return this.http
      .get<MouvementRecent[] | { data: MouvementRecent[] }>(
        `${this.apiUrl}/mouvements/recents?limit=${limit}`
      )
      .pipe(map((body) => this.unwrapList(body)));
  }

  private normalizePayload(body: StockDashboardPayload | { data: StockDashboardPayload }): StockDashboardPayload {
    const payload = this.unwrap(body) as StockDashboardPayload;
    return {
      statistiques: payload?.statistiques ?? ({} as StatistiquesStock),
      articlesCritiques: payload?.articlesCritiques ?? [],
      mouvementsRecents: payload?.mouvementsRecents ?? []
    };
  }

  private unwrap<T>(body: T | { data: T }): T {
    if (body && typeof body === 'object' && 'data' in body && (body as { data: T }).data != null) {
      return (body as { data: T }).data;
    }
    return body as T;
  }

  private unwrapList(body: unknown[] | { data: unknown[] }): any[] {
    if (Array.isArray(body)) {
      return body;
    }
    const unwrapped = this.unwrap(body as { data: unknown[] });
    return Array.isArray(unwrapped) ? unwrapped : [];
  }
}
