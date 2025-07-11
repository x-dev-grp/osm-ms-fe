import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PlanningSaveRequest } from '../../reception/components/planning/planning.component';
import { environment } from '../../../environments/environment';

/**
 * DTO for completing a child lot in a global lot
 */
export interface ChildLotCompletionDto {
  lotNumber: string;
  oilQuantity: number;
  rendement: number;
  unpaidPrice: number;
}

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



  /** POST one single LOT's status → COMPLETED, with oilQuantity and rendement */
  completeLotWithDetails(lotNumber: string, oilQuantity: number, rendement: number, unpaidPrice: number): Observable<void> {
    return this.http.post<void>(
      `${this.API_BASE_URL}/lots/${lotNumber}/completed`,
      { oilQuantity, rendement,unpaidPrice }
    );
  }
  /** POST all lots in a global lot → COMPLETED, with oilQuantity and rendement */
  completeGlobalLotWithDetails(globalLotNumber: string, childLots: ChildLotCompletionDto[]): Observable<void> {
    return this.http.post<void>(
      `${this.API_BASE_URL}/globalLots/${globalLotNumber}/completed`,
      childLots
    );
  }
}
