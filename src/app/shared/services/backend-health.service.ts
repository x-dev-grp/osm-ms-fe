import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, timeout } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export type BackendHealthState = 'checking' | 'up' | 'degraded' | 'down' | 'unreachable';

export interface PublicHealthCheck {
  status?: string;
  latencyMs?: number;
  error?: string;
}

export interface PublicHealthResponse {
  status?: 'UP' | 'DOWN' | 'DEGRADED';
  timestamp?: string;
  checks?: Record<string, PublicHealthCheck>;
}

export interface LoginBackendStatusConfig {
  enabled: boolean;
  pollIntervalMs: number;
  activePollIntervalMs: number;
  healthPath: string;
  wakePath: string;
  /** Absolute backend host for login health/wake when API is on a separate Render service. */
  backendBaseUrl?: string;
  /** Full URL for cold-start ping; defaults to backendBaseUrl + wakePath or api root. */
  wakeUrl?: string;
  requestTimeoutMs: number;
}

@Injectable({ providedIn: 'root' })
export class BackendHealthService {
  private readonly http = inject(HttpClient);

  isEnabled(): boolean {
    return environment.loginBackendStatus?.enabled ?? true;
  }

  config(): LoginBackendStatusConfig {
    return {
      enabled: environment.loginBackendStatus?.enabled ?? true,
      pollIntervalMs: environment.loginBackendStatus?.pollIntervalMs ?? 60_000,
      activePollIntervalMs: environment.loginBackendStatus?.activePollIntervalMs ?? 5_000,
      healthPath: environment.loginBackendStatus?.healthPath ?? '/api/public/health',
      wakePath: environment.loginBackendStatus?.wakePath ?? '/',
      backendBaseUrl: environment.loginBackendStatus?.backendBaseUrl,
      wakeUrl: environment.loginBackendStatus?.wakeUrl,
      requestTimeoutMs: environment.loginBackendStatus?.requestTimeoutMs ?? 8_000
    };
  }

  private apiBaseUrl(): string {
    const base = this.config().backendBaseUrl?.replace(/\/$/, '');
    return base ?? environment.apiUrl;
  }

  private buildUrl(path: string): string {
    return `${this.apiBaseUrl()}${path}`;
  }

  private wakeTargetUrl(): string {
    const { wakeUrl, wakePath } = this.config();
    if (wakeUrl) {
      return wakeUrl;
    }
    const base = this.apiBaseUrl();
    if (!wakePath || wakePath === '/') {
      return base ? `${base.replace(/\/$/, '')}/` : '/';
    }
    return this.buildUrl(wakePath);
  }

  /** Ping the backend to wake a cold/sleeping instance (e.g. Render free tier). */
  wake(): Observable<void> {
    if (!this.isEnabled()) {
      return of(undefined);
    }

    const { requestTimeoutMs } = this.config();
    const url = this.wakeTargetUrl();

    return this.http.get(url, { responseType: 'text' }).pipe(
      timeout(requestTimeoutMs),
      map(() => undefined),
      catchError(() => of(undefined))
    );
  }

  check(): Observable<{ state: BackendHealthState; response?: PublicHealthResponse }> {
    if (!this.isEnabled()) {
      return of({ state: 'checking' });
    }

    const { healthPath, requestTimeoutMs } = this.config();
    const url = this.buildUrl(healthPath);

    return this.http.get<PublicHealthResponse>(url, { observe: 'response' }).pipe(
      timeout(requestTimeoutMs),
      map((httpResponse) => {
        const body = httpResponse.body;
        if (!body?.status) {
          return { state: 'down' as BackendHealthState, response: body ?? undefined };
        }
        if (body.status === 'UP') {
          return { state: 'up' as BackendHealthState, response: body };
        }
        if (body.status === 'DEGRADED') {
          return { state: 'degraded' as BackendHealthState, response: body };
        }
        return { state: 'down' as BackendHealthState, response: body };
      }),
      catchError((error: HttpErrorResponse | Error) => {
        if (error instanceof HttpErrorResponse && error.status > 0 && error.error?.status) {
          const body = error.error as PublicHealthResponse;
          const state: BackendHealthState =
            body.status === 'DEGRADED' ? 'degraded' : body.status === 'UP' ? 'up' : 'down';
          return of({ state, response: body });
        }
        return of({ state: 'unreachable' as BackendHealthState });
      })
    );
  }
}
