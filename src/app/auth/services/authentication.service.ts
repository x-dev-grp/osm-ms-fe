// angular import
import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, Subject, EMPTY } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

// project import
import { AppConfig, environment } from 'src/environments/environment';
import { User } from '../../theme/types/user';
import { TokenService } from 'src/app/auth/services/tokenService.service';
import { Role } from 'src/app/theme/types/role';
import { UserService } from '../../settings/user-management/services/user.service';
import { buildUserPhotoDataUrl } from '../../shared/utils/user-initials.util';

export interface SessionRefreshResponse {
  access_token: string;
  token_type?: string;
  authorities?: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private router = inject(Router);
  private http = inject(HttpClient);
  private _tokenService = inject(TokenService);
  private userService = inject(UserService);
  private readonly STORAGE_KEY = 'company_profile';
  readonly currentUserSignal = signal<User | null>(null);
  readonly userPhotoPreviewSignal = signal<string | null>(null);
  private permissionsChangedSubject = new Subject<void>();
  readonly permissionsChanged$ = this.permissionsChangedSubject.asObservable();
  private sessionSyncStarted = false;
  private sessionRefreshInProgress = false;
  private bootstrapCompleted = false;

  constructor() {
    // Session restore runs via APP_INITIALIZER (bootstrapSession).
  }

