import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PermissionCatalogStatus, PermissionCatalogSyncResponse } from '../models/permission-catalog.model';

@Injectable({ providedIn: 'root' })
export class PermissionCatalogAdminService {
  private readonly baseUrl = `${environment.apiUrl}/api/security/permission`;

  constructor(private http: HttpClient) {}

  getCatalogStatus(): Observable<PermissionCatalogStatus> {
    return this.http.get<PermissionCatalogStatus>(`${this.baseUrl}/catalog-status`);
  }

  syncCatalog(): Observable<PermissionCatalogSyncResponse> {
    return this.http.post<PermissionCatalogSyncResponse>(`${this.baseUrl}/sync-catalog`, {});
  }
}
