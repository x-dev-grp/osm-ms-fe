import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PlanningSaveRequest } from '../../reception/components/planning/planning.component';
import { environment } from '../../../environments/environment';

// adjust the path to your models

@Injectable({ providedIn: 'root' })
export class PlanningService {
  API_BASE_URL =environment.apiUrl +  '/api/production/planning';
  constructor(private http: HttpClient) {}

  /* ───── planning CRUD ───────────────────────────────────────── */

  /** GET current board snapshot */
  getPlanning(): Observable<PlanningSaveRequest> {
    return this.http.get<PlanningSaveRequest>(`${this.API_BASE_URL}`);
  }

  /** POST/PUT the whole plan */
  savePlanning(body: PlanningSaveRequest): Observable<string> {
    return this.http.post(`${this.API_BASE_URL}`, body, { responseType: 'text' });
  }

  /* ───── NEW: mark lot(s) completed ──────────────────────────── */

  /** PATCH one single LOT’s status → COMPLETED */
  completeLot(lotNumber: string): Observable<void> {
    return this.http.patch<void>(`${this.API_BASE_URL}/lots/${lotNumber}/completed`, {});
  }

  /** PATCH **all** lots in a global lot → COMPLETED */
  completeGlobalLot(globalLotNumber: string): Observable<void> {
    return this.http.patch<void>(`${this.API_BASE_URL}/globalLots/${globalLotNumber}/completed`, {});
  }
}
