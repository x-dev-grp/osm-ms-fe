import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  /**
   * Backend controller:
   * @RequestMapping("/api/analytics/cond")
   *
   * If environment.apiUrl = '/api', use:
   * '/conditioning/api/analytics/cond'
   *
   * If your gateway does not use '/conditioning', replace this with:
   * `${environment.apiUrl}/analytics/cond`
   */
  private readonly apiUrl = `${environment.apiUrl}/api/ordreConditionement/analytics`;



  constructor(private http: HttpClient) { }

  // =========================
  // 23.1 Rendement des OF
  // =========================

  getOfYields(request: any = {}): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/reports/yields`, request);
  }

  exportOfYieldsPdf(request: any = {}): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/reports/yields/pdf`, request, {
      responseType: 'blob'
    });
  }

  // =========================
  // 23.2 Rapport global OF
  // =========================

  getGlobalOf(request: any = {}): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reports/global`, request);
  }

  exportGlobalOfPdf(request: any = {}): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/reports/global/pdf`, request, {
      responseType: 'blob'
    });
  }

  // =========================
  // 23.3 Rapport qualité
  // =========================

  getQuality(request: any = {}): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/reports/quality`, request);
  }

  exportQualityPdf(request: any = {}): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/reports/quality/pdf`, request, {
      responseType: 'blob'
    });
  }

  // =========================
  // 23.4 Ecarts Nomenclatures
  // =========================

  getBomGap(request: any = {}): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/reports/bom-gap`, request);
  }

  exportBomGapPdf(request: any = {}): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/reports/bom-gap/pdf`, request, {
      responseType: 'blob'
    });
  }

  // =========================
  // 23.5 Rapport filtrage
  // =========================

  getFiltration(request: any = {}): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/reports/filtration`, request);
  }

  exportFiltrationPdf(request: any = {}): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/reports/filtration/pdf`, request, {
      responseType: 'blob'
    });
  }
}
