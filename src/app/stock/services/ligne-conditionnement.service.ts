import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LigneConditionnement, Statue } from '../models/ligne-conditionnement.model';
import {environment} from "../../../environments/environment";


@Injectable({
  providedIn: 'root'
})
export class LigneConditionnementService {
  private apiUrl = `${environment.apiUrl}/api/inventaire/lignes`;

  constructor(private http: HttpClient) {}

  getAllLignes(): Observable<LigneConditionnement[]> {
    return this.http.get<LigneConditionnement[]>(this.apiUrl);
  }

  getLigneById(id: string): Observable<LigneConditionnement> {
    return this.http.get<LigneConditionnement>(`${this.apiUrl}/${id}`);
  }

  createLigne(ligne: LigneConditionnement): Observable<LigneConditionnement> {
    return this.http.post<LigneConditionnement>(`${this.apiUrl}/create`, ligne);
  }

  updateLigne(id: string, ligne: LigneConditionnement): Observable<LigneConditionnement> {
    return this.http.put<LigneConditionnement>(`${this.apiUrl}/${id}`, ligne);
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




}
