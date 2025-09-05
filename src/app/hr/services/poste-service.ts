import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response';
import { Poste } from '../model/poste.model';

@Injectable({
  providedIn: 'root'
})
export class PosteService {
  private baseUrl = `${environment.apiUrl}/api/hr/poste`;

  constructor(private http: HttpClient) {}

  // Récupérer tous les postes
  getAllPostes(): Observable<ApiResponse<Poste[]>> {
    return this.http.get<ApiResponse<Poste[]>>(`${this.baseUrl}/fetchAll`);
  }

  // Récupérer un poste par son ID
  getPoste(id: string): Observable<ApiResponse<Poste>> {
    return this.http.get<ApiResponse<Poste>>(`${this.baseUrl}/fetch/${id}`);
  }

  // Ajouter un nouveau poste
  addPoste(poste: Poste): Observable<ApiResponse<Poste>> {
    return this.http.post<ApiResponse<Poste>>(`${this.baseUrl}`, poste);
  }

  // Mettre à jour un poste existant
  updatePoste(poste: Poste): Observable<ApiResponse<Poste>> {
    return this.http.put<ApiResponse<Poste>>(`${this.baseUrl}`, poste);
  }

  // Supprimer un poste
  deletePoste(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }

  // Récupérer les postes par département
  getPostesByDepartment(departmentId: string): Observable<ApiResponse<Poste[]>> {
    return this.http.get<ApiResponse<Poste[]>>(`${this.baseUrl}/department/${departmentId}`);
  }
}
