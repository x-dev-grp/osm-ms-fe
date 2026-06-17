import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LigneConditionnement, Statue } from '../models/ligne-conditionnement.model';
import { environment } from '../../../environments/environment';
import { QrCodeInfo, QrResolveResponse } from '../../shared/models/qr-models';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';

@Injectable({
  providedIn: 'root'
})
export class LigneConditionnementService {
  private apiUrl = `${environment.apiUrl}/api/inventaire/lignes`;

  constructor(private http: HttpClient) {}

  getAllLignes(): Observable<LigneConditionnement[]> {
    return this.http.get<ApiResponse<LigneConditionnement>>(`${this.apiUrl}/fetchAll`).pipe(
      map((response) => response?.data ?? [])
    );
  }

  getLigneById(id: string): Observable<LigneConditionnement> {
    return this.http.get<ApiSingleResponse<LigneConditionnement>>(`${this.apiUrl}/fetch/${id}`).pipe(
      map((response) => response.data)
    );
  }

  createLigne(ligne: LigneConditionnement): Observable<LigneConditionnement> {
    return this.http.post<ApiSingleResponse<LigneConditionnement>>(this.apiUrl, ligne).pipe(
      map((response) => response.data)
    );
  }

  updateLigne(id: string, ligne: LigneConditionnement): Observable<LigneConditionnement> {
    const payload = { ...ligne, id };
    return this.http.put<ApiSingleResponse<LigneConditionnement>>(this.apiUrl, payload).pipe(
      map((response) => response.data)
    );
  }

  deleteLigne(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }

  getActiveLignes(): Observable<LigneConditionnement[]> {
    return this.http.get<LigneConditionnement[]>(`${this.apiUrl}/actifs`);
  }

  desactiverLigne(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/desactiver`, {});
  }

  activerLigne(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/activer`, {});
  }

  changerEtat(id: string, etat: Statue): Observable<LigneConditionnement> {
    return this.http.put<LigneConditionnement>(`${this.apiUrl}/${id}/changer-etat`, { etat });
  }

  generateQr(ligneId: string): Observable<QrCodeInfo> {
    return this.http.get<QrCodeInfo>(`${this.apiUrl}/qr/LIGNECONDITIONNEMENT/${ligneId}`);
  }

  searchByCode(code: string): Observable<QrResolveResponse> {
    return this.http.get<QrResolveResponse>(`${this.apiUrl}/search/by-code`, { params: { code } });
  }

  resolveByPublicCode(publicCode: string): Observable<QrResolveResponse> {
    return this.http.get<QrResolveResponse>(`${this.apiUrl}/resolve/${encodeURIComponent(publicCode)}`);
  }
}
