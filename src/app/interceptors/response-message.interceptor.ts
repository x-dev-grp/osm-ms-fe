import { Injectable, inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ToastService } from '../shared/services/toast.service';
import { extractHttpErrorMessage } from '../shared/utils/http-error.util';

@Injectable()
export class ResponseMessageInterceptor implements HttpInterceptor {
  private readonly toast = inject(ToastService);
  private readonly skipHeader = 'X-Skip-Toast';

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (this.shouldSkip(request)) {
      return next.handle(request);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (this.shouldToastMutationError(request, error)) {
          const message = extractHttpErrorMessage(error);
          if (message) {
            this.toast.error(message);
          }
        }
        return throwError(() => error);
      })
    );
  }

  private shouldToastMutationError(request: HttpRequest<unknown>, error: HttpErrorResponse): boolean {
    if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
      return false;
    }

    if ([401, 403].includes(error.status)) {
      return false;
    }

    return true;
  }

  private shouldSkip(request: HttpRequest<unknown>): boolean {
    return request.headers.has(this.skipHeader);
  }
}
