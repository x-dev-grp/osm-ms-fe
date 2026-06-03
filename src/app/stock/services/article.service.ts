import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Article, CategorieArticle, UniteMesureOption } from '../models/article.model';
import {environment} from "../../../environments/environment";
import {QrCodeInfo} from "../../shared/models/qr-models";


@Injectable({
  providedIn: 'root'
})
export class ArticleService {
  private apiUrl = `${environment.apiUrl}/api/inventaire/articles`;

  constructor(private http: HttpClient) {}

  getAllArticles(): Observable<Article[]> {
    return this.http.get<Article[]>(this.apiUrl);
  }
  getArticlesByCategorie(categorie: CategorieArticle | string): Observable<Article[]> {
    const params = new HttpParams().set('categorie', categorie);
    return this.http.get<Article[]>(this.apiUrl, { params });
  }

  getUnitesMesure(): Observable<UniteMesureOption[]> {
    return this.http.get<UniteMesureOption[]>(`${this.apiUrl}/unites-mesure`);
  }

  getArticleById(id: string): Observable<Article> {
    return this.http.get<Article>(`${this.apiUrl}/${id}`);
  }

  createArticle(article: Article): Observable<Article> {
    return this.http.post<Article>(`${this.apiUrl}/create`, article);
  }

  updateArticle(id: string, article: Article): Observable<Article> {
    return this.http.put<Article>(`${this.apiUrl}/${id}`, article);
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
    return this.http.get<QrCodeInfo>(
      `${this.apiUrl}/qr/ARTICLE/${articleId}`
    );
  }
}
