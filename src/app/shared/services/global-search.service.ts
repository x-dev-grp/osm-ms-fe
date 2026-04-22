import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GlobalCodeSearchResponse } from '../models/qr-models';

@Injectable({
  providedIn: 'root'
})
export class GlobalSearchService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  searchByCode(code: string): Observable<GlobalCodeSearchResponse> {
    return this.http.get<GlobalCodeSearchResponse>(`${this.baseUrl}/api/search/by-code`, {
      params: { code }
    });
  }
}
