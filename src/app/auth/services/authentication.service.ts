import { inject, Injectable, Injector, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { EMPTY, Observable, Subject, switchMap } from 'rxjs';
import { catchError, finalize, shareReplay, tap } from 'rxjs/operators';

// project import
import { AppConfig, environment } from 'src/environments/environment';
import { User } from '../../theme/types/user';
import { TokenService } from 'src/app/auth/services/tokenService.service';
import { Role } from 'src/app/theme/types/role';
import { UserService } from '../../settings/user-management/services/user.service';
import { buildUserPhotoDataUrl } from '../../shared/utils/user-initials.util';
import { NotificationService } from '../../shared/services/notification.service';
import { PermissionService } from '../../settings/user-management/services/permission.service';
import { CompanyProfileService } from '../../shared/services/company-profile.service';

export interface SessionRefreshResponse {
  access_token: string;
  token_type?: string;
  authorities?: string[];
  enabledModules?: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private router = inject(Router);
  private http = inject(HttpClient);
  private _tokenService = inject(TokenService);
  private userService = inject(UserService);
  private permissionService = inject(PermissionService);
  private readonly injector = inject(Injector);
  readonly currentUserSignal = signal<User | null>(null);
  readonly userPhotoPreviewSignal = signal<string | null>(null);
  private permissionsChangedSubject = new Subject<void>();
  readonly permissionsChanged$ = this.permissionsChangedSubject.asObservable();
  private sessionSyncStarted = false;
  private sessionRefreshInProgress = false;
  private bootstrapCompleted = false;
  private sessionSyncIntervalId: ReturnType<typeof setInterval> | null = null;
  private sessionVisibilityHandler: (() => void) | null = null;
  private lastSessionRefreshAt = 0;
  private photoRequestUserId: string | null = null;
  private photoRequestInFlight = false;
  private sessionRefreshRequest: Observable<SessionRefreshResponse> | null = null;
  private lastDocumentHiddenAt = 0;
  private loggingOut = false;
  private static readonly SESSION_REFRESH_MIN_INTERVAL_MS = 2 * 60 * 1000;
  private static readonly SESSION_REFRESH_FAILURE_BACKOFF_MS = 5 * 60 * 1000;
  private static readonly SESSION_VISIBILITY_MIN_HIDDEN_MS = 30 * 1000;

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

      this.applyAccessToken(token, { notifyOnChange: false, reloadPhoto: true });
      this.refreshSession()
        .pipe(finalize(() => finishBootstrap()))
        .subscribe();
      return;
    });
  }

  public set setCurrentUserValue(user: User | null) {
    this.currentUserSignal.set(user);
  }

  public get currentUserValue(): User | null {
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
      this.photoRequestUserId = null;
      return;
    }

    const userId = this.currentUserValue?.id ?? null;
    if (!userId) {
      return;
    }

    if (this.photoRequestInFlight && this.photoRequestUserId === userId) {
      return;
    }

    if (this.photoRequestUserId === userId && this.userPhotoPreviewSignal()) {
      return;
    }

    this.photoRequestUserId = userId;
    this.photoRequestInFlight = true;

    this.userService
      .getMyPhoto()
      .pipe(
        catchError(() => EMPTY),
        finalize(() => {
          this.photoRequestInFlight = false;
        })
      )
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

  applyAccessToken(
    accessToken: string,
    options: { notifyOnChange?: boolean; reloadPhoto?: boolean; authorities?: string[]; enabledModules?: string[] } = {}
  ): boolean {
    const notifyOnChange = options.notifyOnChange ?? true;
    const reloadPhoto = options.reloadPhoto ?? true;
    const explicitAuthorities = options.authorities;
    const explicitEnabledModules = options.enabledModules;

    if (!accessToken) {
      return false;
    }

    const previousPermissions = this.normalizedPermissions().join('|');
    const previousEnabledModules = this.getTenantEnabledModules().join('|');
    this._tokenService.setToken(accessToken);

    const decodedToken = this._tokenService.decodeToken() as Record<string, unknown> | null;
    const tokenUser = decodedToken?.['oosmUser'] ?? decodedToken?.['osmUser'];
    if (!decodedToken || !tokenUser) {
      return false;
    }

    const role = decodedToken['role'] as string;
    const oosmUser = tokenUser as User;
    const user: User = structuredClone(oosmUser);
    user.role = role;
    user.permissions =
      explicitAuthorities ??
      (decodedToken['authorities'] as string[] | undefined) ??
      (this.currentUserValue?.id === user.id ? this.currentUserValue?.permissions : undefined);
    user.enabledModules =
      explicitEnabledModules ??
      (this.currentUserValue?.id === user.id ? this.currentUserValue?.enabledModules : undefined);
    this.setCurrentUserValue = user;

    if (reloadPhoto) {
      this.loadUserPhoto();
    }

    this.startSessionSync();

    if (notifyOnChange) {
      const currentPermissions = this.normalizedPermissions().join('|');
      const currentEnabledModules = this.getTenantEnabledModules().join('|');
      if (previousPermissions !== currentPermissions || previousEnabledModules !== currentEnabledModules) {
        this.permissionsChangedSubject.next();
      }
    }

    return true;
  }

  refreshSession(): Observable<SessionRefreshResponse> {
    if (this.sessionRefreshRequest) {
      return this.sessionRefreshRequest;
    }

    if (!this._tokenService.getToken()) {
      return EMPTY;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return EMPTY;
    }

    const now = Date.now();
    if (now - this.lastSessionRefreshAt < AuthenticationService.SESSION_REFRESH_MIN_INTERVAL_MS) {
      return EMPTY;
    }

    let request$: Observable<SessionRefreshResponse>;

    if (this._tokenService.isAccessTokenExpired()) {
      const refreshToken = this._tokenService.getRefreshToken();
      if (!refreshToken) {
        return EMPTY;
      }
      request$ = this.refreshToken(refreshToken).pipe(
        switchMap((response) => {
          if (!response?.['access_token']) {
            return EMPTY;
          }
          return this.postRefreshSession();
        })
      );
    } else {
      request$ = this.postRefreshSession();
    }

    this.sessionRefreshRequest = request$.pipe(
      shareReplay({ bufferSize: 1, refCount: true }),
      finalize(() => {
        this.sessionRefreshRequest = null;
      })
    );

    return this.sessionRefreshRequest;
  }

  private postRefreshSession(): Observable<SessionRefreshResponse> {
    this.sessionRefreshInProgress = true;
    return this.http
      .post<SessionRefreshResponse>(
        `${environment.apiUrl}/api/security/user/me/refresh-session`,
        {},
        { headers: { 'X-Skip-Toast': 'true' } }
      )
      .pipe(
        tap((response) => {
          if (response?.access_token) {
            this.lastSessionRefreshAt = Date.now();
            this.applyAccessToken(response.access_token, {
              notifyOnChange: true,
              reloadPhoto: false,
              authorities: response.authorities,
              enabledModules: response.enabledModules
            });
          }
        }),
        catchError((error) => {
          this.lastSessionRefreshAt =
            Date.now() -
            AuthenticationService.SESSION_REFRESH_MIN_INTERVAL_MS +
            AuthenticationService.SESSION_REFRESH_FAILURE_BACKOFF_MS;
          if (error?.status !== 0) {
            console.warn('[AuthService] Session refresh failed:', error);
          }
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

    this.sessionVisibilityHandler = () => {
      if (document.visibilityState === 'hidden') {
        this.lastDocumentHiddenAt = Date.now();
        return;
      }

      if (document.visibilityState !== 'visible' || !this._tokenService.getToken()) {
        return;
      }

      const hiddenMs = Date.now() - this.lastDocumentHiddenAt;
      if (hiddenMs < AuthenticationService.SESSION_VISIBILITY_MIN_HIDDEN_MS) {
        return;
      }

      this.refreshSessionSilently();
    };
    document.addEventListener('visibilitychange', this.sessionVisibilityHandler);

    this.sessionSyncIntervalId = window.setInterval(() => {
      if (this._tokenService.getToken()) {
        this.refreshSessionSilently();
      }
    }, 15 * 60 * 1000);
  }

  private stopSessionSync(): void {
    if (this.sessionSyncIntervalId !== null) {
      clearInterval(this.sessionSyncIntervalId);
      this.sessionSyncIntervalId = null;
    }
    if (this.sessionVisibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.sessionVisibilityHandler);
      this.sessionVisibilityHandler = null;
    }
    this.sessionSyncStarted = false;
  }

  hasPermission(permission: string): boolean {
    const user = this.currentUserValue;
    if (!user) return false;

    if (user.role === Role.OosmAdmin) return true;

    const modulePrefix = permission.split(':')[0]?.toUpperCase();
    if (modulePrefix && !this.hasTenantModule(modulePrefix)) {
      return false;
    }

    if (user.role === Role.Admin) return true;

    const permissions = this.normalizedPermissions();
    return permissions.includes(permission.toUpperCase());
  }

  hasModule(module: string): boolean {
    const user = this.currentUserValue;
    if (!user) return false;

    if (user.role === Role.OosmAdmin) return true;
    if (!this.hasTenantModule(module)) return false;
    if (user.role === Role.Admin) return true;

    const modulePrefix = `${module.toUpperCase()}:`;
    return this.normalizedPermissions().some((p) => p.startsWith(modulePrefix));
  }

  hasTenantModule(module: string): boolean {
    const user = this.currentUserValue;
    if (!user) return false;
    if (user.role === Role.OosmAdmin) return true;
    const enabled = this.getTenantEnabledModules();
    if (!enabled.length) return false;
    return enabled.includes(module.toUpperCase());
  }

  getTenantEnabledModules(): string[] {
    const modules = this.currentUserValue?.enabledModules;
    if (!modules?.length) {
      return [];
    }
    return modules.map((module) => String(module).toUpperCase());
  }

  setTenantEnabledModules(modules: string[] | undefined): void {
    const user = this.currentUserValue;
    if (!user) {
      return;
    }
    const previousEnabledModules = this.getTenantEnabledModules().join('|');
    user.enabledModules = modules?.map((module) => module.toUpperCase()) ?? [];
    this.setCurrentUserValue = user;
    const currentEnabledModules = this.getTenantEnabledModules().join('|');
    if (previousEnabledModules !== currentEnabledModules) {
      this.permissionsChangedSubject.next();
    }
  }

  isOosmAdmin(): boolean {
    return this.currentUserValue?.role === Role.OosmAdmin;
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

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some((permission) => this.hasPermission(permission));
  }
  hasAnyModule(modules: string[]): boolean {
    return modules.some((m) => this.hasModule(m));
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
    return this.http.post<Record<string, unknown>>(`${AppConfig.authentication.authorization}`, body.toString(), { headers }).pipe(
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
          this.applyAccessToken(accessToken, { notifyOnChange: true, reloadPhoto: true });
        }
      })
    );
  }

  get isLoggingOut(): boolean {
    return this.loggingOut;
  }

  logout(queryParams?: string) {
    if (this.loggingOut) {
      return;
    }
    this.loggingOut = true;
    this.stopSessionSync();
    this.injector.get(NotificationService).stopPolling();
    this.permissionService.clearCache();
    this.injector.get(CompanyProfileService).clearCache();
    this._tokenService.clearTokens();
    this.setCurrentUserValue = null;
    this.setUserPhotoPreview(null);
    this.photoRequestUserId = null;
    this.lastSessionRefreshAt = 0;
    this.sessionRefreshRequest = null;

    const navigate = () => {
      if (!queryParams) {
        void this.router.navigate(['/auth/login']).finally(() => {
          this.loggingOut = false;
        });
        return;
      }
      void this.router.navigate(['/auth/login'], {
        queryParams: { error: queryParams }
      }).finally(() => {
        this.loggingOut = false;
      });
    };
    navigate();
  }
}
