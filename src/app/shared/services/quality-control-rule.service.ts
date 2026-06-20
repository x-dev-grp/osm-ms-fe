import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { QualityControlRule } from '../models/quality-control-rule';
import { ApiResponse } from '../models/api-response';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class QualityControlRuleService {
  private baseUrl = `${environment.apiUrl}/api/production/qualitycontrolrules`;

  constructor(private http: HttpClient) {}

  // Get all quality control rules
  getAllRules(): Observable<ApiResponse<QualityControlRule>> {
    return this.http.get<ApiResponse<QualityControlRule>>(`${this.baseUrl}/fetchAll`);
  }

  getAllOilRules(): Observable<ApiResponse<QualityControlRule>> {
    return this.http.get<ApiResponse<QualityControlRule>>(`${this.baseUrl}/fetchAll`).pipe(
      map((response) => ({
        ...response,
        data: (response?.data || []).filter((rule) => rule?.oilQc === true)
      }))
    );
  }

  getAllOliveRules(): Observable<ApiResponse<QualityControlRule>> {
    return this.http.get<ApiResponse<QualityControlRule>>(`${this.baseUrl}/fetchAll`).pipe(
      map((response) => ({
        ...response,
        data: (response?.data || []).filter((rule) => rule?.oilQc !== true)
      }))
    );
  }

  // Get a rule by ID
  getRule(id: string): Observable<ApiResponse<QualityControlRule>> {
    return this.http.get<ApiResponse<QualityControlRule>>(`${this.baseUrl}/fetch/${id}`);
  }

  // Create a new rule
  createRule(rule: QualityControlRule): Observable<ApiResponse<QualityControlRule>> {
    return this.http.post<ApiResponse<QualityControlRule>>(this.baseUrl, rule);
  }

  // Update an existing rule
  updateRule(rule: QualityControlRule): Observable<ApiResponse<QualityControlRule>> {
    return this.http.put<ApiResponse<QualityControlRule>>(`${this.baseUrl}`, rule);
  }

  // Delete a rule by ID
  deleteRule(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }

  provisionDefaults(): Observable<{ success: boolean; created: number; message: string }> {
    return this.http.post<{ success: boolean; created: number; message: string }>(`${this.baseUrl}/provision-defaults`, {});
  }
}
