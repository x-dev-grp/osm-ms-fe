import { HttpClient } from '@angular/common/http';
import { Parameter } from '../models/Parameter';
import { Observable, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { ApiResponse } from '../models/api-response';
import { environment } from '../../../environments/environment';
import { map, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AppParameterService {
  private baseUrl = environment.apiUrl + '/api/production/parameter';
  private localStorageKey = 'osm_app_parameters';

  constructor(private http: HttpClient) {}

  /** Fetch all parameters from API and cache */
  getAll(): Observable<ApiResponse<Parameter>> {
    return this.http.get<ApiResponse<Parameter>>(`${this.baseUrl}/fetchAll`).pipe(
      tap(res => {
        const cache: Record<string, Parameter> = {};
        res.data.forEach(p => (cache[p.code] = p));
        localStorage.setItem(this.localStorageKey, JSON.stringify(cache));
      })
    );
  }

  /** Get a parameter by its code (from cache or API) */
  getByCode(code: string): Observable<Parameter> {
    const cached = this.getCachedParam(code);
    if (cached) return of(cached);

    return this.http.get<ApiResponse<Parameter>>(`${this.baseUrl}/code/${code}`).pipe(
      map(res => {
        // this.setCachedParam(code, res.data[0]);
        return res.data[0];
      })
    );
  }

  /** Update a parameter value and sync with localStorage */
  updateValue(param: Parameter): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}`, param).pipe(
      tap(res => {
         let updated = res.data;
        this.setCachedParam(updated );
      })
    );
  }

  // LocalStorage utilities
  private getCachedParam(code: string): Parameter | null {
    const raw = localStorage.getItem(this.localStorageKey);
    if (!raw) return null;
    try {
      const parsed: Record<string, Parameter> = JSON.parse(raw);
      return parsed[code] ?? null;
    } catch {
      return null;
    }
  }

  private setCachedParam( param: Parameter): void {
    let cache: Record<string, Parameter> = {};
    try {
      const raw = localStorage.getItem(this.localStorageKey);
      if (raw) cache = JSON.parse(raw);
    } catch {}
    cache[param.code] = param;
    localStorage.setItem(this.localStorageKey, JSON.stringify(cache));
  }
}
