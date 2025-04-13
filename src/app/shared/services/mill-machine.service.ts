import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
 import {ApiResponse} from "../models/api-response";
import { MillMachine } from '../models/millMachine';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MillMachineService {
  private baseUrl = '/api/production/millers';

  constructor(private http: HttpClient) {}

  // Get all MillMachines
  getAllMillMachines(): Observable<MillMachine[]> {
    return this.http.get<ApiResponse<MillMachine>>(`${this.baseUrl}/fetchAll`).pipe(
      map((response) => {
        // 'response.data' is your array of MillMachine-like objects,
        // but lastMaintenanceDate/nextMaintenanceDate might be arrays like [2025,3,31,17,0,3,551000000].
        return response.data.map((mm) => {
          mm.lastMaintenanceDate = this.parseDateArray(mm.lastMaintenanceDate);
          mm.nextMaintenanceDate = this.parseDateArray(mm.nextMaintenanceDate);
          return mm;
        });
      })
    );
  }
  private parseDateArray(value: any): Date | undefined {
    // If not an array or too short, skip
    if (!Array.isArray(value) || value.length < 6) {
      return undefined;
    }
    // [year, month(1-based), day, hour, minute, second, nano]
    const [year, month, day, hour, minute, second] = value;
    // Convert the 1-based month from the backend to 0-based for JS
    return new Date(year, month - 1, day, hour, minute, second);
  }
  // Get MillMachine by id
  getMillMachine(id: number): Observable<ApiResponse<MillMachine>> {
    return this.http.get<ApiResponse<MillMachine>>(`${this.baseUrl}/${id}`);
  }

  // Add a new MillMachine
  addMillMachine(MillMachine: MillMachine): Observable<ApiResponse<MillMachine>> {
    return this.http.post<ApiResponse<MillMachine>>(`${this.baseUrl}`, MillMachine);
  }

  // Update an existing MillMachine
  updateMillMachine( MillMachine: MillMachine): Observable<ApiResponse<MillMachine>> {
    return this.http.put<ApiResponse<MillMachine>>(`${this.baseUrl}`, MillMachine);
  }

  // Optionally, if a delete endpoint exists, you can implement it here
  deleteMillMachine(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}
