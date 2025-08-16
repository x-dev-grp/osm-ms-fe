import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response';
import { Employee } from '../model/employee-model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private baseUrl = `${environment.apiUrl}/api/hr/employee`;

  constructor(private http: HttpClient) {}

  // Get all suppliers
  getAllEmployees(): Observable<ApiResponse<Employee>> {
    return this.http.get<ApiResponse<Employee>>(`${this.baseUrl}/fetchAll`);
  }

  // Get Employee by id
  getEmployee(id: string): Observable<ApiResponse<Employee>> {
    return this.http.get<ApiResponse<Employee>>(`${this.baseUrl}/fetch/${id}`);
  }

  // Add a new Employee
  addEmployee(Employee: Employee): Observable<ApiResponse<Employee>> {
    return this.http.post<ApiResponse<Employee>>(`${this.baseUrl}`, Employee);
  }

  // Update an existing Employee
  updateEmployee( Employee: Employee): Observable<ApiResponse<Employee>> {
    return this.http.put<ApiResponse<Employee>>(`${this.baseUrl}`, Employee);
  }


}
