import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';
import { LeaveTypeConfig } from '../models/leave-type-config.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LeaveTypeConfigService {
  private baseUrl = environment.apiUrl + '/api/hr/leave-types';

  constructor(private http: HttpClient) {}

  getAllList(): Observable<ApiResponse<LeaveTypeConfig>> {
    return this.http.get<ApiResponse<LeaveTypeConfig>>(`${this.baseUrl}/fetchAll`);
  }

  getById(id: string): Observable<ApiSingleResponse<LeaveTypeConfig>> {
    return this.http.get<ApiSingleResponse<LeaveTypeConfig>>(`${this.baseUrl}/fetch/${id}`);
  }

  create(entity: LeaveTypeConfig): Observable<ApiSingleResponse<LeaveTypeConfig>> {
    return this.http.post<ApiSingleResponse<LeaveTypeConfig>>(this.baseUrl, entity);
  }

  update(entity: LeaveTypeConfig): Observable<ApiSingleResponse<LeaveTypeConfig>> {
    return this.http.put<ApiSingleResponse<LeaveTypeConfig>>(this.baseUrl, entity);
  }

  delete(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }
}
