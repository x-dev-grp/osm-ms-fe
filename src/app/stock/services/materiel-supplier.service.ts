import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MaterielSupplier } from '../models/materiel-supplier.model';
import { environment } from '../../../environments/environment';
import { QrCodeInfo, QrResolveResponse } from '../../shared/models/qr-models';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';

@Injectable({
  providedIn: 'root'
})
export class MaterielSupplierService {
  private apiUrl = `${environment.apiUrl}/api/inventaire/materiel-suppliers`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<MaterielSupplier[]> {
    return this.http.get<ApiResponse<MaterielSupplier>>(`${this.apiUrl}/fetchAll`).pipe(map((response) => response?.data ?? []));
  }

  getById(id: string): Observable<MaterielSupplier> {
    return this.http.get<ApiSingleResponse<MaterielSupplier>>(`${this.apiUrl}/fetch/${id}`).pipe(map((response) => response.data));
  }

  update(id: string, supplier: MaterielSupplier): Observable<MaterielSupplier> {
    const payload = { ...supplier, id };
    return this.http.put<ApiSingleResponse<MaterielSupplier>>(this.apiUrl, payload).pipe(map((response) => response.data));
  }

  activate(id: string): Observable<MaterielSupplier> {
    return this.http.put<MaterielSupplier>(`${this.apiUrl}/${id}/activer`, {});
  }

  deactivate(id: string): Observable<MaterielSupplier> {
    return this.http.put<MaterielSupplier>(`${this.apiUrl}/${id}/desactiver`, {});
  }

  create(supplier: MaterielSupplier): Observable<MaterielSupplier> {
    return this.http.post<ApiSingleResponse<MaterielSupplier>>(this.apiUrl, supplier).pipe(map((response) => response.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }

  getActive(): Observable<MaterielSupplier[]> {
    return this.http.get<MaterielSupplier[]>(`${this.apiUrl}/actifs`);
  }

  generateQr(supplierId: string): Observable<QrCodeInfo> {
    return this.http.get<QrCodeInfo>(`${this.apiUrl}/qr/MATERIEL_SUPPLIER/${supplierId}`);
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
