import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';
import { EmployeeDocument } from '../models/employee-document.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeeDocumentService {
  private baseUrl = environment.apiUrl + '/api/hr/employee-documents';

  constructor(private http: HttpClient) {}

  getAllList(): Observable<ApiResponse<EmployeeDocument>> {
    return this.http.get<ApiResponse<EmployeeDocument>>(`${this.baseUrl}/fetchAll`);
  }

  getById(id: string): Observable<ApiSingleResponse<EmployeeDocument>> {
    return this.http.get<ApiSingleResponse<EmployeeDocument>>(`${this.baseUrl}/fetch/${id}`);
  }

  create(entity: EmployeeDocument): Observable<ApiSingleResponse<EmployeeDocument>> {
    return this.http.post<ApiSingleResponse<EmployeeDocument>>(this.baseUrl, entity);
  }

  update(entity: EmployeeDocument): Observable<ApiSingleResponse<EmployeeDocument>> {
    return this.http.put<ApiSingleResponse<EmployeeDocument>>(this.baseUrl, entity);
  }

  delete(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }
}
