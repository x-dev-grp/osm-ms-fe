import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';
import { PublicHoliday } from '../models/public-holiday.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PublicHolidayService {
  private baseUrl = environment.apiUrl + '/api/hr/public-holidays';

  constructor(private http: HttpClient) {}

  getAllList(): Observable<ApiResponse<PublicHoliday>> {
    return this.http.get<ApiResponse<PublicHoliday>>(`${this.baseUrl}/fetchAll`);
  }

  getById(id: string): Observable<ApiSingleResponse<PublicHoliday>> {
    return this.http.get<ApiSingleResponse<PublicHoliday>>(`${this.baseUrl}/fetch/${id}`);
  }

  create(entity: PublicHoliday): Observable<ApiSingleResponse<PublicHoliday>> {
    return this.http.post<ApiSingleResponse<PublicHoliday>>(this.baseUrl, entity);
  }

  update(entity: PublicHoliday): Observable<ApiSingleResponse<PublicHoliday>> {
    return this.http.put<ApiSingleResponse<PublicHoliday>>(this.baseUrl, entity);
  }

  delete(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }
}
