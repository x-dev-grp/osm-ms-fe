import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ProductionGenealogy } from '../models/production-genealogy.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class ProductionTraceabilityService {
  private readonly baseUrl = `${environment.apiUrl}/api/production/traceability`;

  constructor(private readonly http: HttpClient) {}

  getGenealogy(anchorId: string): Observable<ProductionGenealogy> {
    return this.http
      .get<ApiResponse<ProductionGenealogy>>(`${this.baseUrl}/genealogy/${anchorId}`)
      .pipe(map((response) => response.data));
  }
}
