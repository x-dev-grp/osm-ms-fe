import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';
import { TaxConfiguration } from '../models/tax-configuration.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaxConfigurationService {
  private baseUrl = environment.apiUrl + '/api/hr/tax-configurations';

  constructor(private http: HttpClient) {}

  getAllList(): Observable<ApiResponse<TaxConfiguration>> {
    return this.http.get<ApiResponse<TaxConfiguration>>(`${this.baseUrl}/fetchAll`);
  }

  getById(id: string): Observable<ApiSingleResponse<TaxConfiguration>> {
    return this.http.get<ApiSingleResponse<TaxConfiguration>>(`${this.baseUrl}/fetch/${id}`);
  }

  create(entity: TaxConfiguration): Observable<ApiSingleResponse<TaxConfiguration>> {
    return this.http.post<ApiSingleResponse<TaxConfiguration>>(this.baseUrl, entity);
  }

  update(entity: TaxConfiguration): Observable<ApiSingleResponse<TaxConfiguration>> {
    return this.http.put<ApiSingleResponse<TaxConfiguration>>(this.baseUrl, entity);
  }

  delete(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }
}
