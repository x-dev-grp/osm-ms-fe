import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CompanyProfile } from '../models/CompanyProfile';
import { Observable, of } from 'rxjs';
import { ApiResponse } from '../models/api-response';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthenticationService } from '../../auth/services/authentication.service';

@Injectable({
  providedIn: 'root'
})
export class CompanyProfileService {
  private readonly baseUrl = environment.apiUrl + '/api/security/company-profile';
  private readonly STORAGE_KEY = 'company_profile';

  constructor(
    private http: HttpClient,
    private _authService: AuthenticationService
  ) {}

  /** Fetches the existing profile (or an empty one if none) */
  getProfile(): Observable<ApiResponse<CompanyProfile>> {
    const tenantId = this._authService.currentUserValue?.tenantId;
    const cachedProfile = localStorage.getItem(this.STORAGE_KEY);
    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile);
        // Check if the cached profile matches the current tenantId
        if (parsed && parsed.success && parsed.data && parsed.data[0]?.id === tenantId) {
          return of(parsed);
        }
      } catch {
        // Ignore malformed cache
      }
    }
    // Fetch from API if not in cache or ID mismatch
    return this.http.get<ApiResponse<CompanyProfile>>(`${this.baseUrl}/fetch/${tenantId}`).pipe(
      tap((response) => {
        if (response && response.success ) {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(response.data));
        }
      })
    );
  }

  /** Fetches the company profile by tenantId using the new backend endpoint */
  getProfileByTenantId(tenantId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/fetch/${tenantId}`);
  }

  /** Creates or updates based on presence of `id` */
  saveProfile(profile: CompanyProfile): Observable<CompanyProfile> {
    const tenantId = this._authService.currentUserValue?.tenantId;
    profile.id = tenantId;
    const request$ = tenantId
      ? this.http.put<CompanyProfile>(`${this.baseUrl}/update`, profile)
      : this.http.post<CompanyProfile>(this.baseUrl, profile);

    return request$.pipe(
      tap((savedProfile) => {
        // After save, update the cached profile in localStorage
        const responseToCache = {
          success: true,
          data: [savedProfile]
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(responseToCache));
      })
    );
  }

  /** Clear the cached profile (call this on logout) */
  clearCache(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
