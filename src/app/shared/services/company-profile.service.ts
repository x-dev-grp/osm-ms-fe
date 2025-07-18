import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CompanyProfile } from '../models/CompanyProfile';
import { Observable, of } from 'rxjs';
import { ApiResponse } from '../models/api-response';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CompanyProfileService {
  private readonly baseUrl = environment.apiUrl + '/api/production/company-profile';
  private readonly STORAGE_KEY = 'company_profile';

  constructor(private http: HttpClient) {}

  /** Fetches the existing profile (or an empty one if none) */
  getProfile(): Observable<ApiResponse<CompanyProfile>> {
    // Try to get from localStorage first
    const cachedProfile = localStorage.getItem(this.STORAGE_KEY);
    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile);
        if (parsed && parsed.success && Array.isArray(parsed.data[0])) {
          return of(parsed);
        }
      } catch {
        // Ignore malformed cache
      }
    }
    // If not in localStorage or cache is invalid, fetch from API and cache it
    return this.http.get<ApiResponse<CompanyProfile>>(`${this.baseUrl}/fetchAll`).pipe(
      tap(response => {
        if (response && response.success && Array.isArray(response.data) && response.data.length > 0) {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(response));
        }
      })
    );
  }

  /** Creates or updates based on presence of `id` */
  saveProfile(profile: CompanyProfile): Observable<CompanyProfile> {
    const request$ = profile.id
      ? this.http.put<CompanyProfile>(`${this.baseUrl}`, profile)
      : this.http.post<CompanyProfile>(this.baseUrl, profile);

    return request$.pipe(
      tap(() => {
        // After save, clear the cached profile to force fresh fetch next time
        this.clearCache();
      })
    );
  }

  /** Clear the cached profile (call this on logout) */
  clearCache(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
