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

interface ApiSingleResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class ExpeditionService {
  private readonly baseUrl = `${environment.apiUrl}/api/expeditions`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ExpeditionDto[]> {
    return this.http.get<ExpeditionDto[]>(this.baseUrl);
  }

  create(request: ExpeditionCreateRequest): Observable<ExpeditionDto> {
    return this.http
      .post<ApiSingleResponse<ExpeditionDto>>(this.baseUrl, request)
      .pipe(map(response => response.data));
  }

  getById(expeditionId: string): Observable<ExpeditionDto> {
    return this.http
      .get<ApiSingleResponse<ExpeditionDto>>(`${this.baseUrl}/fetch/${expeditionId}`)
      .pipe(map(response => response.data));
  }

  getByProject(projectId: string): Observable<ExpeditionDto[]> {
    return this.http.get<ExpeditionDto[]>(`${this.baseUrl}/project/${projectId}`);
  }

  getProjectTraceability(projectId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/project/${projectId}/traceability`);
  }

  update(expeditionId: string, request: ExpeditionUpdateRequest): Observable<ExpeditionDto> {
    return this.http
      .put<ApiSingleResponse<ExpeditionDto>>(`${this.baseUrl}/${expeditionId}`, request)
      .pipe(map(response => response.data));
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
