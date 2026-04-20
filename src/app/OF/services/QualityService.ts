import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from 'src/app/shared/models/api-response'; // adaptez selon votre structure
import { QCControlPoint } from '../models/QCControlPoint.model';
import {QCPlan} from "../models/QCPlan.model";
import {QCResult} from "../models/QCResult.model";

@Injectable({ providedIn: 'root' })
export class QualityService {
  private apiUrl = 'http://localhost:8084/api/ordreConditionement/qualite'; // via gateway

  constructor(private http: HttpClient) {}

  createPlan(ofId: string, titre: string): Observable<ApiResponse<QCPlan>> {
    return this.http.post<ApiResponse<QCPlan>>(`${this.apiUrl}/plans/of/${ofId}/create?titre=${titre}`, {});
  }

  addControlPoint(planId: string, point: QCControlPoint): Observable<ApiResponse<QCControlPoint>> {
    return this.http.post<ApiResponse<QCControlPoint>>(`${this.apiUrl}/plans/${planId}/points/addControlPoint`, point);
  }

  getPointsForOF(ofId: string): Observable<ApiResponse<QCControlPoint[]>> {
    return this.http.get<ApiResponse<QCControlPoint[]>>(`${this.apiUrl}/plans/of/${ofId}/points/active`);
  }
  submitResult(result: QCResult): Observable<ApiResponse<QCResult>> {
    return this.http.post<ApiResponse<QCResult>>(`${this.apiUrl}/resultats/add`, result);
  }

  getHistoryByOF(ofId: string): Observable<ApiResponse<QCResult[]>> {
    return this.http.get<ApiResponse<QCResult[]>>(`${this.apiUrl}/resultats/of/${ofId}/historique`);
  }

  unblockOF(ofId: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.apiUrl}/resultats/of/${ofId}/debloquer`, {});
  }
  getPlanByOfId(ofId: string): Observable<ApiResponse<QCPlan>> {
    return this.http.get<ApiResponse<QCPlan>>(`${this.apiUrl}/plans/of/${ofId}`);
  }
  deleteControlPoint(pointId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/plans/points/${pointId}`);
  }
  getLastResultsByPoint(ofId: string): Observable<ApiResponse<QCResult[]>> {
    return this.getHistoryByOF(ofId);
  }

}
