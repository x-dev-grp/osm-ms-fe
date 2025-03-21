import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseType } from '../models/base-type';
import { ApiResponse } from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class GenericTypeService {
  private baseUrl = '/api/production/types';

  constructor(private http: HttpClient) {}

  // Get all records for a specific type category
  getAllTypes(type: string): Observable<ApiResponse<BaseType[]>> {
    return this.http.get<ApiResponse<BaseType[]>>(`${this.baseUrl}/${type}`);
  }

  // Get all types regardless of category
  getAllCombinedTypes(): Observable<any> {
    return this.http.get<ApiResponse<BaseType[]>>(`${this.baseUrl}/all`);
  }

  // Get a single record by type and ID
  getType(type: string, id: number): Observable<ApiResponse<BaseType>> {
    return this.http.get<ApiResponse<BaseType>>(`${this.baseUrl}/${type}/${id}`);
  }

  // Create a new record
  createType(type: string, baseType: BaseType): Observable<any>  {
    return this.http.post<ApiResponse<BaseType>>(`${this.baseUrl}/${type}`, baseType);
  }

  // Update an existing record by type and ID
  updateType(type: string, id: number, baseType: BaseType): Observable<ApiResponse<BaseType>> {
    return this.http.put<ApiResponse<BaseType>>(`${this.baseUrl}/${type}/${id}`, baseType);
  }

  // Delete a record by type and ID
  deleteType(type: string, id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${type}/${id}`);
  }
}
