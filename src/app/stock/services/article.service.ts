import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Article, CategorieArticle, UniteMesureOption } from '../models/article.model';
import { environment } from '../../../environments/environment';
import { QrCodeInfo, QrResolveResponse } from '../../shared/models/qr-models';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {
  private apiUrl = `${environment.apiUrl}/api/inventaire/articles`;

  constructor(private http: HttpClient) {}

  getAllArticles(): Observable<Article[]> {
    return this.http.get<ApiResponse<Article>>(`${this.apiUrl}/fetchAll`).pipe(
      map((response) => response?.data ?? [])
    );
  }

  getArticlesByCategorie(categorie: CategorieArticle | string): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.apiUrl}/categorie/${categorie}`);
  }

  getUnitesMesure(): Observable<UniteMesureOption[]> {
    return this.http.get<UniteMesureOption[]>(`${this.apiUrl}/unites-mesure`);
  }

  getArticleById(id: string): Observable<Article> {
    return this.http.get<ApiSingleResponse<Article>>(`${this.apiUrl}/fetch/${id}`).pipe(
      map((response) => response.data)
    );
  }

  createArticle(article: Article): Observable<Article> {
    return this.http.post<ApiSingleResponse<Article>>(this.apiUrl, article).pipe(
      map((response) => response.data)
    );
  }

  updateArticle(id: string, article: Article): Observable<Article> {
    const payload = { ...article, id };
    return this.http.put<ApiSingleResponse<Article>>(this.apiUrl, payload).pipe(
      map((response) => response.data)
    );
  }

  deleteArticle(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }

  activerArticle(id: string): Observable<Article> {
    return this.http.put<Article>(`${this.apiUrl}/${id}/activer`, {});
  }

  desactiverArticle(id: string): Observable<Article> {
    return this.http.put<Article>(`${this.apiUrl}/${id}/desactiver`, {});
  }

  getActiveArticles(): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.apiUrl}/actifs`);
  }

  generateQr(articleId: string): Observable<QrCodeInfo> {
    return this.http.get<QrCodeInfo>(`${this.apiUrl}/qr/ARTICLE/${articleId}`);
  }

  searchByCode(code: string): Observable<QrResolveResponse> {
    return this.http.get<QrResolveResponse>(`${this.apiUrl}/search/by-code`, {
      params: { code }
    });
  }

  resolveByPublicCode(publicCode: string): Observable<QrResolveResponse> {
    return this.http.get<QrResolveResponse>(`${this.apiUrl}/resolve/${encodeURIComponent(publicCode)}`);
  }
}
