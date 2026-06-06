import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Fournisseur, CategorieFournisseur } from '../models/fournisseur.model';
import {environment} from "../../../environments/environment";
import { QrCodeInfo, QrResolveResponse } from '../../shared/models/qr-models';


@Injectable({
  providedIn: 'root'
})
export class FournisseurService {
  private apiUrl = `${environment.apiUrl}/api/inventaire/fournisseurs`;

  constructor(private http: HttpClient) {}

  getAllFournisseurs(): Observable<Fournisseur[]> {
    return this.http.get<Fournisseur[]>(this.apiUrl);
  }

  getFournisseurById(id: string): Observable<Fournisseur> {
    return this.http.get<Fournisseur>(`${this.apiUrl}/${id}`);
  }

  updateFournisseur(id: string, fournisseur: Fournisseur): Observable<Fournisseur> {
    return this.http.put<Fournisseur>(`${this.apiUrl}/${id}`, fournisseur);
  }

  activerFournisseur(id: string): Observable<Fournisseur> {
    return this.http.put<Fournisseur>(`${this.apiUrl}/${id}/activer`, {});
  }

  desactiverFournisseur(id: string): Observable<Fournisseur> {
    return this.http.put<Fournisseur>(`${this.apiUrl}/${id}/desactiver`, {});
  }


  createFournisseur(fournisseur: Fournisseur): Observable<Fournisseur> {
    return this.http.post<Fournisseur>(`${this.apiUrl}/create`, fournisseur);
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
