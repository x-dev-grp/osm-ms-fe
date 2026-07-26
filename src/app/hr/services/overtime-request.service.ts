import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';
import { OvertimeRequest } from '../models/overtime-request.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OvertimeRequestService {
  private baseUrl = environment.apiUrl + '/api/hr/overtime-requests';

  constructor(private http: HttpClient) {}

  getAllList(): Observable<ApiResponse<OvertimeRequest>> {
    return this.http.get<ApiResponse<OvertimeRequest>>(`${this.baseUrl}/fetchAll`);
  }

  getById(id: string): Observable<ApiSingleResponse<OvertimeRequest>> {
    return this.http.get<ApiSingleResponse<OvertimeRequest>>(`${this.baseUrl}/fetch/${id}`);
  }

  create(entity: OvertimeRequest): Observable<ApiSingleResponse<OvertimeRequest>> {
    return this.http.post<ApiSingleResponse<OvertimeRequest>>(this.baseUrl, entity);
  }

  update(entity: OvertimeRequest): Observable<ApiSingleResponse<OvertimeRequest>> {
    return this.http.put<ApiSingleResponse<OvertimeRequest>>(this.baseUrl, entity);
  }

  delete(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }
}
