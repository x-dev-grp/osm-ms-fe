import { inject, Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { TokenService } from '../auth/services/tokenService.service';
import { Observable } from 'rxjs';
import { AppConfig } from 'src/environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly tokenService = inject(TokenService);
  private readonly excludedUrls: string[] = [AppConfig.authentication.authorization, 'assets/'];

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.isUrlExcluded(request.url)) {
      return next.handle(request);
    }

    const token = this.tokenService.getToken();
    if (!token) {
      return next.handle(request);
    }

    let headers = request.headers.set('Authorization', `Bearer ${token}`);
    const tenantId = this.getTenantIdFromToken();
    if (tenantId) {
      headers = headers.set('X-Tenant-Id', tenantId);
    }

    return next.handle(request.clone({ headers }));
  }

  private getTenantIdFromToken(): string | null {
    const decoded = this.tokenService.decodeToken() as Record<string, unknown> | null;
    return (decoded?.['osmUser'] as { tenantId?: string } | undefined)?.tenantId ?? null;
  }

  private isUrlExcluded(url: string): boolean {
    return this.excludedUrls.some((excludedUrl) => url.startsWith(excludedUrl));
  }
}
