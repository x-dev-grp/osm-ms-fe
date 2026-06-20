import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { OrdreFabrication } from '../models/of.model';
import { environment } from '../../../environments/environment';
import { QrCodeInfo } from '../../shared/models/qr-models';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';

@Injectable({ providedIn: 'root' })
export class OFService {
  private baseUrl = environment.apiUrl + '/api/ordreConditionement/of';

  constructor(private http: HttpClient) {}

  getAll(): Observable<OrdreFabrication[]> {
    return this.http.get<ApiResponse<OrdreFabrication>>(`${this.baseUrl}/fetchAll`).pipe(map((response) => response?.data ?? []));
  }

  getByProject(projectId: string): Observable<OrdreFabrication[]> {
    return this.http.get<OrdreFabrication[]>(`${this.baseUrl}/project/${projectId}`);
  }

  getById(id: string): Observable<OrdreFabrication> {
    return this.http.get<ApiSingleResponse<OrdreFabrication>>(`${this.baseUrl}/fetch/${id}`).pipe(map((response) => response.data));
  }

  getByCode(code: string): Observable<OrdreFabrication> {
    return this.http.get<OrdreFabrication>(`${this.baseUrl}/search/by-code`, {
      params: { code }
    });
  }

  create(of: OrdreFabrication): Observable<OrdreFabrication> {
    return this.http.post<ApiSingleResponse<OrdreFabrication>>(this.baseUrl, of).pipe(map((response) => response.data));
  }

  update(id: string, of: OrdreFabrication): Observable<OrdreFabrication> {
    return this.http.put<ApiSingleResponse<OrdreFabrication>>(this.baseUrl, { ...of, id }).pipe(map((response) => response.data));
  }

  demarrer(id: string): Observable<OrdreFabrication> {
    return this.http.put<OrdreFabrication>(`${this.baseUrl}/${id}/demarrer`, {});
  }

  pause(id: string): Observable<OrdreFabrication> {
    return this.http.put<OrdreFabrication>(`${this.baseUrl}/${id}/pause`, {});
  }

  reprendre(id: string): Observable<OrdreFabrication> {
    return this.http.put<OrdreFabrication>(`${this.baseUrl}/${id}/reprise`, {});
  }

  cloturer(id: string): Observable<OrdreFabrication> {
    return this.http.put<OrdreFabrication>(`${this.baseUrl}/${id}/cloturer`, {});
  }

  saisirProduction(ofId: string, payload: { quantiteBonne: number; quantiteNC: number; motifNC: string | null }) {
    return this.http.put<OrdreFabrication>(`${this.baseUrl}/${ofId}/production`, payload);
  }

  ajusterConsommation(id: string, ajustement: any): Observable<OrdreFabrication> {
    return this.http.put<OrdreFabrication>(`${this.baseUrl}/${id}/ajustements`, ajustement);
  }

  generateQr(entityId: string): Observable<QrCodeInfo> {
    return this.http.get<QrCodeInfo>(`${this.baseUrl}/qr/OF/${entityId}`);
  }
}
