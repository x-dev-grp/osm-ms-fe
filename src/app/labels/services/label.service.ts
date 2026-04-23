import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  LabelApiResponse,
  LabelContent,
  LabelContentUpdateRequest,
  LabelExport,
  LabelGenerateRequest
} from '../models/label.model';

@Injectable({
  providedIn: 'root'
})
export class LabelService {
  private readonly baseUrl = `${environment.apiUrl}/api/ordreConditionement/labels`;

  constructor(private readonly http: HttpClient) {}

  generate(request: LabelGenerateRequest): Observable<LabelContent> {
    return this.http
      .post<LabelApiResponse<LabelContent>>(`${this.baseUrl}/generate`, request)
      .pipe(map((response) => response.data));
  }

  getById(id: string): Observable<LabelContent> {
    return this.http
      .get<LabelApiResponse<LabelContent>>(`${this.baseUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  update(id: string, request: LabelContentUpdateRequest): Observable<LabelContent> {
    return this.http
      .put<LabelApiResponse<LabelContent>>(`${this.baseUrl}/${id}`, request)
      .pipe(map((response) => response.data));
  }

  validate(id: string): Observable<LabelContent> {
    return this.http
      .post<LabelApiResponse<LabelContent>>(`${this.baseUrl}/${id}/validate`, {})
      .pipe(map((response) => response.data));
  }

  finalize(id: string): Observable<LabelContent> {
    return this.http
      .post<LabelApiResponse<LabelContent>>(`${this.baseUrl}/${id}/finalize`, {})
      .pipe(map((response) => response.data));
  }

  export(id: string): Observable<LabelExport> {
    return this.http
      .get<LabelApiResponse<LabelExport>>(`${this.baseUrl}/${id}/export`)
      .pipe(map((response) => response.data));
  }
}