  bootstrapSession(): Promise<void> {
    if (this.bootstrapCompleted) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this._tokenService.purgeExpiredRememberMe();
      const token = this._tokenService.getToken();

      if (!token) {
        this.bootstrapCompleted = true;
        resolve();
        return;
      }

      const finishBootstrap = () => {
        this.bootstrapCompleted = true;
        resolve();
      };

      if (this._tokenService.isAccessTokenExpired()) {
        this.restoreSessionWithRefresh(finishBootstrap);
        return;
      }

      if (!this.applyAccessToken(token, false)) {
        this.restoreSessionWithRefresh(finishBootstrap);
        return;
      }

      this.startSessionSync();
      finishBootstrap();
    });
  }

  public set setCurrentUserValue(user: User | null) {
    this.currentUserSignal.set(user);
  }

  public get currentUserValue(): User | null {
    // Access the current user valueg from the signal
    return this.currentUserSignal();
  }

  public get currentUserName(): string | null {
    return this.currentUserValue?.username || null;
  }

  public get userPhotoPreview(): string | null {
    return this.userPhotoPreviewSignal();
  }

  setUserPhotoPreview(preview: string | null): void {
    this.userPhotoPreviewSignal.set(preview);
  }

  loadUserPhoto(): void {
    if (!this._tokenService.getToken()) {
      this.setUserPhotoPreview(null);
      return;
    }

    this.userService
      .getMyPhoto()
      .pipe(catchError(() => EMPTY))
      .subscribe((photo) => {
        this.setUserPhotoPreview(buildUserPhotoDataUrl(photo?.photoData, photo?.photoContentType));
      });
  }

  private restoreSessionWithRefresh(finishBootstrap: () => void): void {
    const refreshToken = this._tokenService.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      finishBootstrap();
      return;
    }

    this.refreshToken(refreshToken)
      .pipe(
        tap((response) => {
          if (!response?.['access_token']) {
            this.logout();
          }
        }),
        catchError(() => {
          console.warn('[AuthService] Session bootstrap refresh failed');
          this.logout();
          return EMPTY;
        }),
        finalize(() => finishBootstrap())
      )
      .subscribe();
  }

  applyAccessToken(accessToken: string, notifyOnChange = true): boolean {
    if (!accessToken) {
      return false;
    }

    const previousPermissions = this.normalizedPermissions().join('|');
    this._tokenService.setToken(accessToken);

    const decodedToken = this._tokenService.decodeToken() as Record<string, unknown> | null;
    if (!decodedToken?.['osmUser']) {
      return false;
    }

    const role = decodedToken['role'] as string;
    const permissions = decodedToken['authorities'];
    const user: User = structuredClone(decodedToken['osmUser'] as User);
    user.role = role;
    user.permissions = permissions;
    this.setCurrentUserValue = user;
    this.loadUserPhoto();
    this.startSessionSync();

    if (notifyOnChange) {
      const currentPermissions = this.normalizedPermissions().join('|');
      if (previousPermissions !== currentPermissions) {
        this.permissionsChangedSubject.next();
      }
    }

    return true;
  }

  refreshSession(): Observable<SessionRefreshResponse> {
    if (this.sessionRefreshInProgress || !this._tokenService.getToken()) {
      return EMPTY;
    }

    this.sessionRefreshInProgress = true;
    return this.http
      .post<SessionRefreshResponse>(`${environment.apiUrl}/api/security/user/me/refresh-session`, {})
      .pipe(
        tap((response) => {
          if (response?.access_token) {
            this.applyAccessToken(response.access_token);
            this.permissionsChangedSubject.next();
          }
        }),
        catchError((error) => {
          console.warn('[AuthService] Session refresh failed:', error);
          return EMPTY;
        }),
        finalize(() => {
          this.sessionRefreshInProgress = false;
        })
      );
  }

  refreshSessionSilently(): void {
    this.refreshSession().subscribe();
  }

  private startSessionSync(): void {
    if (this.sessionSyncStarted || typeof document === 'undefined') {
      return;
    }
    this.sessionSyncStarted = true;

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this._tokenService.getToken()) {
        this.refreshSessionSilently();
      }
    });

    window.setInterval(() => {
      if (this._tokenService.getToken()) {
        this.refreshSessionSilently();
      }
    }, 5 * 60 * 1000);
  }

  hasPermission(permission: string): boolean {
    const user = this.currentUserValue;
    if (!user) return false;

    if (user.role === Role.Admin) return true;

    const permissions = this.normalizedPermissions();
    return permissions.includes(permission.toUpperCase());
  }

  hasModule(module: string): boolean {
    const user = this.currentUserValue;
    if (!user) return false;

    if (user.role === Role.Admin) return true;

    const modulePrefix = `${module.toUpperCase()}:`;
    return this.normalizedPermissions().some((p) => p.startsWith(modulePrefix));
  }

  private normalizedPermissions(): string[] {
    const raw = this.currentUserValue?.permissions;
    if (!raw) {
      return [];
    }
    const list = Array.isArray(raw) ? raw : [raw];
    return list.map((p) => String(p).toUpperCase());
  }
  hasRole(role: string): boolean {
    const user = this.currentUserValue;
    return user?.role === role || false;
  }

  /**
   * Checks if the user has any of the specified permissions
   * @param permissions - An array of permission strings to check
   * @returns Returns true if the user has at least one of the specified permissions, false otherwise
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some((permission) => this.hasPermission(permission)); // Using Array.some() to check if at least one permission exists
  }
  hasAnyModule(modules: string[]): boolean {
    return modules.some((m) => this.hasModule(m)); // Using Array.some() to check if at least one permission exists
  }

  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every((permission) => this.hasPermission(permission));
  }

  isAdmin(): boolean {
    return this.currentUserValue?.role === Role.Admin;
  }

  login(payload: Record<string, string>): Observable<Record<string, unknown>> {
    const body = new URLSearchParams();
    body.set('grant_type', 'TOKEN');
    body.set('client_id', AppConfig.authentication.client_id);
    body.set('username', payload['username']);
    body.set('password', payload['password']);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });
    // Logging for debugging in production
    console.log('[AuthService] Login request:', {
      url: AppConfig.authentication.authorization,
      payload: { ...payload, password: '***' }, // mask password
      headers: headers.keys().reduce((acc, key) => ({ ...acc, [key]: headers.get(key) }), {})
    });
    return this.http.post<Record<string, unknown>>(`${AppConfig.authentication.authorization}`, body.toString(), { headers }).pipe(
      // Log the response for debugging
      tap((response) => {
        console.log('[AuthService] Login response:', response);
      }),
      catchError((error) => {
        console.error('[AuthService] Login error:', error);
        throw error;
      })
    );
  }

  refreshToken(refreshToken: string | null): Observable<Record<string, unknown>> {
    const body = new URLSearchParams();
    body.set('grant_type', 'refresh_token');
    body.set('client_id', AppConfig.authentication.client_id);
    body.set('refresh_token', refreshToken ?? '');
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });
    return this.http.post<Record<string, unknown>>(`${AppConfig.authentication.authorization}`, body.toString(), { headers }).pipe(
      tap((response) => {
        const accessToken = response?.['access_token'] as string | undefined;
        const refreshTokenValue = response?.['refresh_token'] as string | undefined;
        if (refreshTokenValue) {
          this._tokenService.setRefreshToken(refreshTokenValue);
        }
        if (accessToken) {
          this.applyAccessToken(accessToken);
        }
      })
    );
  }

  logout(queryParams?: string) {
    this._tokenService.clearTokens();
    localStorage.removeItem(this.STORAGE_KEY);
    this.setCurrentUserValue = null;
    this.setUserPhotoPreview(null);
    this.sessionSyncStarted = false;
    if (!queryParams) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.router.navigate(['/auth/login'], {
      queryParams: { error: queryParams }
    });
  }
}
