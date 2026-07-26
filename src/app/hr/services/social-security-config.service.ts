import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';
import { SocialSecurityConfig } from '../models/social-security-config.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocialSecurityConfigService {
  private baseUrl = environment.apiUrl + '/api/hr/social-security-configs';

  constructor(private http: HttpClient) {}

  getAllList(): Observable<ApiResponse<SocialSecurityConfig>> {
    return this.http.get<ApiResponse<SocialSecurityConfig>>(`${this.baseUrl}/fetchAll`);
  }

  getById(id: string): Observable<ApiSingleResponse<SocialSecurityConfig>> {
    return this.http.get<ApiSingleResponse<SocialSecurityConfig>>(`${this.baseUrl}/fetch/${id}`);
  }

  create(entity: SocialSecurityConfig): Observable<ApiSingleResponse<SocialSecurityConfig>> {
    return this.http.post<ApiSingleResponse<SocialSecurityConfig>>(this.baseUrl, entity);
  }

  update(entity: SocialSecurityConfig): Observable<ApiSingleResponse<SocialSecurityConfig>> {
    return this.http.put<ApiSingleResponse<SocialSecurityConfig>>(this.baseUrl, entity);
  }

  delete(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }
}
