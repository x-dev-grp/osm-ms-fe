import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';
import { Timesheet } from '../models/timesheet.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TimesheetService {
  private baseUrl = environment.apiUrl + '/api/hr/timesheets';

  constructor(private http: HttpClient) {}

  getAllList(): Observable<ApiResponse<Timesheet>> {
    return this.http.get<ApiResponse<Timesheet>>(`${this.baseUrl}/fetchAll`);
  }

  getById(id: string): Observable<ApiSingleResponse<Timesheet>> {
    return this.http.get<ApiSingleResponse<Timesheet>>(`${this.baseUrl}/fetch/${id}`);
  }

  create(entity: Timesheet): Observable<ApiSingleResponse<Timesheet>> {
    return this.http.post<ApiSingleResponse<Timesheet>>(this.baseUrl, entity);
  }

  update(entity: Timesheet): Observable<ApiSingleResponse<Timesheet>> {
    return this.http.put<ApiSingleResponse<Timesheet>>(this.baseUrl, entity);
  }

  delete(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }
}
