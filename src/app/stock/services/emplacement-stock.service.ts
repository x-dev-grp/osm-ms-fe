import { Injectable } from '@angular/core';
import { HttpClient} from '@angular/common/http';
import { Observable } from 'rxjs';
import { EmplacementStock, TypeEmplacement } from '../models/emplacement-stock.model';
import { environment } from 'src/environments/environment';
import { ApiResponse } from 'src/app/shared/models/api-response';
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

  getAllEmplacements(): Observable<ApiResponse<EmplacementStock[]>> {
    return this.http.get<ApiResponse<EmplacementStock[]>>(this.apiUrl);
  }
  getEmplacementById(id: string): Observable<ApiResponse<EmplacementStock>> {
    return this.http.get<ApiResponse<EmplacementStock>>(`${this.apiUrl}/${id}`);
  }

  createEmplacement(emplacement: EmplacementStock): Observable<ApiResponse<EmplacementStock>> {
    return this.http.post<ApiResponse<EmplacementStock>>(`${this.apiUrl}/create`, emplacement);
  }

  updateEmplacement(id: string, emplacement: EmplacementStock): Observable<ApiResponse<EmplacementStock>> {
    return this.http.put<ApiResponse<EmplacementStock>>(`${this.apiUrl}/${id}`, emplacement);
  }

  reserverEmplacement(id: string, reservePour: string): Observable<ApiResponse<EmplacementStock>> {
    return this.http.put<ApiResponse<EmplacementStock>>(`${this.apiUrl}/${id}/reserver`, { reservePour });
  }

  libererEmplacement(id: string): Observable<ApiResponse<EmplacementStock>> {
    return this.http.put<ApiResponse<EmplacementStock>>(`${this.apiUrl}/${id}/liberer`, {});
  }

  mettreAJourCapacite(id: string, capaciteActuelle: string): Observable<ApiResponse<EmplacementStock>> {
    return this.http.put<ApiResponse<EmplacementStock>>(`${this.apiUrl}/${id}/capacite`, { capaciteActuelle });
  }

  deleteEmplacement(id: string): Observable<ApiResponse<EmplacementStock>> {
    return this.http.delete<ApiResponse<EmplacementStock>>(`${this.apiUrl}/${id}`);
  }
  activerEmplacement(id: string): Observable<ApiResponse<EmplacementStock>> {
    return this.http.put<ApiResponse<EmplacementStock>>(`${this.apiUrl}/${id}/activer`, {});
  }
  desactiverEmplacement(id: string): Observable<ApiResponse<EmplacementStock>> {
    return this.http.put<ApiResponse<EmplacementStock>>(`${this.apiUrl}/${id}/desactiver`, {});
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
