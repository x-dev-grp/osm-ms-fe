import { Injectable, inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { ToastService } from '../shared/services/toast.service';

type ToastLevel = 'success' | 'error' | 'info' | 'warning';

@Injectable()
export class ResponseMessageInterceptor implements HttpInterceptor {
  private readonly toast = inject(ToastService);
  private readonly skipHeader = 'X-Skip-Toast';

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (this.shouldSkip(request)) {
      return next.handle(request);
    }

    return next.handle(request).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          this.handleSuccessResponse(request, event);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        this.handleErrorResponse(error);
        return throwError(() => error);
      })
    );
  }

  private handleSuccessResponse(request: HttpRequest<unknown>, response: HttpResponse<unknown>): void {
    const message = this.extractMessage(response.body);
    if (!message) {
      return;
    }

    const responseSuccess = this.extractSuccessFlag(response.body);
    if (responseSuccess === false) {
      this.showToast('warning', message);
      return;
    }

    const level: ToastLevel = request.method === 'GET' ? 'info' : 'success';
    this.showToast(level, message);
  }

  private handleErrorResponse(error: HttpErrorResponse): void {
    const message = this.extractErrorMessage(error);
    if (!message) {
      return;
    }

    this.showToast('error', message);
  }

  private showToast(level: ToastLevel, message: string): void {
    switch (level) {
      case 'success':
        this.toast.success(message);
        break;
      case 'warning':
        this.toast.warning(message);
        break;
      case 'info':
        this.toast.info(message);
        break;
      default:
        this.toast.error(message);
        break;
    }
  }

  private shouldSkip(request: HttpRequest<unknown>): boolean {
    return request.headers.has(this.skipHeader);
  }

  private extractSuccessFlag(body: unknown): boolean | null {
    if (!body || typeof body !== 'object' || !('success' in body)) {
      return null;
    }

    const value = (body as { success?: unknown }).success;
    return typeof value === 'boolean' ? value : null;
  }

  private extractMessage(body: unknown): string | null {
    if (!body) {
      return null;
    }

    if (typeof body === 'string') {
      return this.normalizeMessage(body);
    }

    if (typeof body !== 'object') {
      return null;
    }

    const candidateObject = body as Record<string, unknown>;
    return this.findFirstMessage(candidateObject);
  }

  private extractErrorMessage(error: HttpErrorResponse): string | null {
    const nestedMessage = this.extractMessage(error.error);
    if (nestedMessage) {
      return nestedMessage;
    }

    return this.normalizeMessage(error.message);
  }

  private findFirstMessage(source: Record<string, unknown>): string | null {
    const directKeys = ['message', 'error_description', 'detail', 'title'];
    for (const key of directKeys) {
      const value = source[key];
      if (typeof value === 'string') {
        const normalized = this.normalizeMessage(value);
        if (normalized) {
          return normalized;
        }
      }
    }

    const nestedKeys = ['error', 'data'];
    for (const key of nestedKeys) {
      const value = source[key];
      if (value && typeof value === 'object') {
        const nested = this.findFirstMessage(value as Record<string, unknown>);
        if (nested) {
          return nested;
        }
      }
    }

    return null;
  }

  private normalizeMessage(message: string | null | undefined): string | null {
    if (!message) {
      return null;
    }

    const trimmed = message.trim();
    return trimmed ? trimmed : null;
  }
}
