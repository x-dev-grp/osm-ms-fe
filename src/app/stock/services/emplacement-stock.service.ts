import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EmplacementStock } from '../models/emplacement-stock.model';
import { environment } from 'src/environments/environment';
import { ApiResponse, ApiSingleResponse } from 'src/app/shared/models/api-response';
import { QrCodeInfo, QrResolveResponse } from 'src/app/shared/models/qr-models';

@Injectable({
  providedIn: 'root'
})
export class EmplacementStockService {
  private apiUrl = `${environment.apiUrl}/api/inventaire/emplacements`;

  constructor(private http: HttpClient) {}

  getAudit(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/audit/all`);
  }

  getAllEmplacements(): Observable<EmplacementStock[]> {
    return this.http.get<ApiResponse<EmplacementStock>>(`${this.apiUrl}/fetchAll`).pipe(
      map((response) => response?.data ?? [])
    );
  }

  getEmplacementById(id: string): Observable<EmplacementStock> {
    return this.http.get<ApiSingleResponse<EmplacementStock>>(`${this.apiUrl}/fetch/${id}`).pipe(
      map((response) => response.data)
    );
  }

  createEmplacement(emplacement: EmplacementStock): Observable<EmplacementStock> {
    return this.http.post<ApiSingleResponse<EmplacementStock>>(this.apiUrl, emplacement).pipe(
      map((response) => response.data)
    );
  }

  updateEmplacement(id: string, emplacement: EmplacementStock): Observable<EmplacementStock> {
    const payload = { ...emplacement, id };
    return this.http.put<ApiSingleResponse<EmplacementStock>>(this.apiUrl, payload).pipe(
      map((response) => response.data)
    );
  }

  reserverEmplacement(id: string, reservePour: string): Observable<EmplacementStock> {
    return this.http.put<EmplacementStock>(`${this.apiUrl}/${id}/reserver`, { reservePour });
  }

  libererEmplacement(id: string): Observable<EmplacementStock> {
    return this.http.put<EmplacementStock>(`${this.apiUrl}/${id}/liberer`, {});
  }

  mettreAJourCapacite(id: string, capaciteActuelle: string): Observable<EmplacementStock> {
    return this.http.put<EmplacementStock>(`${this.apiUrl}/${id}/capacite`, { capaciteActuelle });
  }

  deleteEmplacement(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }

  activerEmplacement(id: string): Observable<EmplacementStock> {
    return this.http.put<EmplacementStock>(`${this.apiUrl}/${id}/activer`, {});
  }

  desactiverEmplacement(id: string): Observable<EmplacementStock> {
    return this.http.put<EmplacementStock>(`${this.apiUrl}/${id}/desactiver`, {});
  }

  searchByCode(code: string): Observable<QrResolveResponse> {
    return this.http.get<QrResolveResponse>(`${this.apiUrl}/search/by-code`, {
      params: { code }
    });
  }

  generateQr(emplacementId: string): Observable<QrCodeInfo> {
    return this.http.get<QrCodeInfo>(`${this.apiUrl}/qr/EMPLACEMENTSTOCK/${emplacementId}`);
  }

  resolveByPublicCode(publicCode: string): Observable<QrResolveResponse> {
    return this.http.get<QrResolveResponse>(`${this.apiUrl}/resolve/${encodeURIComponent(publicCode)}`);
  }
}
