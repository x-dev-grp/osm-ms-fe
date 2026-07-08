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
  healthPath: string;
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
      healthPath: environment.loginBackendStatus?.healthPath ?? '/api/public/health',
      requestTimeoutMs: environment.loginBackendStatus?.requestTimeoutMs ?? 8_000
    };
  }

  check(): Observable<{ state: BackendHealthState; response?: PublicHealthResponse }> {
    if (!this.isEnabled()) {
      return of({ state: 'checking' });
    }

    const { healthPath, requestTimeoutMs } = this.config();
    const url = `${environment.apiUrl}${healthPath}`;

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
