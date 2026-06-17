import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Bom } from '../models/Bom';
import { MaterialNeedLine } from '../../shared/models/material-need-line.model';
import { environment } from '../../../environments/environment';
import { QrCodeInfo, QrResolveResponse } from '../../shared/models/qr-models';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';

@Injectable({ providedIn: 'root' })
export class BomService {
  private apiUrl = `${environment.apiUrl}/api/inventaire/boms`;

  constructor(private http: HttpClient) {}

  getById(id: string): Observable<Bom> {
    return this.http.get<ApiSingleResponse<Bom>>(`${this.apiUrl}/fetch/${id}`).pipe(
      map((response) => this.normalizeBom(response.data))
    );
  }

  getBomsByFinalProduct(finalProductId: string): Observable<Bom[]> {
    return this.http.get<Bom[]>(`${this.apiUrl}/product/${finalProductId}`).pipe(
      map((boms) => (boms ?? []).map((bom) => this.normalizeBom(bom)))
    );
  }

  getBomsByProduct(productId: string): Observable<Bom[]> {
    return this.getBomsByFinalProduct(productId);
  }

  getBomsBySku(skuId: string): Observable<Bom[]> {
    return this.getBomsByProduct(skuId);
  }

  create(bom: Bom): Observable<Bom> {
    return this.http.post<ApiSingleResponse<Bom>>(this.apiUrl, this.toPayload(bom)).pipe(
      map((response) => this.normalizeBom(response.data))
    );
  }

  update(id: string, bom: Bom): Observable<Bom> {
    const payload = { ...this.toPayload(bom), id };
    return this.http.put<ApiSingleResponse<Bom>>(this.apiUrl, payload).pipe(
      map((response) => this.normalizeBom(response.data))
    );
  }

  getAll(): Observable<Bom[]> {
    return this.http.get<ApiResponse<Bom>>(`${this.apiUrl}/fetchAll`).pipe(
      map((response) => (response?.data ?? []).map((bom) => this.normalizeBom(bom)))
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }

  getActiveBomForFinalProduct(finalProductId: string): Observable<Bom | null> {
    return this.http.get<Bom>(`${this.apiUrl}/product/${finalProductId}/active`).pipe(
      map((bom) => this.normalizeBom(bom))
    );
  }

  getActiveBomForProduct(productId: string): Observable<Bom | null> {
    return this.getActiveBomForFinalProduct(productId);
  }

  activate(id: string): Observable<Bom> {
    return this.http.put<Bom>(`${this.apiUrl}/${id}/activate`, {}).pipe(
      map((bom) => this.normalizeBom(bom))
    );
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

  private normalizeBom(bom: Bom): Bom {
    const finalProductId = bom.finalProductId || bom.productId || bom.skuId || '';
    const finalProductName = bom.finalProductName || bom.productName || bom.skuCode;
    return {
      ...bom,
      finalProductId,
      finalProductName,
      productId: finalProductId,
      productName: finalProductName,
      skuId: finalProductId,
      skuCode: finalProductName,
      version: bom.version || 'V1',
      active: bom.active ?? true
    };
  }

  private toPayload(bom: Bom): Bom {
    const finalProductId = bom.finalProductId || bom.productId || bom.skuId || '';
    return {
      ...bom,
      finalProductId,
      productId: finalProductId,
      skuId: finalProductId,
      active: true,
      version: 'V1'
    };
  }
}
