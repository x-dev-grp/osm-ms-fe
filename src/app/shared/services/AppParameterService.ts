import { HttpClient } from '@angular/common/http';
import { Parameter } from '../models/Parameter';
import { Observable, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { ApiResponse } from '../models/api-response';
import { environment } from '../../../environments/environment';
import { map, switchMap, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AppParameterService {
  private baseUrl = environment.apiUrl + '/api/production/parameter';
  private localStorageKey = 'osm_app_parameters';

  constructor(private http: HttpClient) {}

  /** Fetch all parameters from API and cache. Backend ensures default params exist. */
  getAll(): Observable<ApiResponse<Parameter>> {
    return this.http.get<ApiResponse<Parameter>>(`${this.baseUrl}/fetchAll`).pipe(
      tap((res) => this.cacheAll(res.data))
    );
  }

  /** Get a parameter by code. Backend creates the default row when missing. */
  getByCode(code: string): Observable<Parameter> {
    const cached = this.getCachedParam(code);
    if (cached?.id) {
      return of(cached);
    }

    return this.fetchByCodeFromApi(code);
  }

  /** Load a parameter after refreshing defaults from the backend catalog. */
  ensureParameterByCode(code: string): Observable<Parameter> {
    return this.getAll().pipe(
      switchMap((response) => {
        const existing = response.data?.find((parameter) => parameter.code === code);
        if (existing?.id) {
          return of(existing);
        }
        return this.fetchByCodeFromApi(code);
      })
    );
  }

  updateValue(param: Parameter): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}`, param).pipe(
      tap((res) => {
        const updated = this.extractPayload<Parameter>(res?.data);
        if (updated?.id) {
          this.setCachedParam(updated);
        }
      })
    );
  }

  private fetchByCodeFromApi(code: string): Observable<Parameter> {
    return this.http.get<ApiResponse<Parameter>>(`${this.baseUrl}/code/${code}`).pipe(
      map((response) => {
        const parameter = response.data?.[0];
        if (!parameter?.id) {
          throw new Error('PARAMETER_NOT_FOUND');
        }
        this.setCachedParam(parameter);
        return parameter;
      })
    );
  }

  private extractPayload<T>(data: T | T[] | null | undefined): T | null {
    if (Array.isArray(data)) {
      return data[0] ?? null;
    }
    return data ?? null;
  }

  private cacheAll(parameters: Parameter[] | undefined): void {
    const cache: Record<string, Parameter> = {};
    (parameters ?? []).forEach((parameter) => {
      if (parameter?.code) {
        cache[parameter.code] = parameter;
      }
    });
    localStorage.setItem(this.localStorageKey, JSON.stringify(cache));
  }

  private getCachedParam(code: string): Parameter | null {
    const raw = localStorage.getItem(this.localStorageKey);
    if (!raw) {
      return null;
    }
    try {
      const parsed: Record<string, Parameter> = JSON.parse(raw);
      return parsed[code] ?? null;
    } catch {
      return null;
    }
  }

  private setCachedParam(param: Parameter): void {
    let cache: Record<string, Parameter> = {};
    try {
      const raw = localStorage.getItem(this.localStorageKey);
      if (raw) {
        cache = JSON.parse(raw);
      }
    } catch {
      cache = {};
    }
    cache[param.code] = param;
    localStorage.setItem(this.localStorageKey, JSON.stringify(cache));
  }
}
