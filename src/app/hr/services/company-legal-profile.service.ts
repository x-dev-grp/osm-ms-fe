import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';
import { CompanyLegalProfile } from '../models/company-legal-profile.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CompanyLegalProfileService {
  private baseUrl = environment.apiUrl + '/api/hr/company-legal-profile';

  constructor(private http: HttpClient) {}

  getAllList(): Observable<ApiResponse<CompanyLegalProfile>> {
    return this.http.get<ApiResponse<CompanyLegalProfile>>(`${this.baseUrl}/fetchAll`);
  }

  getById(id: string): Observable<ApiSingleResponse<CompanyLegalProfile>> {
    return this.http.get<ApiSingleResponse<CompanyLegalProfile>>(`${this.baseUrl}/fetch/${id}`);
  }

  create(entity: CompanyLegalProfile): Observable<ApiSingleResponse<CompanyLegalProfile>> {
    return this.http.post<ApiSingleResponse<CompanyLegalProfile>>(this.baseUrl, entity);
  }

  update(entity: CompanyLegalProfile): Observable<ApiSingleResponse<CompanyLegalProfile>> {
    return this.http.put<ApiSingleResponse<CompanyLegalProfile>>(this.baseUrl, entity);
  }
}
