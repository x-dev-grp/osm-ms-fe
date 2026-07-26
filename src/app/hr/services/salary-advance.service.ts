import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';
import { SalaryAdvance } from '../models/salary-advance.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SalaryAdvanceService {
  private baseUrl = environment.apiUrl + '/api/hr/salary-advances';

  constructor(private http: HttpClient) {}

  getAllList(): Observable<ApiResponse<SalaryAdvance>> {
    return this.http.get<ApiResponse<SalaryAdvance>>(`${this.baseUrl}/fetchAll`);
  }

  getById(id: string): Observable<ApiSingleResponse<SalaryAdvance>> {
    return this.http.get<ApiSingleResponse<SalaryAdvance>>(`${this.baseUrl}/fetch/${id}`);
  }

  create(entity: SalaryAdvance): Observable<ApiSingleResponse<SalaryAdvance>> {
    return this.http.post<ApiSingleResponse<SalaryAdvance>>(this.baseUrl, entity);
  }

  update(entity: SalaryAdvance): Observable<ApiSingleResponse<SalaryAdvance>> {
    return this.http.put<ApiSingleResponse<SalaryAdvance>>(this.baseUrl, entity);
  }

  delete(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }
}
