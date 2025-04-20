import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response';
import { Transporter } from '../models/Transporter';

@Injectable({
  providedIn: 'root'
})
export class TransporterService {
  private baseUrl = '/api/production/transporters';

  constructor(private http: HttpClient) {}

  // Get all transporters
  getAllTransporters(): Observable<ApiResponse<Transporter>> {
    return this.http.get<ApiResponse<Transporter>>(`${this.baseUrl}/fetchAll`);
  }

  // Get transporter by id
  getTransporter(id: number): Observable<ApiResponse<Transporter>> {
    return this.http.get<ApiResponse<Transporter>>(`${this.baseUrl}/${id}`);
  }

  // Add a new transporter
  addTransporter(transporter: Transporter): Observable<ApiResponse<Transporter>> {
    return this.http.post<ApiResponse<Transporter>>(`${this.baseUrl}`, transporter);
  }

  // Update an existing transporter
  updateTransporter(id: string, transporter: Transporter): Observable<ApiResponse<Transporter>> {
    return this.http.put<ApiResponse<Transporter>>(`${this.baseUrl}/${id}`, transporter);
  }

  // Optionally, if a delete endpoint exists, you can implement it here
  // deleteTransporter(id: number): Observable<ApiResponse<void>> {
  //   return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  // }
}
