import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ProjetDto } from "../models/TypeProduit";
import { environment } from "../../../environments/environment";
import { QrCodeInfo } from "../../shared/models/qr-models";

import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';

@Injectable({ providedIn: 'root' })
export class ProjetService {
  private readonly baseUrl = environment.apiUrl + '/api/ordreConditionement/projets';

  constructor(private http: HttpClient) {}

  getAll(): Observable<ProjetDto[]> {
    return this.http
      .get<ApiResponse<ProjetDto>>(`${this.baseUrl}/fetchAll`)
      .pipe(map((response) => response.data ?? []));
  }

  getById(id: string): Observable<ProjetDto> {
    return this.http
      .get<ApiSingleResponse<ProjetDto>>(`${this.baseUrl}/fetch/${id}`)
      .pipe(map((response) => response.data));
  }

  getByCode(code: string): Observable<ProjetDto> {
    return this.http
      .get<ProjetDto>(`${this.baseUrl}/code/${code}`);
  }

  create(projet: ProjetDto): Observable<ProjetDto> {
    return this.http
      .post<ApiSingleResponse<ProjetDto>>(this.baseUrl, projet)
      .pipe(
        map((response) => {
          if (response?.success === false) {
            throw response;
          }
          if (!response?.data) {
            throw new Error(response?.message || 'Erreur lors de la creation du projet');
          }
          return response.data;
        })
      );
  }

  update(id: string, projet: ProjetDto): Observable<ProjetDto> {
    const payload: ProjetDto = {
      ...projet,
      id
    };

    return this.http
      .put<ApiSingleResponse<ProjetDto>>(this.baseUrl, payload)
      .pipe(map((response) => response.data));
  }

  cancel(id: string): Observable<ProjetDto> {
    return this.http
      .put<ApiSingleResponse<ProjetDto>>(`${this.baseUrl}/${id}/cancel`, {})
      .pipe(map((response) => response.data));
  }

  delete(id: string): Observable<ProjetDto> {
    return this.http
      .delete<ApiSingleResponse<ProjetDto>>(`${this.baseUrl}/delete/${id}`)
      .pipe(map((response) => response.data));
  }

  updateStatus(id: string, statut: string): Observable<ProjetDto> {
    return this.http
      .put<ApiSingleResponse<ProjetDto>>(
        `${this.baseUrl}/${id}/status`,
        {},
        { params: { statut } }
      )
      .pipe(map((response) => response.data));
  }

  getByUniqueCode(code: string): Observable<ProjetDto> {
    return this.http
      .get<ApiSingleResponse<ProjetDto>>(`${this.baseUrl}/unique/${code}`)
      .pipe(map((response) => response.data));
  }

  updateStatusByCode(code: string, statut: string): Observable<ProjetDto> {
    return this.http
      .put<ApiSingleResponse<ProjetDto>>(
        `${this.baseUrl}/status-by-code/${code}`,
        {},
        { params: { statut } }
      )
      .pipe(map((response) => response.data));
  }

  getQrImageUrl(id: string): string {
    return `${this.baseUrl}/${id}/qr-image`;
  }

  generateQr(entityId: string): Observable<QrCodeInfo> {
    return this.http.get<QrCodeInfo>(
      `${this.baseUrl}/qr/PROJET/${entityId}`
    );
  }
}
