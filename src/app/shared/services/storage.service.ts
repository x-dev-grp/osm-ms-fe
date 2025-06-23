import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {ApiResponse} from "../models/api-response";
import { StorageUnitDto } from '../models/StorageUnitDto';

@Injectable({
  providedIn: 'root'
})
export class StorageUnitDtoService {
  private baseUrl = `${environment.apiUrl}/api/production/storage-units`;

  constructor(private http: HttpClient) {}

  // Get all quality control StorageUnit
  getAllStorageUnit(): Observable<ApiResponse<StorageUnitDto>> {
    return this.http.get<ApiResponse<StorageUnitDto>>(`${this.baseUrl}/fetchAll`);
  }

  // Get a StorageUnit by ID
  getStorageUnit(id: string): Observable<ApiResponse<StorageUnitDto>> {
    return this.http.get<ApiResponse<StorageUnitDto>>(`${this.baseUrl}/fetch/${id}`);
  }

  // Create a new StorageUnit
  createStorageUnit(StorageUnit: StorageUnitDto): Observable<ApiResponse<StorageUnitDto>> {
    return this.http.post<ApiResponse<StorageUnitDto>>(this.baseUrl, StorageUnit);
  }

  // Update an existing StorageUnit
  updateStorageUnit(StorageUnit: StorageUnitDto): Observable<ApiResponse<StorageUnitDto>> {
    return this.http.put<ApiResponse<StorageUnitDto>>(`${this.baseUrl}`, StorageUnit);
  }

  // Delete a StorageUnit by ID
  deleteStorageUnit(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}
