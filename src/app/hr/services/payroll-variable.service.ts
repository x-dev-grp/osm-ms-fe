import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';
import { PayrollVariable } from '../models/payroll-variable.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PayrollVariableService {
  private baseUrl = environment.apiUrl + '/api/hr/payroll-variables';

  constructor(private http: HttpClient) {}

  getAllList(): Observable<ApiResponse<PayrollVariable>> {
    return this.http.get<ApiResponse<PayrollVariable>>(`${this.baseUrl}/fetchAll`);
  }

  getById(id: string): Observable<ApiSingleResponse<PayrollVariable>> {
    return this.http.get<ApiSingleResponse<PayrollVariable>>(`${this.baseUrl}/fetch/${id}`);
  }

  create(entity: PayrollVariable): Observable<ApiSingleResponse<PayrollVariable>> {
    return this.http.post<ApiSingleResponse<PayrollVariable>>(this.baseUrl, entity);
  }

  update(entity: PayrollVariable): Observable<ApiSingleResponse<PayrollVariable>> {
    return this.http.put<ApiSingleResponse<PayrollVariable>>(this.baseUrl, entity);
  }

  delete(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }
}
