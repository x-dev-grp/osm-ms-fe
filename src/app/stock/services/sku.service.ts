import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SKU } from '../models/sku.model';
import {environment} from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class SKUService {
  private apiUrl = `http://localhost:8084/api/inventaire/skus`;

  constructor(private http: HttpClient) {}

  getAllSkus(): Observable<SKU[]> {
    return this.http.get<SKU[]>(this.apiUrl);
  }

  getSkuById(id: string): Observable<SKU> {
    return this.http.get<SKU>(`${this.apiUrl}/${id}`);
  }

  createSku(sku: SKU): Observable<SKU> {
    return this.http.post<SKU>(`${this.apiUrl}/create`, sku);
  }

  updateSku(id: string, sku: SKU): Observable<SKU> {
    return this.http.put<SKU>(`${this.apiUrl}/${id}`, sku);
  }

  deleteSku(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  desactiverSku(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/desactiver`, {});
  }

  activerSku(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/activer`, {});
  }
  getActiveSKUs(): Observable<SKU[]> {
    return this.http.get<SKU[]>(`${this.apiUrl}/actifs`);
  }
}
