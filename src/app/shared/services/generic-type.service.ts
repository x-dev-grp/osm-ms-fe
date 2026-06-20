import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, forkJoin, Observable, of, switchMap, throwError } from 'rxjs';
import { BaseType } from '../models/base-type';
import { ApiResponse } from '../models/api-response';
import { TypeCategory } from '../models/type-category.enum';
import { environment } from '../../../environments/environment';
import { map, tap } from 'rxjs/operators';

// import {TypeCategory} from "../../osm/models/type-category.enum";

@Injectable({
  providedIn: 'root'
})
export class GenericTypeService {
  // ⬇️ Adjust endpoints if your routes differ
  private readonly prodBaseUrl = `${environment.apiUrl}/api/production/types`;
  private readonly finBaseUrl = `${environment.apiUrl}/api/finance/types`;

  private readonly httpJson = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    withCredentials: false
  };

  constructor(private http: HttpClient) {}
  // Get all records for a specific type category
  getAllTypes(type: TypeCategory | string): Observable<ApiResponse<BaseType>> {
    return this.http.get<ApiResponse<BaseType>>(`${this.prodBaseUrl}/${type}`);
  }

  private prepareForFinance(source: any): any {
    const body: any = { ...source };

    // Finance should generate its own id
    delete body.id;
    delete body.createdBy;
    delete body.createdDate;
    delete body.lastModifiedBy;
    delete body.lastModifiedDate;

    return body;
  }

  // ----------------------------------------------------------------
  // CRUD on Production (canonical)
  // ----------------------------------------------------------------

  /** Get a BaseType by id from Production (canonical source) */
  getType(id: string): Observable<ApiResponse<BaseType>> {
    return this.http
      .get<ApiResponse<BaseType>>(`${this.prodBaseUrl}/fetch/${id}`)
      .pipe(catchError((err) => this.handleHttp('getType', err)));
  }
  createType(typr: BaseType): Observable<ApiResponse<BaseType>> {
    return this.http.post<ApiResponse<BaseType>>(this.prodBaseUrl, typr).pipe(
      switchMap((prodRes) => {
        const created = prodRes?.data as any;
        const prodId: string | undefined = created?.id;

        if (!prodId) {
          console.warn('[BaseTypeService] addSupplier: Prod did not return id; skip Finance mirror.');
          return of(prodRes);
        }

        // Get canonical entity from Prod, then POST to Finance
        return this.getType(prodId).pipe(
          switchMap((fullRes) => {
            const fullEntity = (fullRes?.data as any) ?? created;
            const financeBody = this.prepareForFinance(fullEntity);

            return this.http.post<any>(this.finBaseUrl, financeBody).pipe(
              tap(() => console.debug('[BaseTypeService] Finance mirror POST OK (create)', { prodId })),
              catchError((err) => {
                console.error('[BaseTypeService] Finance mirror POST FAILED (create)', err);
                return of(null); // swallow – keep UI happy
              }),
              map(() => prodRes) // always resolve with original Prod response
            );
          }),
          catchError((err) => {
            console.error('[BaseTypeService] Failed to refetch created entity from Prod', err);
            return of(prodRes);
          })
        );
      }),
      catchError((err) => this.handleHttp('addSupplier → Prod POST failed', err))
    );
  }
  updateType(entity: BaseType): Observable<ApiResponse<BaseType>> {
    return this.http.put<ApiResponse<BaseType>>(this.prodBaseUrl, entity).pipe(
      switchMap((prodRes) => {
        const updated = prodRes?.data as any;
        const prodId: string | undefined = updated?.id ?? (entity as any)?.id;

        if (!prodId) {
          console.warn('[BaseTypeService] updateSupplier: no id; skip Finance mirror.');
          return of(prodRes);
        }

        return this.getType(prodId).pipe(
          switchMap((fullRes) => {
            const fullEntity = (fullRes?.data as any) ?? updated;
            const financeBody = this.prepareForFinance(fullEntity);

            return this.http.post<any>(this.finBaseUrl, financeBody).pipe(
              tap(() => console.debug('[BaseTypeService] Finance mirror POST OK (update)', { prodId })),
              catchError((err) => {
                console.error('[BaseTypeService] Finance mirror POST FAILED (update)', err);
                return of(null);
              }),
              map(() => prodRes)
            );
          }),
          catchError((err) => {
            console.error('[BaseTypeService] Failed to refetch updated entity from Prod', err);
            return of(prodRes);
          })
        );
      }),
      catchError((err) => this.handleHttp('updateSupplier → Prod PUT failed', err))
    );
  }

  /** Delete in Production, then best-effort delete in Finance */
  deleteType(id: string): Observable<void> {
    return this.http.delete<void>(`${this.prodBaseUrl}/${id}`).pipe(
      switchMap(() =>
        this.http.delete<void>(`${this.finBaseUrl}/${id}`).pipe(
          catchError((err) => {
            console.warn('[GenericTypeService] deleteType: Finance delete failed (ignored)', err);
            return of(void 0);
          })
        )
      ),
      catchError((err) => this.handleHttp('deleteType', err))
    );
  }

  // ----------------------------------------------------------------
  // Re-sync / Resend helpers
  // ----------------------------------------------------------------

  /** Force resend one entity to Finance (idempotent) */
  resendToFinance(id: string): Observable<ApiResponse<BaseType>> {
    return this.getType(id).pipe(
      switchMap((res) => {
        const entity = res?.data;
        if (!entity) {
          return throwError(() => new Error(`[GenericTypeService] resendToFinance: Not found in Production (id=${id})`));
        }
        return this.upsertToFinance(entity, 'update').pipe(map(() => res));
      }),
      catchError((err) => this.handleHttp('resendToFinance', err))
    );
  }

  /** Bulk resend to Finance; never fails the whole batch */
  resendManyToFinance(ids: string[]): Observable<(ApiResponse<BaseType> | null)[]> {
    if (!ids?.length) return of([]);
    const jobs = ids.map((id) =>
      this.resendToFinance(id).pipe(
        catchError((err) => {
          console.warn(`[GenericTypeService] resendManyToFinance: failed id=${id}`, err);
          return of(null);
        })
      )
    );
    return forkJoin(jobs);
  }

  // ----------------------------------------------------------------
  // Finance upsert: PUT first (idempotent), fallback to POST on 404/409
  // ----------------------------------------------------------------

  private upsertToFinance(entity: BaseType | BaseType[], intent: 'create' | 'update'): Observable<ApiResponse<BaseType>> {
    const body = entity;

    return this.http.put<ApiResponse<BaseType>>(this.finBaseUrl, body, this.httpJson).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err?.status === 404 || err?.status === 409 || intent === 'create') {
          // Not present in Finance (or explicit create flow) → create it
          return this.http.post<ApiResponse<BaseType>>(this.finBaseUrl, body, this.httpJson);
        }
        return throwError(() => err);
      })
    );
  }

  /** Map Production BaseType → Finance DTO (adjust if Finance expects a different shape) */
  private toFinanceBody(entity: BaseType): any {
    // If Finance uses the same DTO, passthrough is fine:
    return entity;

    // Example if Finance expects only a subset:
    // return { id: entity.id, type: entity.type, label: entity.label };
  }

  // ----------------------------------------------------------------
  // Error handling
  // ----------------------------------------------------------------

  private handleHttp(ctx: string, err: any): Observable<never> {
    const http = err as HttpErrorResponse;
    const status = http?.status;
    const msg = http?.error ?? http?.message ?? err;
    console.error(`[GenericTypeService] ${ctx} [status=${status}]`, msg);
    return throwError(() => err);
  }
}
