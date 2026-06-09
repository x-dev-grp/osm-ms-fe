import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ProjetDto } from "../models/TypeProduit";
import { environment } from "../../../environments/environment";
import { QrCodeInfo } from "../../shared/models/qr-models";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class ProjetService {
  private readonly baseUrl = environment.apiUrl + '/api/ordreConditionement/projets';

  constructor(private http: HttpClient) {}

  getAll(): Observable<ProjetDto[]> {
    return this.http
      .get<ApiResponse<ProjetDto[]>>(`${this.baseUrl}/fetchAll`)
      .pipe(
        // Correction: securiser le retour si data est null/undefined
        map(response => response.data ?? [])
      );
  }

  getById(id: string): Observable<ProjetDto> {
    return this.http
      .get<ApiResponse<ProjetDto>>(`${this.baseUrl}/fetch/${id}`)
      .pipe(
        // Correction: retour direct du DTO contenu dans ApiResponse
        map(response => response.data)
      );
  }

  getByCode(code: string): Observable<ProjetDto> {
    return this.http
      .get<ProjetDto>(`${this.baseUrl}/code/${code}`);
  }

  create(projet: ProjetDto): Observable<ProjetDto> {
    return this.http
      .post<ApiResponse<ProjetDto> | ProjetDto>(`${this.baseUrl}/create`, projet)
      .pipe(
        map((response) => {
          if (response && typeof response === 'object' && 'success' in response) {
            const apiResponse = response as ApiResponse<ProjetDto>;
            if (apiResponse.success === false) {
              throw apiResponse;
            }
            if (!apiResponse.data) {
              throw new Error(apiResponse.message || 'Erreur lors de la creation du projet');
            }
            return apiResponse.data;
          }

          return response as ProjetDto;
        })
      );
  }

  update(id: string, projet: ProjetDto): Observable<ProjetDto> {
    const payload: ProjetDto = {
      ...projet,
      id
    };

    return this.http
      .put<ApiResponse<ProjetDto>>(this.baseUrl, payload)
      .pipe(
        // Correction: extraction du DTO depuis ApiResponse
        map(response => response.data)
      );
  }

  cancel(id: string): Observable<ProjetDto> {
    return this.http
      .put<ApiResponse<ProjetDto>>(`${this.baseUrl}/${id}/cancel`, {})
      .pipe(
        // Correction: extraction du DTO de retour
        map(response => response.data)
      );
  }

  delete(id: string): Observable<ProjetDto> {
    return this.http
      .delete<ApiResponse<ProjetDto>>(`${this.baseUrl}/delete/${id}`)
      .pipe(
        // Correction: extraction du DTO supprime
        map(response => response.data)
      );
  }

  updateStatus(id: string, statut: string): Observable<ProjetDto> {
    return this.http
      .put<ApiResponse<ProjetDto>>(
        `${this.baseUrl}/${id}/status`,
        {},
        {
          // Correction: passer le statut via query params HttpClient
          // au lieu de concatener manuellement l'URL
          params: { statut }
        }
      )
      .pipe(
        // Correction: retourner le projet mis a jour, sinon le composant
        // ne peut pas exploiter correctement la reponse
        map(response => response.data)
      );
  }

  getByUniqueCode(code: string): Observable<ProjetDto> {
    return this.http
      .get<ApiResponse<ProjetDto>>(`${this.baseUrl}/unique/${code}`)
      .pipe(map(response => response.data));
  }

  updateStatusByCode(code: string, statut: string): Observable<ProjetDto> {
    return this.http
      .put<ApiResponse<ProjetDto>>(
        `${this.baseUrl}/status-by-code/${code}`,
        {},
        { params: { statut } }
      )
      .pipe(map(response => response.data));
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
