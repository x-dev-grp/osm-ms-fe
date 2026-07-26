import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';
import { MinimumWageRule } from '../models/minimum-wage-rule.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MinimumWageRuleService {
  private baseUrl = environment.apiUrl + '/api/hr/minimum-wage-rules';

  constructor(private http: HttpClient) {}

  getAllList(): Observable<ApiResponse<MinimumWageRule>> {
    return this.http.get<ApiResponse<MinimumWageRule>>(`${this.baseUrl}/fetchAll`);
  }

  getById(id: string): Observable<ApiSingleResponse<MinimumWageRule>> {
    return this.http.get<ApiSingleResponse<MinimumWageRule>>(`${this.baseUrl}/fetch/${id}`);
  }

  create(entity: MinimumWageRule): Observable<ApiSingleResponse<MinimumWageRule>> {
    return this.http.post<ApiSingleResponse<MinimumWageRule>>(this.baseUrl, entity);
  }

  update(entity: MinimumWageRule): Observable<ApiSingleResponse<MinimumWageRule>> {
    return this.http.put<ApiSingleResponse<MinimumWageRule>>(this.baseUrl, entity);
  }

  delete(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }
}
