import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';
import { SalaryComponent } from '../models/salary-component.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SalaryComponentService {
  private baseUrl = environment.apiUrl + '/api/hr/salary-components';

  constructor(private http: HttpClient) {}

  getAllList(): Observable<ApiResponse<SalaryComponent>> {
    return this.http.get<ApiResponse<SalaryComponent>>(`${this.baseUrl}/fetchAll`);
  }

  getById(id: string): Observable<ApiSingleResponse<SalaryComponent>> {
    return this.http.get<ApiSingleResponse<SalaryComponent>>(`${this.baseUrl}/fetch/${id}`);
  }

  create(entity: SalaryComponent): Observable<ApiSingleResponse<SalaryComponent>> {
    return this.http.post<ApiSingleResponse<SalaryComponent>>(this.baseUrl, entity);
  }

  update(entity: SalaryComponent): Observable<ApiSingleResponse<SalaryComponent>> {
    return this.http.put<ApiSingleResponse<SalaryComponent>>(this.baseUrl, entity);
  }

  delete(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }
}
