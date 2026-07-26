import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';
import { WorkSchedule } from '../models/work-schedule.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WorkScheduleService {
  private baseUrl = environment.apiUrl + '/api/hr/work-schedules';

  constructor(private http: HttpClient) {}

  getAllList(): Observable<ApiResponse<WorkSchedule>> {
    return this.http.get<ApiResponse<WorkSchedule>>(`${this.baseUrl}/fetchAll`);
  }

  getById(id: string): Observable<ApiSingleResponse<WorkSchedule>> {
    return this.http.get<ApiSingleResponse<WorkSchedule>>(`${this.baseUrl}/fetch/${id}`);
  }

  create(entity: WorkSchedule): Observable<ApiSingleResponse<WorkSchedule>> {
    return this.http.post<ApiSingleResponse<WorkSchedule>>(this.baseUrl, entity);
  }

  update(entity: WorkSchedule): Observable<ApiSingleResponse<WorkSchedule>> {
    return this.http.put<ApiSingleResponse<WorkSchedule>>(this.baseUrl, entity);
  }

  delete(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }
}
