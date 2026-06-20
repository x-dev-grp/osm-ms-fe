import { inject, Injectable, Injector, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { EMPTY, Observable, Subject, switchMap } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

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
import { ChatService } from '../../shared/services/chat.service';
import { ChatStompService } from '../../shared/services/chat-stomp.service';

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

      if (!this.applyAccessToken(token, { notifyOnChange: false, reloadPhoto: true })) {
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

  applyAccessToken(
    accessToken: string,
    options: { notifyOnChange?: boolean; reloadPhoto?: boolean } = {}
  ): boolean {
    const notifyOnChange = options.notifyOnChange ?? true;
    const reloadPhoto = options.reloadPhoto ?? true;

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

    if (reloadPhoto) {
      this.loadUserPhoto();
    }

    this.startSessionSync();
    this.injector.get(ChatStompService).reconnect();
    this.injector.get(ChatService).refreshUnreadCount();

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

    if (this._tokenService.isAccessTokenExpired()) {
      const refreshToken = this._tokenService.getRefreshToken();
      if (!refreshToken) {
        return EMPTY;
      }
      return this.refreshToken(refreshToken).pipe(
        switchMap((response) => {
          if (!response?.['access_token']) {
            return EMPTY;
          }
          return this.postRefreshSession();
        })
      );
    }

    return this.postRefreshSession();
  }

  private postRefreshSession(): Observable<SessionRefreshResponse> {
    this.sessionRefreshInProgress = true;
    return this.http
      .post<SessionRefreshResponse>(`${environment.apiUrl}/api/security/user/me/refresh-session`, {})
      .pipe(
        tap((response) => {
          if (response?.access_token) {
            this.applyAccessToken(response.access_token, { notifyOnChange: true, reloadPhoto: false });
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

    this.sessionVisibilityHandler = () => {
      if (document.visibilityState === 'visible' && this._tokenService.getToken()) {
        this.refreshSessionSilently();
      }
    };
    document.addEventListener('visibilitychange', this.sessionVisibilityHandler);

    this.sessionSyncIntervalId = window.setInterval(() => {
      if (this._tokenService.getToken()) {
        this.refreshSessionSilently();
      }
    }, 5 * 60 * 1000);
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

  logout(queryParams?: string) {
    this.stopSessionSync();
    this.injector.get(NotificationService).stopPolling();
    this.injector.get(ChatStompService).disconnect();
    this.injector.get(ChatService).reset();
    this.permissionService.clearCache();
    this.injector.get(CompanyProfileService).clearCache();
    this._tokenService.clearTokens();
    this.setCurrentUserValue = null;
    this.setUserPhotoPreview(null);
    if (!queryParams) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.router.navigate(['/auth/login'], {
      queryParams: { error: queryParams }
    });
  }
}
