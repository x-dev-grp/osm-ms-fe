import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';
import { Poste } from '../models/poste.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PosteService {
  private baseUrl = environment.apiUrl + '/api/hr/postes';

  constructor(private http: HttpClient) {}

  getAllList(): Observable<ApiResponse<Poste>> {
    return this.http.get<ApiResponse<Poste>>(`${this.baseUrl}/fetchAll`);
  }

  getPoste(id: string): Observable<ApiSingleResponse<Poste>> {
    return this.http.get<ApiSingleResponse<Poste>>(`${this.baseUrl}/fetch/${id}`);
  }

  createPoste(poste: Poste): Observable<ApiSingleResponse<Poste>> {
    return this.http.post<ApiSingleResponse<Poste>>(`${this.baseUrl}`, poste);
  }

  updatePoste(poste: Poste): Observable<ApiSingleResponse<Poste>> {
    return this.http.put<ApiSingleResponse<Poste>>(`${this.baseUrl}`, poste);
  }

  deletePoste(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }
}
