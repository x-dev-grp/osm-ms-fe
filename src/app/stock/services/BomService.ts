// services/bom.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {Bom} from "../models/Bom";
import {MaterialNeedLine} from "../../shared/models/material-need-line.model";
import {environment} from "../../../environments/environment";
import { QrCodeInfo, QrResolveResponse } from '../../shared/models/qr-models';


@Injectable({ providedIn: 'root' })
export class BomService {
  private apiUrl = `${environment.apiUrl}/api/inventaire/boms`;

  constructor(private http: HttpClient) {}



  getById(id: string): Observable<Bom> {
    return this.http.get<Bom>(`${this.apiUrl}/${id}`);
  }

  getBomsByProduct(productId: string): Observable<Bom[]> {
    return this.http.get<Bom[]>(`${this.apiUrl}/product/${productId}`);
  }

  getBomsBySku(skuId: string): Observable<Bom[]> {
    return this.getBomsByProduct(skuId);
  }

  create(bom: Bom): Observable<Bom> {
    return this.http.post<Bom>(`${this.apiUrl}/create`, bom);
  }
  update(id: string, bom: Bom): Observable<Bom> {
    return this.http.put<Bom>(`${this.apiUrl}/${id}`, bom);
  }
  getAll(): Observable<Bom[]> {
    return this.http.get<Bom[]>(`${this.apiUrl}/all`);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getActiveBomForProduct(productId: string): Observable<Bom | null> {
    return this.http.get<Bom>(`${this.apiUrl}/product/${productId}/active`);
  }

  activate(id: string): Observable<Bom> {
    return this.http.put<Bom>(`${this.apiUrl}/${id}/activate`, {});
  }

  getMaterialNeeds(bomId: string, quantity: number): Observable<MaterialNeedLine[]> {
    return this.http.get<MaterialNeedLine[]>(`${this.apiUrl}/${bomId}/material-needs`, {
      params: { quantity: String(quantity) }
    });
  }

  generateQr(bomId: string): Observable<QrCodeInfo> {
    return this.http.get<QrCodeInfo>(`${this.apiUrl}/qr/BOM/${bomId}`);
  }

  searchByCode(code: string): Observable<QrResolveResponse> {
    return this.http.get<QrResolveResponse>(`${this.apiUrl}/search/by-code`, { params: { code } });
  }

  resolveByPublicCode(publicCode: string): Observable<QrResolveResponse> {
    return this.http.get<QrResolveResponse>(`${this.apiUrl}/resolve/${encodeURIComponent(publicCode)}`);
  }
}
