import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
 import { QualityControlRule } from '../models/quality-control-rule';
import {ApiResponse} from "../models/api-response";

@Injectable({
  providedIn: 'root'
})
export class QualityControlRuleService {
  private baseUrl = '/api/production/qualitycontrolrules';

  constructor(private http: HttpClient) {}

  // Get all quality control rules
  getAllRules(): Observable<ApiResponse<QualityControlRule[]>> {
    return this.http.get<ApiResponse<QualityControlRule[]>>(this.baseUrl);
  }

  // Get a rule by ID
  getRule(id: number): Observable<ApiResponse<QualityControlRule>> {
    return this.http.get<ApiResponse<QualityControlRule>>(`${this.baseUrl}/${id}`);
  }

  // Create a new rule
  createRule(rule: QualityControlRule): Observable<ApiResponse<QualityControlRule>> {
    return this.http.post<ApiResponse<QualityControlRule>>(this.baseUrl, rule);
  }

  // Update an existing rule
  updateRule(id: number, rule: QualityControlRule): Observable<ApiResponse<QualityControlRule>> {
    return this.http.put<ApiResponse<QualityControlRule>>(`${this.baseUrl}/${id}`, rule);
  }

  // Delete a rule by ID
  deleteRule(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}
