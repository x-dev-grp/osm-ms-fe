import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, shareReplay } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl + '/api/security/permission';
  private cachedPermissions$?: Observable<any>;

  fetchAll(): Observable<any> {
    if (!this.cachedPermissions$) {
      this.cachedPermissions$ = this.http.get<any>(`${this.baseUrl}/fetchAll`).pipe(
        shareReplay({ bufferSize: 1, refCount: false }),
        catchError((error) => {
          this.cachedPermissions$ = undefined;
          throw error;
        })
      );
    }
    return this.cachedPermissions$;
  }

  clearCache(): void {
    this.cachedPermissions$ = undefined;
  }
}
