import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CompanyProfile } from '../models/CompanyProfile';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class CompanyProfileService {
  private readonly baseUrl = '/api/production/company-profile';

  constructor(private http: HttpClient) {}

  /** Fetches the existing profile (or an empty one if none) */
  getProfile(): Observable<ApiResponse<CompanyProfile>> {
    return this.http.get<ApiResponse<CompanyProfile>>(`${this.baseUrl}/fetchAll`);
  }

  /** Creates or updates based on presence of `id` */
  saveProfile(profile: CompanyProfile): Observable<CompanyProfile> {
    if (profile.id) {
      return this.http.put<CompanyProfile>(`${this.baseUrl}/${profile.id}`, profile);
    } else {
      return this.http.post<CompanyProfile>(this.baseUrl, profile);
    }
  }
}
