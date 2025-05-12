import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PlanningSaveRequest, PlanningSaveResponse } from '../models/planning-save.dto';
import { GlobalLot } from '../../reception/components/planning/planning.component';

@Injectable({ providedIn: 'root' })
export class PlanningService {
  constructor(private http: HttpClient) {}

  save(req: PlanningSaveRequest): Observable<PlanningSaveResponse> {
    return this.http.post<PlanningSaveResponse>('/api/plannings', req);
  }

  createGlobalLot(body: { millMachineId?: string; receptionIds: string[] }) {
    // TODO replace URL when the real endpoint is live
    // return this.http.post<GlobalLot>('/api/global-lots', body);
    console.log(body);
  }
}
