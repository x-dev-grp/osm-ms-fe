import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';
import { EmployeeLoan } from '../models/employee-loan.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeeLoanService {
  private baseUrl = environment.apiUrl + '/api/hr/employee-loans';

  constructor(private http: HttpClient) {}

  getAllList(): Observable<ApiResponse<EmployeeLoan>> {
    return this.http.get<ApiResponse<EmployeeLoan>>(`${this.baseUrl}/fetchAll`);
  }

  getById(id: string): Observable<ApiSingleResponse<EmployeeLoan>> {
    return this.http.get<ApiSingleResponse<EmployeeLoan>>(`${this.baseUrl}/fetch/${id}`);
  }

  create(entity: EmployeeLoan): Observable<ApiSingleResponse<EmployeeLoan>> {
    return this.http.post<ApiSingleResponse<EmployeeLoan>>(this.baseUrl, entity);
  }

  update(entity: EmployeeLoan): Observable<ApiSingleResponse<EmployeeLoan>> {
    return this.http.put<ApiSingleResponse<EmployeeLoan>>(this.baseUrl, entity);
  }

  delete(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }
}
