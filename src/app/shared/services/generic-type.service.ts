import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response';
import { BaseType } from '../models/base-type';
import { TypeCategory } from '../models/type-category.enum';

@Injectable({
  providedIn: 'root'
})
export class GenericTypeService {
  // The backend maps /api/types, /api/production/types, and /api/finance/types
  // to the same BaseType controller/table. Writes must use one canonical endpoint.
  private readonly baseUrl = `${environment.apiUrl}/api/production/types`;

  constructor(private http: HttpClient) {}

  getAllTypes(type: TypeCategory | string): Observable<ApiResponse<BaseType>> {
    return this.http
      .get<ApiResponse<BaseType>>(`${this.baseUrl}/${type}`)
      .pipe(catchError((err) => this.handleHttp('getAllTypes', err)));
  }

  getType(id: string): Observable<ApiResponse<BaseType>> {
    return this.http
      .get<ApiResponse<BaseType>>(`${this.baseUrl}/fetch/${id}`)
      .pipe(catchError((err) => this.handleHttp('getType', err)));
  }

  createType(type: BaseType): Observable<ApiResponse<BaseType>> {
    return this.http
      .post<ApiResponse<BaseType>>(this.baseUrl, type)
      .pipe(catchError((err) => this.handleHttp('createType', err)));
  }

  updateType(type: BaseType): Observable<ApiResponse<BaseType>> {
    return this.http
      .put<ApiResponse<BaseType>>(this.baseUrl, type)
      .pipe(catchError((err) => this.handleHttp('updateType', err)));
  }

  deleteType(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/${id}`)
      .pipe(catchError((err) => this.handleHttp('deleteType', err)));
  }

  provisionDefaults(): Observable<{ success: boolean; created: number; message: string }> {
    return this.http
      .post<{ success: boolean; created: number; message: string }>(`${this.baseUrl}/provision-defaults`, {})
      .pipe(catchError((err) => this.handleHttp('provisionDefaults', err)));
  }

  private handleHttp(context: string, error: unknown): Observable<never> {
    const http = error as HttpErrorResponse;
    const status = http?.status;
    const message = http?.error ?? http?.message ?? error;
    console.error(`[GenericTypeService] ${context} [status=${status}]`, message);
    return throwError(() => error);
  }
}
