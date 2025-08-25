import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pointage } from '../model/pointage.model';
import {environment} from "../../../environments/environment";
import {ApiResponse} from "../../shared/models/api-response";

export interface PointageRequest {
  employeeId: string|undefined;
  date: string;
  checkIn?: Date;
  checkOut?: Date;
}



@Injectable({
  providedIn: 'root'
})
export class PointageService {
  private baseUrl = `${environment.apiUrl}/api/hr/pointage`;
  constructor(private http: HttpClient) {}

  // Marquer l'entrée d'un employé
  markEntry(date: string, checkInTime: Date, employeeId?: string): Observable<ApiResponse<Pointage>> {
    const request: PointageRequest = {
      employeeId,
      date,
      checkIn: checkInTime
    };

    return this.http.post<ApiResponse<Pointage>>(`${this.baseUrl}/pointages/mark-entry`, request);
  }

  // Marquer la sortie d'un employé
  markExit(employeeId: string, date: string, checkOutTime: Date): Observable<ApiResponse<Pointage>> {
    const request: PointageRequest = {
      employeeId,
      date,
      checkOut: checkOutTime
    };

    return this.http.put<ApiResponse<Pointage>>(`${this.baseUrl}/pointages/mark-exit`, request);
  }

  // Obtenir les pointages d'un employé pour une date
  getPointageByEmployeeAndDate(employeeId: number, date: string): Observable<ApiResponse<Pointage>> {
    return this.http.get<ApiResponse<Pointage>>(`${this.baseUrl}/pointages/employee/${employeeId}/date/${date}`);
  }

  // Obtenir tous les pointages pour une date
  getAllPointagesByDate(date: string): Observable<ApiResponse<Pointage[]>> {
    return this.http.get<ApiResponse<Pointage[]>>(`${this.baseUrl}/pointages/date/${date}`);
  }

  // Créer un nouveau pointage
  createPointage(pointageData: PointageRequest): Observable<ApiResponse<Pointage>> {
    return this.http.post<ApiResponse<Pointage>>(`${this.baseUrl}/pointages`, pointageData);
  }

  // Mettre à jour un pointage existant
  updatePointage(pointageId: number, pointageData: Partial<PointageRequest>): Observable<ApiResponse<Pointage>> {
    return this.http.put<ApiResponse<Pointage>>(`${this.baseUrl}/pointages/${pointageId}`, pointageData);
  }
}
