import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AdminSetting,
  AdminSettingsListResponse,
  AdminSettingsStatus,
  MailTestRequest,
  MailTestResponse,
  NotificationTestRequest,
  NotificationTestResponse,
  PagedAuditResponse,
  RotateSecretRequest,
  UpdateSettingRequest
} from '../models/admin-setting.model';

@Injectable({ providedIn: 'root' })
export class AdminSettingsService {
  private readonly baseUrl = `${environment.apiUrl}/api/admin/settings`;

  constructor(private http: HttpClient) {}

  list(): Observable<AdminSettingsListResponse> {
    return this.http.get<AdminSettingsListResponse>(this.baseUrl);
  }

  get(key: string): Observable<AdminSetting> {
    return this.http.get<AdminSetting>(`${this.baseUrl}/${encodeURIComponent(key)}`);
  }

  update(key: string, request: UpdateSettingRequest): Observable<AdminSetting> {
    return this.http.put<AdminSetting>(`${this.baseUrl}/${encodeURIComponent(key)}`, request);
  }

  rotateSecret(key: string, request: RotateSecretRequest): Observable<AdminSetting> {
    return this.http.post<AdminSetting>(`${this.baseUrl}/${encodeURIComponent(key)}/rotate-secret`, request);
  }

  reload(): Observable<AdminSettingsStatus> {
    return this.http.post<AdminSettingsStatus>(`${this.baseUrl}/reload`, {});
  }

  getStatus(): Observable<AdminSettingsStatus> {
    return this.http.get<AdminSettingsStatus>(`${this.baseUrl}/status`);
  }

  sendMailTest(request: MailTestRequest): Observable<MailTestResponse> {
    return this.http.post<MailTestResponse>(`${this.baseUrl}/mail/test`, request);
  }

  sendNotificationTest(request: NotificationTestRequest): Observable<NotificationTestResponse> {
    return this.http.post<NotificationTestResponse>(`${this.baseUrl}/notifications/test`, request);
  }

  listAudit(key?: string, page = 0, size = 20): Observable<PagedAuditResponse> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (key) {
      params = params.set('key', key);
    }
    return this.http.get<PagedAuditResponse>(`${this.baseUrl}/audit`, { params });
  }
}
