import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FinalProduct, FinalProductType } from '../models/final-product.model';
import { environment } from '../../../environments/environment';
import { QrCodeInfo, QrResolveResponse } from '../../shared/models/qr-models';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';

@Injectable({
  providedIn: 'root'
})
export class FinalProductService {
  private apiUrl = `${environment.apiUrl}/api/inventaire/products`;

  constructor(private http: HttpClient) {}

  getAllFinalProducts(): Observable<FinalProduct[]> {
    return this.http
      .get<ApiResponse<FinalProduct>>(`${this.apiUrl}/fetchAll`)
      .pipe(map((response) => (response?.data ?? []).map((finalProduct) => this.normalizeFinalProduct(finalProduct))));
  }

  getFinalProductById(id: string): Observable<FinalProduct> {
    return this.http
      .get<ApiSingleResponse<FinalProduct>>(`${this.apiUrl}/fetch/${id}`)
      .pipe(map((response) => this.normalizeFinalProduct(response.data)));
  }

  createFinalProduct(finalProduct: FinalProduct): Observable<FinalProduct> {
    return this.http
      .post<ApiSingleResponse<FinalProduct>>(this.apiUrl, this.toPayload(finalProduct))
      .pipe(map((response) => this.normalizeFinalProduct(response.data)));
  }

  updateFinalProduct(id: string, finalProduct: FinalProduct): Observable<FinalProduct> {
    const payload = { ...this.toPayload(finalProduct), id };
    return this.http
      .put<ApiSingleResponse<FinalProduct>>(this.apiUrl, payload)
      .pipe(map((response) => this.normalizeFinalProduct(response.data)));
  }

  deleteFinalProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }

  deactivateFinalProduct(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/desactiver`, {});
  }

  activateFinalProduct(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/activer`, {});
  }

  getActiveFinalProducts(): Observable<FinalProduct[]> {
    return this.http
      .get<FinalProduct[]>(`${this.apiUrl}/actifs`)
      .pipe(map((finalProducts) => (finalProducts ?? []).map((finalProduct) => this.normalizeFinalProduct(finalProduct))));
  }

  getFinalProductsByType(type: FinalProductType): Observable<FinalProduct[]> {
    return this.http
      .get<FinalProduct[]>(`${this.apiUrl}/type/${type}`)
      .pipe(map((finalProducts) => (finalProducts ?? []).map((finalProduct) => this.normalizeFinalProduct(finalProduct))));
  }

  getActiveFinalProductsByType(type: FinalProductType): Observable<FinalProduct[]> {
    return this.getFinalProductsByType(type).pipe(map((finalProducts) => finalProducts.filter((finalProduct) => finalProduct.actif)));
  }

  generateQr(finalProductId: string): Observable<QrCodeInfo> {
    return this.http.get<QrCodeInfo>(`${this.apiUrl}/qr/PRODUITFINAL/${finalProductId}`);
  }

  searchByCode(code: string): Observable<QrResolveResponse> {
    return this.http.get<QrResolveResponse>(`${this.apiUrl}/search/by-code`, {
      params: { code }
    });
  }

  private normalizeFinalProduct(finalProduct: FinalProduct): FinalProduct {
    const name = finalProduct?.name || finalProduct?.code || '';
    const unitsPerCarton = finalProduct?.unitsPerCarton ?? finalProduct?.unitesParCols;
    const cartonsPerPallet = finalProduct?.cartonsPerPallet ?? finalProduct?.colisParPalette;
    return {
      ...finalProduct,
      name,
      code: finalProduct?.code || '',
      type: finalProduct?.type || 'NON_VRAC',
      unitOfMeasure: finalProduct?.unitOfMeasure || (finalProduct?.type === 'VRAC' ? 'L' : 'BOTTLE'),
      unitsPerCarton,
      cartonsPerPallet,
      unitesParCols: unitsPerCarton,
      colisParPalette: cartonsPerPallet,
      actif: finalProduct?.actif ?? true,
      publicCode: finalProduct?.publicCode || finalProduct?.qrHex,
      qrHex: finalProduct?.qrHex,
      qrUrl: finalProduct?.qrUrl,
      qrImageBase64: finalProduct?.qrImageBase64
    };
  }

  private toPayload(finalProduct: FinalProduct): FinalProduct {
    const name = finalProduct.name || '';
    const type = finalProduct.type || 'NON_VRAC';
    const unitsPerCarton = finalProduct.unitsPerCarton ?? finalProduct.unitesParCols;
    const cartonsPerPallet = finalProduct.cartonsPerPallet ?? finalProduct.colisParPalette;
    const payload: FinalProduct = {
      ...finalProduct,
      name,
      code: finalProduct.code || undefined,
      type,
      unitOfMeasure: finalProduct.unitOfMeasure || (type === 'VRAC' ? 'L' : 'BOTTLE'),
      unitsPerCarton,
      cartonsPerPallet,
      unitesParCols: unitsPerCarton,
      colisParPalette: cartonsPerPallet
    };

    if (type === 'VRAC') {
      return {
        ...payload,
        volume: undefined,
        packagingType: undefined,
        barcode: undefined,
        unitsPerCarton: undefined,
        cartonsPerPallet: undefined,
        unitesParCols: undefined,
        colisParPalette: undefined,
        netWeight: undefined,
        grossWeight: undefined,
        brand: undefined,
        bom: undefined
      };
    }

    return {
      ...payload,
      density: undefined,
      storageUnit: undefined,
      bom: finalProduct.bom,
      labelIds: finalProduct.labelIds
    };
  }
}
