import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';
import { Pointage } from '../models/pointage.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PointageService {
  private baseUrl = environment.apiUrl + '/api/hr/pointages';

  constructor(private http: HttpClient) {}

  getAllList(): Observable<ApiResponse<Pointage>> {
    return this.http.get<ApiResponse<Pointage>>(`${this.baseUrl}/fetchAll`);
  }

  getPointage(id: string): Observable<ApiSingleResponse<Pointage>> {
    return this.http.get<ApiSingleResponse<Pointage>>(`${this.baseUrl}/fetch/${id}`);
  }

  createPointage(pointage: Pointage): Observable<ApiSingleResponse<Pointage>> {
    return this.http.post<ApiSingleResponse<Pointage>>(`${this.baseUrl}`, pointage);
  }

  updatePointage(pointage: Pointage): Observable<ApiSingleResponse<Pointage>> {
    return this.http.put<ApiSingleResponse<Pointage>>(`${this.baseUrl}`, pointage);
  }

  deletePointage(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }
}
