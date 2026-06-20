import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BonCommande } from '../models/bon-commande.model';
import { environment } from '../../../environments/environment';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';
import { QrCodeInfo, QrResolveResponse } from '../../shared/models/qr-models';

@Injectable({
  providedIn: 'root'
})
export class BonCommandeService {
  private apiUrl = `${environment.apiUrl}/api/inventaire/bons-commande`;

  constructor(private http: HttpClient) {}

  getAllBonsCommande(): Observable<BonCommande[]> {
    return this.http.get<ApiResponse<BonCommande>>(`${this.apiUrl}/fetchAll`).pipe(map((response) => response?.data ?? []));
  }

  getBonCommandeById(id: string): Observable<BonCommande> {
    return this.http.get<ApiSingleResponse<BonCommande>>(`${this.apiUrl}/fetch/${id}`).pipe(map((response) => response.data));
  }

  createBonCommande(bonCommande: BonCommande): Observable<BonCommande> {
    return this.http.post<ApiSingleResponse<BonCommande>>(this.apiUrl, bonCommande).pipe(map((response) => response.data));
  }

  validerBonCommande(id: string): Observable<ApiResponse<BonCommande>> {
    return this.http.post<ApiResponse<BonCommande>>(`${this.apiUrl}/${id}/valider`, {});
  }

  refuserBonCommande(id: string, motif: string): Observable<ApiResponse<BonCommande>> {
    return this.http.post<ApiResponse<BonCommande>>(`${this.apiUrl}/${id}/refuser`, { motif });
  }

  receptionnerCommande(id: string, lignes: { id: string; quantiteRecue: number }[]): Observable<BonCommande> {
    return this.http
      .post<ApiResponse<BonCommande>>(`${this.apiUrl}/${id}/receptionner`, lignes)
      .pipe(map((response) => response?.data?.[0] as BonCommande));
  }

  generateQr(bonCommandeId: string): Observable<QrCodeInfo> {
    return this.http.get<QrCodeInfo>(`${this.apiUrl}/qr/BONCOMMANDE/${bonCommandeId}`);
  }

  searchByCode(code: string): Observable<QrResolveResponse> {
    return this.http.get<QrResolveResponse>(`${this.apiUrl}/search/by-code`, { params: { code } });
  }

  resolveByPublicCode(publicCode: string): Observable<QrResolveResponse> {
    return this.http.get<QrResolveResponse>(`${this.apiUrl}/resolve/${encodeURIComponent(publicCode)}`);
  }
}
