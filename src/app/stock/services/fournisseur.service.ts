import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Fournisseur } from '../models/fournisseur.model';
import { environment } from '../../../environments/environment';
import { QrCodeInfo, QrResolveResponse } from '../../shared/models/qr-models';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';

@Injectable({
  providedIn: 'root'
})
export class FournisseurService {
  private apiUrl = `${environment.apiUrl}/api/inventaire/fournisseurs`;

  constructor(private http: HttpClient) {}

  getAllFournisseurs(): Observable<Fournisseur[]> {
    return this.http.get<ApiResponse<Fournisseur>>(`${this.apiUrl}/fetchAll`).pipe(
      map((response) => response?.data ?? [])
    );
  }

  getFournisseurById(id: string): Observable<Fournisseur> {
    return this.http.get<ApiSingleResponse<Fournisseur>>(`${this.apiUrl}/fetch/${id}`).pipe(
      map((response) => response.data)
    );
  }

  updateFournisseur(id: string, fournisseur: Fournisseur): Observable<Fournisseur> {
    const payload = { ...fournisseur, id };
    return this.http.put<ApiSingleResponse<Fournisseur>>(this.apiUrl, payload).pipe(
      map((response) => response.data)
    );
  }

  activerFournisseur(id: string): Observable<Fournisseur> {
    return this.http.put<Fournisseur>(`${this.apiUrl}/${id}/activer`, {});
  }

  desactiverFournisseur(id: string): Observable<Fournisseur> {
    return this.http.put<Fournisseur>(`${this.apiUrl}/${id}/desactiver`, {});
  }

  createFournisseur(fournisseur: Fournisseur): Observable<Fournisseur> {
    return this.http.post<ApiSingleResponse<Fournisseur>>(this.apiUrl, fournisseur).pipe(
      map((response) => response.data)
    );
  }

  deleteFournisseur(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }

  getActiveFournisseurs(): Observable<Fournisseur[]> {
    return this.http.get<Fournisseur[]>(`${this.apiUrl}/actifs`);
  }

  generateQr(fournisseurId: string): Observable<QrCodeInfo> {
    return this.http.get<QrCodeInfo>(`${this.apiUrl}/qr/FOURNISSEUR/${fournisseurId}`);
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
