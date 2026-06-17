import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ExpeditionActionRequest,
  ExpeditionCreateRequest,
  ExpeditionDto,
  ExpeditionLineCreateRequest,
  ExpeditionUpdateRequest,
  ResolveResponse
} from '../models/expedition.model';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';

@Injectable({ providedIn: 'root' })
export class ExpeditionService {
  private readonly baseUrl = `${environment.apiUrl}/api/expeditions`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ExpeditionDto[]> {
    return this.http.get<ApiResponse<ExpeditionDto>>(`${this.baseUrl}/fetchAll`).pipe(
      map((response) => response?.data ?? [])
    );
  }

  create(request: ExpeditionCreateRequest): Observable<ExpeditionDto> {
    return this.http
      .post<ApiSingleResponse<ExpeditionDto>>(this.baseUrl, request)
      .pipe(map((response) => response.data));
  }

  getById(expeditionId: string): Observable<ExpeditionDto> {
    return this.http
      .get<ApiSingleResponse<ExpeditionDto>>(`${this.baseUrl}/fetch/${expeditionId}`)
      .pipe(map((response) => response.data));
  }

  getByProject(projectId: string): Observable<ExpeditionDto[]> {
    return this.http.get<ExpeditionDto[]>(`${this.baseUrl}/project/${projectId}`);
  }

  getProjectTraceability(projectId: string): Observable<any> {
    return this.http.get<ApiSingleResponse<any>>(`${this.baseUrl}/project/${projectId}/traceability`)
      .pipe(map((response) => response.data || response));
  }

  getExpeditionTraceability(expeditionId: string): Observable<Record<string, unknown>> {
    return this.http
      .get<ApiSingleResponse<Record<string, unknown>>>(`${this.baseUrl}/${expeditionId}/traceability`)
      .pipe(map((response) => response.data || response));
  }

  update(expeditionId: string, request: ExpeditionUpdateRequest): Observable<ExpeditionDto> {
    const payload = { ...request, id: expeditionId };
    return this.http
      .put<ApiSingleResponse<ExpeditionDto>>(this.baseUrl, payload)
      .pipe(map((response) => response.data));
  }

  addLine(expeditionId: string, request: ExpeditionLineCreateRequest): Observable<ExpeditionDto> {
    return this.http.post<ExpeditionDto>(`${this.baseUrl}/${expeditionId}/lines`, request);
  }

  removeLine(expeditionId: string, lineId: string): Observable<ExpeditionDto> {
    return this.http.delete<ExpeditionDto>(`${this.baseUrl}/${expeditionId}/lines/${lineId}`);
  }

  ready(expeditionId: string, request?: ExpeditionActionRequest): Observable<ExpeditionDto> {
    return this.http.post<ExpeditionDto>(`${this.baseUrl}/${expeditionId}/ready`, request ?? {});
  }

  validate(expeditionId: string, request?: ExpeditionActionRequest): Observable<ExpeditionDto> {
    return this.http.post<ExpeditionDto>(`${this.baseUrl}/${expeditionId}/validate`, request ?? {});
  }

  ship(expeditionId: string, request?: ExpeditionActionRequest): Observable<ExpeditionDto> {
    return this.http.post<ExpeditionDto>(`${this.baseUrl}/${expeditionId}/ship`, request ?? {});
  }

  deliver(expeditionId: string, request?: ExpeditionActionRequest): Observable<ExpeditionDto> {
    return this.http.post<ExpeditionDto>(`${this.baseUrl}/${expeditionId}/deliver`, request ?? {});
  }

  close(expeditionId: string, request?: ExpeditionActionRequest): Observable<ExpeditionDto> {
    return this.http.post<ExpeditionDto>(`${this.baseUrl}/${expeditionId}/close`, request ?? {});
  }

  cancel(expeditionId: string, request?: ExpeditionActionRequest): Observable<ExpeditionDto> {
    return this.http.post<ExpeditionDto>(`${this.baseUrl}/${expeditionId}/cancel`, request ?? {});
  }

  resolve(publicCode: string): Observable<ResolveResponse> {
    return this.http.get<ResolveResponse>(`${this.baseUrl}/resolve/${encodeURIComponent(publicCode)}`);
  }

  delete(expeditionId: string): Observable<void> {
    return this.http
      .delete<ApiSingleResponse<ExpeditionDto>>(`${this.baseUrl}/delete/${expeditionId}`)
      .pipe(map(() => undefined));
  }
}
