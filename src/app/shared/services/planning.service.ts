import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PlanningSaveRequest } from '../models/planningDTOS';

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
  API_BASE_URL = environment.apiUrl + '/api/production/planning';

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
  completeLotWithDetails(lotNumber: string, oilQuantity: number, rendement: number, unpaidPrice: number,autoSetStorage:boolean): Observable<string> {                       // return plain text
     const payload = { oilQuantity, rendement, unpaidPrice,autoSetStorage };
    return this.http.post(
      `${this.API_BASE_URL}/lots/${lotNumber}/completed`,
      payload,
      { responseType: 'text' }                  // 👈 expect text, not JSON
    );
  }
  /** POST all lots in a global lot → COMPLETED, with oilQuantity and rendement */
  completeGlobalLotWithDetails(globalLotNumber: string, childLots: ChildLotCompletionDto[]): Observable<string> {
    console.log('[SERVICE] Completing global lot with details:', { globalLotNumber, childLots });

    return this.http.post(`${this.API_BASE_URL}/globalLots/${globalLotNumber}/completed`, childLots,
      { responseType: 'text' }                  // 👈 expect text, not JSON
    );
  }
}
