import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';
import { Employee } from '../models/employee.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private baseUrl = environment.apiUrl + '/api/hr/employees';

  constructor(private http: HttpClient) {}

  getAllList(): Observable<ApiResponse<Employee>> {
    return this.http.get<ApiResponse<Employee>>(`${this.baseUrl}/fetchAll`);
  }

  getEmployee(id: string): Observable<ApiSingleResponse<Employee>> {
    return this.http.get<ApiSingleResponse<Employee>>(`${this.baseUrl}/fetch/${id}`);
  }

  createEmployee(employee: Employee): Observable<ApiSingleResponse<Employee>> {
    return this.http.post<ApiSingleResponse<Employee>>(`${this.baseUrl}`, employee);
  }

  updateEmployee(employee: Employee): Observable<ApiSingleResponse<Employee>> {
    return this.http.put<ApiSingleResponse<Employee>>(`${this.baseUrl}`, employee);
  }

  deleteEmployee(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }
}
