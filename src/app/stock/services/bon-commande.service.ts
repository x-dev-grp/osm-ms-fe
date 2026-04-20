import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BonCommande, StatutBonCommande } from '../models/bon-commande.model';
import {environment} from "../../../environments/environment";
import {ApiResponse} from "../../shared/models/api-response";

@Injectable({
  providedIn: 'root'
})
export class BonCommandeService {
  private apiUrl = `${environment.apiUrl}/api/inventaire/bons-commande`;

  constructor(private http: HttpClient) {}

  getAllBonsCommande(): Observable<ApiResponse<BonCommande>> {
    return this.http.get<ApiResponse<BonCommande>>(this.apiUrl);
  }

  getBonCommandeById(id: string): Observable<ApiResponse<BonCommande>> {
    return this.http.get<ApiResponse<BonCommande>>(`${this.apiUrl}/${id}`);
  }

  createBonCommande(bonCommande: BonCommande): Observable<ApiResponse<BonCommande>> {
    return this.http.post<ApiResponse<BonCommande>>(`${this.apiUrl}/create`, bonCommande);
  }
  validerBonCommande(id: string): Observable<ApiResponse<BonCommande>> {
    return this.http.post<ApiResponse<BonCommande>>(`${this.apiUrl}/${id}/valider`, {});
  }

  refuserBonCommande(id: string, motif: string): Observable<ApiResponse<BonCommande>> {
    return this.http.post<ApiResponse<BonCommande>>(`${this.apiUrl}/${id}/refuser`, { motif });
  }

  receptionnerCommande(id: string, lignes: { id: string; quantiteRecue: number }[]): Observable<ApiResponse<BonCommande>> {
    return this.http.post<ApiResponse<BonCommande>>(`${this.apiUrl}/${id}/receptionner`, lignes);
  }
}
