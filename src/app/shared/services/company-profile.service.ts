import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, concat, EMPTY } from 'rxjs';
import { map, tap, catchError, filter, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CompanyProfile } from '../models/CompanyProfile';
import { ApiResponse } from '../models/api-response';
import { AuthenticationService } from '../../auth/services/authentication.service';

@Injectable({ providedIn: 'root' })
export class CompanyProfileService {
  private readonly baseUrl = environment.apiUrl + '/api/security/company-profile';
  private readonly STORAGE_KEY = 'company_profile';

  constructor(
    private http: HttpClient,
    private _auth: AuthenticationService
  ) {}

  getProfile(): Observable<CompanyProfile> {
    const tenantId = this._auth.currentUserValue?.tenantId;
    if (!tenantId) return EMPTY;

    const cached = this.readCache(tenantId);
    const cache$ = cached ? of(cached) : EMPTY;

    const fetch$ = this.fetchProfile(tenantId).pipe(
      tap(profile => this.writeCache(profile)),
      // avoid re-emitting identical object back-to-back
      shareReplay({ bufferSize: 1, refCount: false })
    );

    return cached
      ? concat(cache$, fetch$.pipe(catchError(() => EMPTY)))
      : fetch$;
  }

  /** Force-refresh from API and update cache (single emission). */
  refreshProfile(): Observable<CompanyProfile> {
    const tenantId = this._auth.currentUserValue?.tenantId;
    if (!tenantId) return EMPTY;
    return this.fetchProfile(tenantId).pipe(
      tap(profile => this.writeCache(profile))
    );
  }

  /** Synchronous read of the cached profile (for quick access). */
  getProfileFromCache(): CompanyProfile | null {
    const tenantId = this._auth.currentUserValue?.tenantId;
    return tenantId ? this.readCache(tenantId) : null;
  }

  /** Create or update profile; updates cache on success. */
  saveProfile(profile: CompanyProfile): Observable<CompanyProfile> {
    const tenantId = this._auth.currentUserValue?.tenantId;
    if (!tenantId) return of(profile);

    // always enforce tenant id on save
    const payload: CompanyProfile = { ...profile, id: tenantId };

    const req$ = this.http.put<CompanyProfile>(`${this.baseUrl}/update`, payload);
    return req$.pipe(
      tap(saved => this.writeCache(saved))
    );
  }

  /** Clear the cached profile (e.g., on logout). */
  clearCache(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // ========== Internals ==========

  /** Fetch from API and map to CompanyProfile (handles ApiResponse shapes). */
  private fetchProfile(tenantId: string): Observable<CompanyProfile> {
    return this.http
      .get<ApiResponse<CompanyProfile> | CompanyProfile>(`${this.baseUrl}/by-tenant/${tenantId}`)
      .pipe(
        map((res: any) => {
          // Accept either { success, data } or the raw object
          if (res && typeof res === 'object' && 'success' in res) {
            const data = (res as ApiResponse<CompanyProfile>).data;
            // Some backends put the object directly or inside an array
            return Array.isArray(data) ? (data[0] as CompanyProfile) : (data as CompanyProfile);
          }
          return res as CompanyProfile;
        }),
        filter((p): p is CompanyProfile => !!p),
      );
  }

  /** Read cache; ensure it matches the current tenant. */
  private readCache(expectedTenantId: string): CompanyProfile | null {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;
      const cached = JSON.parse(raw) as CompanyProfile | { [k: string]: any };
      // accept either a plain profile or an object with "data":[profile]
      const profile: CompanyProfile = Array.isArray((cached as any).data)
        ? (cached as any).data[0]
        : (cached as CompanyProfile);

      if (!profile || (profile as any).id !== expectedTenantId) return null;
      return profile;
    } catch {
      return null;
    }
  }

  /** Write cache as a plain CompanyProfile object. */
  private writeCache(profile: CompanyProfile): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // storage might be full/blocked; fail silently
    }
  }
}
