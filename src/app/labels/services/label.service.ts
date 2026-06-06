import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  LabelApiResponse,
  LabelContentDto,
  LabelContentUpdateRequestDto,
  LabelExportDto,
  LabelGenerateRequestDto
} from '../models/label.model';

@Injectable({
  providedIn: 'root'
})
export class LabelService {
  private readonly baseUrl = `${environment.apiUrl}/api/ordreConditionement/labels`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<LabelContentDto[]> {
    return this.http
      .get<LabelApiResponse<LabelContentDto[]>>(this.baseUrl)
      .pipe(map((response) => response.data ?? []));
  }

  generate(request: LabelGenerateRequestDto): Observable<LabelContentDto> {
    return this.http
      .post<LabelApiResponse<LabelContentDto>>(`${this.baseUrl}/generate`, request)
      .pipe(map((response) => response.data));
  }

  getById(id: string): Observable<LabelContentDto> {
    return this.http
      .get<LabelApiResponse<LabelContentDto>>(`${this.baseUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  getByProductId(productId: string): Observable<LabelContentDto[]> {
    return this.http
      .get<LabelApiResponse<LabelContentDto[]>>(`${this.baseUrl}/product/${productId}`)
      .pipe(map((response) => response.data ?? []));
  }

  update(id: string, request: LabelContentUpdateRequestDto): Observable<LabelContentDto> {
    return this.http
      .put<LabelApiResponse<LabelContentDto>>(`${this.baseUrl}/${id}`, request)
      .pipe(map((response) => response.data));
  }

  markAsDraft(id: string): Observable<LabelContentDto> {
    return this.http
      .post<LabelApiResponse<LabelContentDto>>(`${this.baseUrl}/${id}/draft`, {})
      .pipe(map((response) => response.data));
  }

  finalize(id: string): Observable<LabelContentDto> {
    return this.http
      .post<LabelApiResponse<LabelContentDto>>(`${this.baseUrl}/${id}/finalize`, {})
      .pipe(map((response) => response.data));
  }

  export(id: string): Observable<LabelExportDto> {
    return this.http
      .get<LabelApiResponse<LabelExportDto>>(`${this.baseUrl}/${id}/export`)
      .pipe(map((response) => response.data));
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<LabelApiResponse<void>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => void 0));
  }
}
