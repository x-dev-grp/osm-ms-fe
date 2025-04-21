import { Injectable, inject } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, EMPTY, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';

import { AuthenticationService } from '../auth/services/authentication.service';
import { TokenService } from '../auth/services/tokenService.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private refreshTokenInProgress = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
  ) {}
  private _authService=inject(AuthenticationService);
  private _tokenService=inject(TokenService);
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((err: HttpErrorResponse) => {
        switch (err.status) {
          case 401:
            return this.handle401Error(request, next);
          case 400:
            return this.handle400Error(err);
          case 403:
            return this.handle403Error(err);
          default:
            break;
          }
        return throwError(err);
      })
    );
  }

  handle403Error(error: HttpErrorResponse): Observable<any> {
    if (error && error.status === 403 && error.error && (error.error.error === 'access_denied')) {
      this._authService.logout("locked");
         return EMPTY;
    }
    return throwError(error);
  }

  handle400Error(error: HttpErrorResponse): Observable<any> {
    if (error && error.status === 400 && error.error && (error.error.error === 'invalid_client' || error.error.error === 'invalid_grant')) {
      this._authService.logout();
      return EMPTY;
    }
    return throwError(error);
  }

  handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<any> {
    if (this.refreshTokenInProgress) {
      return this.refreshTokenSubject.pipe(
        filter((result) => result !== null),
        take(1),
        switchMap((token) => {
          return next.handle(this.addToken(req, this._tokenService.getToken()));
        })
      );
    } else {
      this.refreshTokenInProgress = true;
      this.refreshTokenSubject.next(null);
      return this._authService.refreshToken(this._tokenService.getRefreshToken()).pipe(
        switchMap((response:any) => {
          this.refreshTokenInProgress = false;
          this.refreshTokenSubject.next(response?.access_token);
          this._tokenService.setToken(response?.access_token);
          this._tokenService.setRefreshToken(response?.refresh_token)
          return next.handle(this.addToken(req,response?.access_token));
        }),
        catchError((e) => {
          this._authService.logout();
          return EMPTY;
        })
      );
    }
  }
  addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
    const httpHeaders = new HttpHeaders({
      Authorization: 'Bearer ' + token,
    });
    return req.clone({
      headers: httpHeaders,
    });
  }
}
