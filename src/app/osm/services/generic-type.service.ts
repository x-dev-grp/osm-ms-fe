import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseType } from '../models/base-type';
import { ApiResponse } from '../models/api-response';
import {TypeCategory} from "../models/type-category.enum";

@Injectable({
  providedIn: 'root'
})
export class GenericTypeService {
  private baseUrl = '/api/production/types';

  constructor(private http: HttpClient) {}

  // Get all records for a specific type category
  getAllTypes(type: TypeCategory): Observable<ApiResponse<BaseType>> {
    return this.http.get<ApiResponse<BaseType>>(`${this.baseUrl}/${type}`);
  }

  // Get all types regardless of category
  getAllCombinedTypes(): Observable<ApiResponse<BaseType[]>> {
    return this.http.get<ApiResponse<BaseType[]>>(`${this.baseUrl}/all`);
  }

  // Get a single record by type and ID
  getType(type: string, id: number): Observable<ApiResponse<BaseType>> {
    return this.http.get<ApiResponse<BaseType>>(`${this.baseUrl}/${type}/${id}`);
  }


  // Update an existing record by type and ID
  updateType(baseType: BaseType): Observable<ApiResponse<BaseType>> {
    const url = `${this.baseUrl}`;
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
      withCredentials: false, // Optional, set to true if using credentials
    };
    return this.http.put<ApiResponse<BaseType>>(url, baseType, httpOptions);
  }

  createType(baseType: BaseType): Observable<ApiResponse<BaseType>> {
    const url = `${this.baseUrl}`;
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
      withCredentials: false,
    };
    return this.http.post<ApiResponse<BaseType>>(url, baseType, httpOptions);
  }

  // Delete a record by type and ID
  deleteType(type: TypeCategory, id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${type}/${id}`);
  }
  // POST /api/production/types



  // GET /api/production/types/lastRevision
  getLastRevision(): Observable<ApiResponse<BaseType>> {
    return this.http.get<ApiResponse<BaseType>>(`${this.baseUrl}/lastRevision`);
  }

  // GET /api/production/types/fetchAll
  fetchAll(): Observable<ApiResponse<BaseType[]>> {
    return this.http.get<ApiResponse<BaseType[]>>(`${this.baseUrl}/fetchAll`);
  }

  // GET /api/production/types/fetchAllPageable
  fetchAllPageable(page: number, size: number): Observable<ApiResponse<BaseType>> {
    return this.http.get<ApiResponse<BaseType>>(
      `${this.baseUrl}/fetchAllPageable?page=${page}&size=${size}`
    );
  }

  // GET /api/production/types/fetch/{id}
  fetchById(id:  string): Observable<BaseType> {
    return this.http.get<BaseType>(`${this.baseUrl}/fetch/${id}`);
  }

  // GET /api/production/types/allRevision/{id}
  fetchAllRevisions(id: string): Observable<ApiResponse<BaseType>> {
    return this.http.get<ApiResponse<BaseType>>(`${this.baseUrl}/allRevision/${id}`);
  }
}
