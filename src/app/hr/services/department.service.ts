import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';
import { Department } from '../models/department.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private baseUrl = environment.apiUrl + '/api/hr/departments';

  constructor(private http: HttpClient) {}

  getAllList(): Observable<ApiResponse<Department>> {
    return this.http.get<ApiResponse<Department>>(`${this.baseUrl}/fetchAll`);
  }

  getById(id: string): Observable<ApiSingleResponse<Department>> {
    return this.http.get<ApiSingleResponse<Department>>(`${this.baseUrl}/fetch/${id}`);
  }

  create(entity: Department): Observable<ApiSingleResponse<Department>> {
    return this.http.post<ApiSingleResponse<Department>>(this.baseUrl, entity);
  }

  update(entity: Department): Observable<ApiSingleResponse<Department>> {
    return this.http.put<ApiSingleResponse<Department>>(this.baseUrl, entity);
  }

  delete(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }
}
