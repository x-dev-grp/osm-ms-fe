import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiSingleResponse } from '../../shared/models/api-response';
import { TranslateService } from '@ngx-translate/core';

export type DayImportRowStatus = 'CREATE' | 'LINK_EXISTING' | 'SKIP_DUPLICATE' | 'ERROR' | 'WARNING';

export interface DayImportFieldError {
  field: string;
  code: string;
  message: string;
}

export interface DayImportRow {
  sheet: string;
  rowNumber: number;
  businessKey?: string;
  status: DayImportRowStatus;
  message?: string;
  stockDelta?: number;
  lotNumber?: string;
  fieldErrors?: DayImportFieldError[];
}

export interface DayImportReport {
  runId?: string;
  outcome?: 'PREVIEW' | 'COMMITTED' | 'REPLAYED' | 'REJECTED';
  businessDate?: string;
  canCommit: boolean;
  validCount: number;
  invalidCount: number;
  totalRows: number;
  statusCounts?: Record<string, number>;
  stockInTotal?: number;
  stockOutTotal?: number;
  expenseTotal?: number;
  rows: DayImportRow[];
}

export interface DayImportDriveStatus {
  enabled?: boolean;
  configured?: boolean;
  oauthConfigured?: boolean;
  connected?: boolean;
  googleAccountEmail?: string;
  lastSyncAt?: string;
  lastResult?: string;
  lastError?: string;
  lastStatus?: string;
  lastMessage?: string;
  folderId?: string;
  cron?: string;
  pendingCount?: number;
  failedCount?: number;
  processedCount?: number;
}

export type DayImportReportFormat = 'xlsx' | 'csv';

@Injectable({ providedIn: 'root' })
export class ReceptionImportService {
  private readonly baseUrl = `${environment.apiUrl}/api/production/import/day`;

  constructor(private readonly http: HttpClient, private readonly translate: TranslateService) {}

  downloadTemplate(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/template`, {
      params: new HttpParams().set('lang', this.workbookLanguage()),
      responseType: 'blob'
    });
  }

  downloadSample(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/sample`, {
      params: new HttpParams().set('lang', this.workbookLanguage()),
      responseType: 'blob'
    });
  }

  private workbookLanguage(): string {
    return this.translate.currentLang || this.translate.getBrowserLang() || 'fr';
  }

  dryRun(file: File): Observable<DayImportReport> {
    return this.http
      .post<ApiSingleResponse<DayImportReport>>(`${this.baseUrl}/dry-run`, this.toFormData(file))
      .pipe(map((res) => this.unwrapReport(res)));
  }

  dryRunReport(file: File, format: DayImportReportFormat): Observable<Blob> {
    const params = new HttpParams().set('format', format);
    return this.http.post(`${this.baseUrl}/dry-run/report`, this.toFormData(file), {
      params,
      responseType: 'blob'
    });
  }

  commit(file: File, previewId: string): Observable<DayImportReport> {
    return this.http
      .post<
        ApiSingleResponse<DayImportReport>
      >(`${this.baseUrl}/commit`, this.toFormData(file), { params: new HttpParams().set('previewId', previewId) })
      .pipe(map((res) => this.unwrapReport(res)));
  }

  run(id: string): Observable<DayImportReport> {
    return this.http
      .get<ApiSingleResponse<DayImportReport>>(`${this.baseUrl}/runs/${encodeURIComponent(id)}`)
      .pipe(map((res) => this.unwrapReport(res)));
  }

  savedReport(id: string, format: DayImportReportFormat): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/runs/${encodeURIComponent(id)}/report`, {
      params: new HttpParams().set('format', format),
      responseType: 'blob'
    });
  }

  driveSync(): Observable<DayImportDriveStatus> {
    return this.http
      .post<ApiSingleResponse<DayImportDriveStatus>>(`${this.baseUrl}/drive/sync`, {})
      .pipe(map((res) => this.unwrapDrive(res)));
  }

  driveStatus(): Observable<DayImportDriveStatus> {
    return this.http.get<ApiSingleResponse<DayImportDriveStatus>>(`${this.baseUrl}/drive/status`).pipe(map((res) => this.unwrapDrive(res)));
  }

  driveAuthorizeUrl(): Observable<string> {
    return this.http.get<ApiSingleResponse<{ authorizeUrl: string }>>(`${this.baseUrl}/drive/oauth/authorize`).pipe(
      map((res) => {
        if (!res?.success || !res.data?.authorizeUrl) {
          throw new Error(res?.message || 'Unable to start Google Drive login');
        }
        return res.data.authorizeUrl;
      })
    );
  }

  driveDisconnect(): Observable<DayImportDriveStatus> {
    return this.http
      .post<ApiSingleResponse<DayImportDriveStatus>>(`${this.baseUrl}/drive/oauth/disconnect`, {})
      .pipe(map((res) => this.unwrapDrive(res)));
  }

  private toFormData(file: File): FormData {
    const fd = new FormData();
    fd.append('file', file);
    return fd;
  }

  private unwrapReport(res: ApiSingleResponse<DayImportReport>): DayImportReport {
    if (!res?.success || !res.data) {
      throw new Error(res?.message || 'Import request failed');
    }
    return res.data;
  }

  private unwrapDrive(res: ApiSingleResponse<DayImportDriveStatus>): DayImportDriveStatus {
    if (!res?.success || !res.data) throw new Error(res?.message || 'Drive request failed');
    const status = res.data;
    return {
      ...status,
      lastStatus: status.lastResult || status.lastStatus,
      lastMessage: status.lastError || status.lastMessage
    };
  }
}
