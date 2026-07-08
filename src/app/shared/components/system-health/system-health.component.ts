import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, interval, map, of, startWith, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { environment } from 'src/environments/environment';

type ServiceStatus = 'UP' | 'DOWN' | 'DEGRADED' | 'UNKNOWN' | 'ERROR';

interface HealthCheck {
  status?: ServiceStatus;
  latencyMs?: number;
  httpStatus?: number;
  error?: string;
}

interface PublicHealthResponse {
  status?: ServiceStatus;
  timestamp?: string;
  checks?: {
    backend?: HealthCheck;
    database?: HealthCheck;
    frontend?: HealthCheck;
  };
}

@Component({
  selector: 'app-system-health',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: './system-health.component.html',
  styleUrls: ['./system-health.component.scss']
})
export class SystemHealthComponent {
  readonly refreshMs = input(30000);
  readonly compact = input(false);

  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly endpoint = `${environment.apiUrl}/api/public/health`;

  readonly loading = signal(true);
  readonly health = signal<PublicHealthResponse | null>(null);

  constructor() {
    interval(this.refreshMs())
      .pipe(
        startWith(0),
        switchMap(() => this.fetchHealth()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((health) => {
        this.loading.set(false);
        this.health.set(health);
      });
  }

  get status(): ServiceStatus {
    if (this.loading()) {
      return 'UNKNOWN';
    }
    return this.health()?.status || 'ERROR';
  }

  get statusLabel(): string {
    if (this.loading()) {
      return 'Checking services';
    }
    if (this.status === 'UP') {
      return 'All services online';
    }
    if (this.status === 'DEGRADED') {
      return 'Service degraded';
    }
    return 'Service unavailable';
  }

  get tooltip(): string {
    const checks = this.health()?.checks;
    if (!checks) {
      return this.statusLabel;
    }
    return [
      `Backend: ${checks.backend?.status || 'UNKNOWN'}`,
      `Database: ${this.checkText(checks.database)}`,
      `Frontend: ${this.checkText(checks.frontend)}`
    ].join('\n');
  }

  checkStatus(name: 'backend' | 'database' | 'frontend'): ServiceStatus {
    return this.health()?.checks?.[name]?.status || 'UNKNOWN';
  }

  private fetchHealth() {
    return this.http.get<PublicHealthResponse>(this.endpoint).pipe(
      map((body) => this.normalizeHealth(body)),
      catchError((error: HttpErrorResponse) => {
        const body = error.error as PublicHealthResponse | null;
        if (body && (body.checks || body.status)) {
          return of(this.normalizeHealth(body, error.status));
        }
        return of({
          status: 'ERROR',
          checks: {
            backend: { status: 'DOWN', error: error.status ? `HTTP_${error.status}` : 'NetworkError' },
            database: { status: 'UNKNOWN' },
            frontend: { status: 'UNKNOWN' }
          }
        } satisfies PublicHealthResponse);
      })
    );
  }

  private normalizeHealth(body: PublicHealthResponse | null, httpStatus?: number): PublicHealthResponse {
    if (!body) {
      return {
        status: httpStatus === 503 ? 'DEGRADED' : 'ERROR',
        checks: {
          backend: { status: 'UNKNOWN' },
          database: { status: 'UNKNOWN' },
          frontend: { status: 'UNKNOWN' }
        }
      };
    }
    return {
      ...body,
      status: body.status ?? (httpStatus === 503 ? 'DEGRADED' : httpStatus && httpStatus >= 200 && httpStatus < 300 ? 'UP' : 'ERROR')
    };
  }

  private checkText(check?: HealthCheck): string {
    if (!check) {
      return 'UNKNOWN';
    }
    const latency = Number.isFinite(check.latencyMs) ? ` ${check.latencyMs}ms` : '';
    return `${check.status || 'UNKNOWN'}${latency}`;
  }
}
