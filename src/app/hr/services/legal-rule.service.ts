import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';
import { LegalRule } from '../models/legal-rule.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LegalRuleService {
  private baseUrl = environment.apiUrl + '/api/hr/legal-rules';

  constructor(private http: HttpClient) {}

  getAllList(): Observable<ApiResponse<LegalRule>> {
    return this.http.get<ApiResponse<LegalRule>>(`${this.baseUrl}/fetchAll`);
  }

  getById(id: string): Observable<ApiSingleResponse<LegalRule>> {
    return this.http.get<ApiSingleResponse<LegalRule>>(`${this.baseUrl}/fetch/${id}`);
  }

  create(entity: LegalRule): Observable<ApiSingleResponse<LegalRule>> {
    return this.http.post<ApiSingleResponse<LegalRule>>(this.baseUrl, entity);
  }

  update(entity: LegalRule): Observable<ApiSingleResponse<LegalRule>> {
    return this.http.put<ApiSingleResponse<LegalRule>>(this.baseUrl, entity);
  }

  delete(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }
}
