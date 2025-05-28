import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CompanyProfile } from '../models/CompanyProfile';
import { Observable, of } from 'rxjs';
import { ApiResponse } from '../models/api-response';
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CompanyProfileService {
  private readonly baseUrl = '/api/production/company-profile';
  private readonly STORAGE_KEY = 'company_profile';

  constructor(private http: HttpClient) {}

  /** Fetches the existing profile (or an empty one if none) */
  getProfile(): Observable<ApiResponse<CompanyProfile>> {
    // Try to get from localStorage first
    const cachedProfile = localStorage.getItem(this.STORAGE_KEY);
    if (cachedProfile) {
      return of(JSON.parse(cachedProfile));
    }

    // If not in localStorage, fetch from API and cache it
    return this.http.get<ApiResponse<CompanyProfile>>(`${this.baseUrl}/fetchAll`).pipe(
      tap(response => {
        if (response && response.success) {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(response));
        }
      })
    );
  }

  /** Creates or updates based on presence of `id` */
  saveProfile(profile: CompanyProfile): Observable<CompanyProfile> {
    const request$ = profile.id
      ? this.http.put<CompanyProfile>(`${this.baseUrl}/${profile.id}`, profile)
      : this.http.post<CompanyProfile>(this.baseUrl, profile);

    return request$.pipe(
      tap(savedProfile => {
        // Update the cached profile after successful save
        const cachedResponse = localStorage.getItem(this.STORAGE_KEY);
        if (cachedResponse) {
          const response = JSON.parse(cachedResponse);
          response.data[0] = savedProfile;
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(response));
        }
      })
    );
  }

  /** Clear the cached profile (call this on logout) */
  clearCache(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
