import { inject, Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { BehaviorSubject, EMPTY, Observable, throwError } from 'rxjs';
import { catchError, filter, finalize, switchMap, take } from 'rxjs/operators';

import { AuthenticationService } from '../auth/services/authentication.service';
import { TokenService } from '../auth/services/tokenService.service';
import { AppConfig } from 'src/environments/environment';
import { ToastService } from '../shared/services/toast.service';

/** Empty string marks a failed refresh so queued requests can fail fast instead of hanging. */
const REFRESH_FAILED = '';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private refreshTokenInProgress = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);
  private _snackBar = inject(ToastService);
  private _authService = inject(AuthenticationService);
  private _tokenService = inject(TokenService);
  private readonly excludedUrls: string[] = [
    AppConfig.authentication.authorization,
    'assets/',
    '/oauth2/token',
    'oauth2/token',
    '/api/security/user/me/refresh-session',
    '/api/security/user/auth/'
  ];

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((err: HttpErrorResponse) => {
        if (this._authService.isLoggingOut || this.isUrlExcluded(request.url)) {
          return throwError(() => err);
        }
        switch (err.status) {
          case 401:
            return this.handle401Error(request, next);
          case 400:
            return this.handle400Error(err);
          case 403:
            return this.handle403Error(err);
          default:
            return throwError(() => err);
        }
      })
    );
  }

  handle403Error(error: HttpErrorResponse): Observable<any> {
    if (error?.status === 403 && error.error?.error === 'access_denied') {
      this._authService.logout('locked');
      return EMPTY;
    }
    return throwError(() => error);
  }

  handle400Error(error: HttpErrorResponse): Observable<any> {
    if (
      error?.status === 400 &&
      error.error &&
      (error.error.error === 'invalid_client' || error.error.error === 'invalid_grant')
    ) {
      this._authService.logout();
      return EMPTY;
    }
    return throwError(() => error);
  }

  handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<any> {
    if (this._authService.isLoggingOut) {
      return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }));
    }

    if (this.refreshTokenInProgress) {
      return this.refreshTokenSubject.pipe(
        filter((token): token is string => token !== null),
        take(1),
        switchMap((token) => {
          if (token === REFRESH_FAILED) {
            return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }));
          }
          return next.handle(this.addToken(req, token));
        })
      );
    }

    this.refreshTokenInProgress = true;
    this.refreshTokenSubject.next(null);

    const refreshToken = this._tokenService.getRefreshToken();
    if (!refreshToken) {
      this.refreshTokenInProgress = false;
      this.refreshTokenSubject.next(REFRESH_FAILED);
      this._authService.logout();
      return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }));
    }

    return this._authService.refreshToken(refreshToken).pipe(
      switchMap((response: Record<string, unknown>) => {
        const accessToken = response?.['access_token'] as string | undefined;
        const refreshTokenValue = response?.['refresh_token'] as string | undefined;
        if (!accessToken) {
          this.refreshTokenSubject.next(REFRESH_FAILED);
          this._authService.logout();
          return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }));
        }
        if (refreshTokenValue) {
          this._tokenService.setRefreshToken(refreshTokenValue);
        }
        this._tokenService.setToken(accessToken);
        this._authService.applyAccessToken(accessToken);
        this.refreshTokenSubject.next(accessToken);
        return next.handle(this.addToken(req, accessToken));
      }),
      catchError((e: HttpErrorResponse) => {
        this.refreshTokenSubject.next(REFRESH_FAILED);
        if (![500, 501, 502, 503, 504].includes(e.status)) {
          this._authService.logout();
        } else {
          this._snackBar.error('Server error');
        }
        return throwError(() => e);
      }),
      finalize(() => {
        this.refreshTokenInProgress = false;
      })
    );
  }

  addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
    const currentUser = this._authService.currentUserValue;
    let headers = req.headers.set('Authorization', `Bearer ${token}`);

    if (currentUser?.tenantId) {
      headers = headers.set('X-Tenant-Id', currentUser?.tenantId);
    }

    return req.clone({
      headers
    });
  }

  private isUrlExcluded(url: string): boolean {
    return this.excludedUrls.some((excludedUrl) => {
      if (!excludedUrl) {
        return false;
      }
      const normalized = excludedUrl.replace(/^\//, '');
      return url.includes(normalized);
    });
  }
}
