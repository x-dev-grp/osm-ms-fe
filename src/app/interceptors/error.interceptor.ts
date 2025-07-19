import { Injectable, inject } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, EMPTY, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';

import { AuthenticationService } from '../auth/services/authentication.service';
import { TokenService } from '../auth/services/tokenService.service';
import { AppConfig } from 'src/environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private refreshTokenInProgress = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  private _snackBar=inject(MatSnackBar)
  constructor(
  ) {}
  private _authService=inject(AuthenticationService);
  private _tokenService=inject(TokenService);
    private readonly excludedUrls: string[] = [
      AppConfig.authentication.authorization,
      'assets/',
    ];
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((err: HttpErrorResponse) => {
        if (!this.isUrlExcluded(request.url)) {
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
          return next.handle(this.addToken(req,token));
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
          return next.handle(this.addToken(req,response?.access_token));
        }),
        catchError((e:HttpErrorResponse) => {
          if(![500,501,502,503,504].includes(e.status))
            this._authService.logout();
          else
          this._snackBar.open("Server error", 'Fermer', {
            duration:3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['errorPanelClass'],


          });
          return EMPTY;
        })
      );
    }
  }
  addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
    const currentUser=this._authService.currentUserValue;
    let headers = req.headers.set('Authorization', `Bearer ${token}`);

// 2️⃣ include X‑Tenant‑Id **only** if it exists
    if (currentUser?.tenantId) {
      headers = headers.set('X-Tenant-Id', currentUser?.tenantId);
    }

   return req.clone({
      headers: headers,
    });
  }
  private isUrlExcluded(url: string): boolean {
    return this.excludedUrls.some((excludedUrl) => url.startsWith(excludedUrl));
  }
}
