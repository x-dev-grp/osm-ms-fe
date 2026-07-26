import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiSingleResponse } from '../../shared/models/api-response';
import { environment } from '../../../environments/environment';

export interface HrDashboardStats {
  totalEmployees?: number;
  activeEmployees?: number;
  presentToday?: number;
  absentToday?: number;
  onLeave?: number;
  pendingLeaveRequests?: number;
  contractsExpiringSoon?: number;
  attendanceAnomalies?: number;
  payrollStatus?: string;
  complianceScore?: number;
  criticalComplianceIssues?: number;
}

export interface ComplianceSummary {
  score?: number;
  criticalCount?: number;
  warningCount?: number;
  openCount?: number;
  totalOpen?: number;
  highCount?: number;
  infoCount?: number;
}

export interface ComplianceViolation {
  id?: string;
  code?: string;
  severity?: string;
  entityType?: string;
  entityId?: string;
  employeeId?: string;
  title?: string;
  description?: string;
  whyItMatters?: string;
  recommendedAction?: string;
  relatedRuleCode?: string;
  status?: string;
  detectedAt?: string;
}

export interface AgentQueryRequest {
  prompt: string;
  confirmed?: boolean;
  confirmWriteActions?: boolean;
  toolHint?: string;
}

export interface AgentQueryResponse {
  answer?: string;
  message?: string;
  confirmationRequired?: boolean;
  requiresConfirmation?: boolean;
  toolCalled?: string;
  intent?: string;
  success?: boolean;
  data?: unknown;
  actionsTaken?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class HrOpsService {
  private baseUrl = environment.apiUrl + '/api/hr';

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<ApiSingleResponse<HrDashboardStats>> {
    return this.http.get<ApiSingleResponse<HrDashboardStats>>(`${this.baseUrl}/dashboard/stats`);
  }

  getComplianceSummary(): Observable<ApiSingleResponse<ComplianceSummary>> {
    return this.http.get<ApiSingleResponse<ComplianceSummary>>(`${this.baseUrl}/compliance/summary`);
  }

  scanCompliance(): Observable<ApiSingleResponse<ComplianceViolation[]>> {
    return this.http.post<ApiSingleResponse<ComplianceViolation[]>>(`${this.baseUrl}/compliance/scan`, {});
  }

  queryAgent(request: AgentQueryRequest): Observable<ApiSingleResponse<AgentQueryResponse>> {
    return this.http.post<ApiSingleResponse<AgentQueryResponse>>(`${this.baseUrl}/agent/query`, request);
  }
}
