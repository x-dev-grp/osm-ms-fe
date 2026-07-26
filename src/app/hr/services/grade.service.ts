import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';
import { Grade } from '../models/grade.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GradeService {
  private baseUrl = environment.apiUrl + '/api/hr/grades';

  constructor(private http: HttpClient) {}

  getAllList(): Observable<ApiResponse<Grade>> {
    return this.http.get<ApiResponse<Grade>>(`${this.baseUrl}/fetchAll`);
  }

  getById(id: string): Observable<ApiSingleResponse<Grade>> {
    return this.http.get<ApiSingleResponse<Grade>>(`${this.baseUrl}/fetch/${id}`);
  }

  create(entity: Grade): Observable<ApiSingleResponse<Grade>> {
    return this.http.post<ApiSingleResponse<Grade>>(this.baseUrl, entity);
  }

  update(entity: Grade): Observable<ApiSingleResponse<Grade>> {
    return this.http.put<ApiSingleResponse<Grade>>(this.baseUrl, entity);
  }

  delete(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }
}
