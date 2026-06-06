import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { SupplierType } from '../models/supplier-type';
import { ApiResponse } from '../models/api-response';

@Injectable({ providedIn: 'root' })
export class SupplierTypeService {
  private baseUrl = `${environment.apiUrl}/api/production/suppliers_type`;
  private baseUrlFinance = `${environment.apiUrl}/api/finance/suppliers_type`;

  constructor(private http: HttpClient) {}

  // ------------------------ READS (Production) ------------------------

  getAllSuppliers(): Observable<ApiResponse<SupplierType>> {
    return this.http.get<ApiResponse<SupplierType>>(`${this.baseUrl}/fetchAll`);
  }

  getSupplier(id: string): Observable<ApiResponse<SupplierType>> {
    return this.http.get<ApiResponse<SupplierType>>(`${this.baseUrl}/fetch/${id}`);
  }

  // ------------------------ WRITE → mirror to Finance ------------------------

  /**
   * POST to Production, then fetch full entity from Prod and POST to Finance.
   * Returns the Production response regardless of Finance status.
   */
  addSupplier(supplier: SupplierType): Observable<ApiResponse<SupplierType>> {
    return this.http.post<ApiResponse<SupplierType>>(this.baseUrl, supplier).pipe(
      switchMap((prodRes) => {
        const created = prodRes?.data as any;
        const prodId: string | undefined = created?.id;

        if (!prodId) {
          console.warn('[SupplierTypeService] addSupplier: Prod did not return id; skip Finance mirror.');
          return of(prodRes);
        }

        // Get canonical entity from Prod, then POST to Finance
        return this.getSupplier(prodId).pipe(
          switchMap((fullRes) => {
            const fullEntity = (fullRes?.data as any) ?? created;
            const financeBody = this.prepareForFinance(fullEntity);

            return this.http.post<any>(this.baseUrlFinance, financeBody).pipe(
              tap(() => console.debug('[SupplierTypeService] Finance mirror POST OK (create)', { prodId })),
              catchError((err) => {
                console.error('[SupplierTypeService] Finance mirror POST FAILED (create)', err);
                return of(null); // swallow – keep UI happy
              }),
              map(() => prodRes) // always resolve with original Prod response
            );
          }),
          catchError((err) => {
            console.error('[SupplierTypeService] Failed to refetch created entity from Prod', err);
            return of(prodRes);
          })
        );
      }),
      catchError((err) => this.handleHttp('addSupplier → Prod POST failed', err))
    );
  }

  /**
   * PUT to Production, then fetch full entity from Prod and POST to Finance.
   * (We POST to Finance intentionally; if Finance supports idempotent upsert, it will handle it.
   *  Otherwise change to PUT if you have /{id} there.)
   * Returns the Production response regardless of Finance status.
   */
  updateSupplier(supplier: SupplierType): Observable<ApiResponse<SupplierType>> {
    return this.http.put<ApiResponse<SupplierType>>(this.baseUrl, supplier).pipe(
      switchMap((prodRes) => {
        const updated = prodRes?.data as any;
        const prodId: string | undefined = updated?.id ?? (supplier as any)?.id;

        if (!prodId) {
          console.warn('[SupplierTypeService] updateSupplier: no id; skip Finance mirror.');
          return of(prodRes);
        }

        return this.getSupplier(prodId).pipe(
          switchMap((fullRes) => {
            const fullEntity = (fullRes?.data as any) ?? updated;
            const financeBody = this.prepareForFinance(fullEntity);

            return this.http.post<any>(this.baseUrlFinance, financeBody).pipe(
              tap(() => console.debug('[SupplierTypeService] Finance mirror POST OK (update)', { prodId })),
              catchError((err) => {
                console.error('[SupplierTypeService] Finance mirror POST FAILED (update)', err);
                return of(null);
              }),
              map(() => prodRes)
            );
          }),
          catchError((err) => {
            console.error('[SupplierTypeService] Failed to refetch updated entity from Prod', err);
            return of(prodRes);
          })
        );
      }),
      catchError((err) => this.handleHttp('updateSupplier → Prod PUT failed', err))
    );
  }

  // ------------------------ DELETE (Production) ------------------------

  deleteSupplier(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }

  // ------------------------ COUNTS (Production) ------------------------

  getPaidPaymentsCount(supplierId: string): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/${supplierId}/payments/paid/count`);
  }

  getUnpaidPaymentsCount(supplierId: string): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/${supplierId}/payments/unpaid/count`);
  }

  // ------------------------ Internals ------------------------

  /**
   * Shape the payload for Finance.
   * - Remove primary key `id` (Finance owns its PK).
   * - Keep a cross-ref if present (externalId / prodId).
   * - Strip audit/immutable fields.
   * - Optionally reduce nested relations to `{ id }` only.
   */
  private prepareForFinance(source: any): any {
    const body: any = { ...source };


    // Finance should generate its own id
    delete body.id;

    // Strip common audit fields
    delete body.createdBy;
    delete body.createdDate;
    delete body.lastModifiedBy;
    delete body.lastModifiedDate;

    // If you have nested objects, keep only their ids (example):
    // if (body.genericSupplierType && typeof body.genericSupplierType === 'object') {
    //   body.genericSupplierType = body.genericSupplierType?.id
    //     ? { id: body.genericSupplierType.id }
    //     : null;
    // }

    return body;
  }

  private handleHttp(ctx: string, err: any): Observable<never> {
    const status = (err as HttpErrorResponse)?.status;
    const msg = (err as HttpErrorResponse)?.error || (err as HttpErrorResponse)?.message || err;
    console.error(`[SupplierTypeService] ${ctx} [status=${status}]`, msg);
    return throwError(() => err);
  }
}
