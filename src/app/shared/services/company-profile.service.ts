import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { concat, EMPTY, Observable, of } from 'rxjs';
import { filter, finalize, map, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CompanyProfile } from '../models/CompanyProfile';
import { ApiResponse } from '../models/api-response';
import { TokenService } from '../../auth/services/tokenService.service';

@Injectable({ providedIn: 'root' })
export class CompanyProfileService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly baseUrl = environment.apiUrl + '/api/security/company-profile';
  private readonly STORAGE_KEY = 'company_profile';
  private readonly LOGO_STORAGE_PREFIX = 'company_profile_logo_';
  private readonly CACHE_MAX_AGE_MS = 60 * 60 * 1000;
  private profileRequest$: Observable<CompanyProfile> | null = null;

  getProfile(options: { forceRefresh?: boolean } = {}): Observable<CompanyProfile> {
    const tenantId = this.getTenantId();
    if (!tenantId) return EMPTY;

    const cached = this.readCache(tenantId);
    const cacheFresh = cached && this.isCacheFresh(tenantId) && !options.forceRefresh;

    if (cacheFresh && cached) {
      return of(cached);
    }

    if (this.profileRequest$) {
      return cached ? concat(of(cached), this.profileRequest$) : this.profileRequest$;
    }

    this.profileRequest$ = this.fetchProfile(tenantId).pipe(
      tap((profile) => this.writeCache(profile)),
      shareReplay({ bufferSize: 1, refCount: false }),
      finalize(() => {
        this.profileRequest$ = null;
      })
    );

    return cached ? concat(of(cached), this.profileRequest$) : this.profileRequest$;
  }

  refreshProfile(): Observable<CompanyProfile> {
    const tenantId = this.getTenantId();
    if (!tenantId) return EMPTY;
    return this.fetchProfile(tenantId).pipe(tap((profile) => this.writeCache(profile)));
  }

  getProfileFromCache(): CompanyProfile | null {
    const tenantId = this.getTenantId();
    return tenantId ? this.readCache(tenantId) : null;
  }

  isProfileCacheFresh(): boolean {
    const tenantId = this.getTenantId();
    return tenantId ? this.isCacheFresh(tenantId) : false;
  }

  getLogoDataUrlFromCache(): string | null {
    const tenantId = this.getTenantId();
    if (!tenantId) {
      return null;
    }
    const profile = this.readCache(tenantId);
    return this.buildLogoDataUrl(profile);
  }

  saveProfile(profile: CompanyProfile): Observable<CompanyProfile> {
    const tenantId = this.getTenantId();
    if (!tenantId) return of(profile);

    const payload: CompanyProfile = { ...profile, id: tenantId };

    const req$ = this.http.put<CompanyProfile>(`${this.baseUrl}/update`, payload);
    return req$.pipe(tap((saved) => this.writeCache(saved)));
  }

  updateTenantModules(tenantId: string, enabledModules: string[]): Observable<CompanyProfile> {
    return this.http.put<CompanyProfile>(`${this.baseUrl}/${tenantId}/modules`, { enabledModules });
  }

  clearCache(): void {
    const tenantId = this.getTenantId();
    localStorage.removeItem(this.STORAGE_KEY);
    if (tenantId) {
      localStorage.removeItem(this.logoStorageKey(tenantId));
      localStorage.removeItem(this.cacheTimestampKey(tenantId));
    }
  }

  private getTenantId(): string | null {
    const decoded = this.tokenService.decodeToken() as Record<string, unknown> | null;
    const oosmUser = (decoded?.['oosmUser'] ?? decoded?.['osmUser']) as { tenantId?: string } | undefined;
    return oosmUser?.tenantId ?? null;
  }

  private fetchProfile(tenantId: string): Observable<CompanyProfile> {
    return this.http.get<ApiResponse<CompanyProfile> | CompanyProfile>(`${this.baseUrl}/by-tenant/${tenantId}`).pipe(
      map((res: any) => {
        if (res && typeof res === 'object' && 'success' in res) {
          const data = (res as ApiResponse<CompanyProfile>).data;
          return Array.isArray(data) ? (data[0] as CompanyProfile) : (data as CompanyProfile);
        }
        return res as CompanyProfile;
      }),
      filter((p): p is CompanyProfile => !!p)
    );
  }

  private readCache(expectedTenantId: string): CompanyProfile | null {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;
      const cached = JSON.parse(raw) as CompanyProfile | { [k: string]: any };
      const profile: CompanyProfile = Array.isArray((cached as any).data) ? (cached as any).data[0] : (cached as CompanyProfile);

      if (!profile || (profile as any).id !== expectedTenantId) return null;

      const logoRaw = localStorage.getItem(this.logoStorageKey(expectedTenantId));
      if (logoRaw) {
        const logo = JSON.parse(logoRaw) as { logoData?: string; logoContentType?: string };
        profile.logoData = logo.logoData;
        profile.logoContentType = logo.logoContentType;
      }

      return profile;
    } catch {
      return null;
    }
  }

  private writeCache(profile: CompanyProfile): void {
    try {
      const tenantId = profile.id;
      if (!tenantId) {
        return;
      }

      const { logoData, logoContentType, ...metadata } = profile;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ ...metadata, id: tenantId }));
      localStorage.setItem(this.cacheTimestampKey(tenantId), String(Date.now()));

      if (tenantId && logoData && logoContentType) {
        localStorage.setItem(
          this.logoStorageKey(tenantId),
          JSON.stringify({ logoData, logoContentType })
        );
      } else if (tenantId) {
        localStorage.removeItem(this.logoStorageKey(tenantId));
      }
    } catch {
      // storage might be full/blocked; fail silently
    }
  }

  private buildLogoDataUrl(profile: CompanyProfile | null): string | null {
    if (!profile?.logoData) {
      return null;
    }
    if (profile.logoData.startsWith('data:')) {
      return profile.logoData;
    }
    if (profile.logoContentType) {
      return `data:${profile.logoContentType};base64,${profile.logoData}`;
    }
    return profile.logoData;
  }

  private logoStorageKey(tenantId: string): string {
    return `${this.LOGO_STORAGE_PREFIX}${tenantId}`;
  }

  private cacheTimestampKey(tenantId: string): string {
    return `${this.STORAGE_KEY}_cached_at_${tenantId}`;
  }

  private isCacheFresh(tenantId: string): boolean {
    const raw = localStorage.getItem(this.cacheTimestampKey(tenantId));
    if (!raw) {
      return false;
    }
    const cachedAt = Number(raw);
    return Number.isFinite(cachedAt) && Date.now() - cachedAt < this.CACHE_MAX_AGE_MS;
  }
}
