import { inject, Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpHeaders } from '@angular/common/http';
import { TokenService } from '../auth/services/tokenService.service';
import { AuthenticationService } from '../auth/services/authentication.service';
import { Observable } from 'rxjs';
import { AppConfig } from 'src/environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(

  ) {}
  private _tokenService= inject (TokenService);
  private _authService=inject( AuthenticationService);
  private readonly excludedUrls: string[] = [
    AppConfig.authentication.authorization,
    'assets/',
  ];
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (this.isUrlExcluded(request.url)) {
      return next.handle(request);
    }

    const token = this._tokenService.getToken();

    if (!token) {
      return next.handle(request);
    }
    const currentUser=this._authService.currentUserValue;
    let headers = request.headers.set('Authorization', `Bearer ${token}`);

// 2️⃣ include X‑Tenant‑Id **only** if it exists
    if (currentUser?.tenantId) {
      headers = headers.set('X-Tenant-Id', currentUser?.tenantId);
    }

    const authReq = request.clone({
      headers: headers,
    });

    return next.handle(authReq);
  }

  private isUrlExcluded(url: string): boolean {
    return this.excludedUrls.some((excludedUrl) => url.startsWith(excludedUrl));
  }
}



