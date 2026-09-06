import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { GlobalCodeSearchResponse, QrResolveResponse } from '../models/qr-models';

@Injectable({
  providedIn: 'root'
})
export class GlobalSearchService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  searchByCode(code: string): Observable<GlobalCodeSearchResponse> {
    const trimmed = code.trim();
    const params = { code: trimmed };

    const silent = <T>(source: Observable<T>): Observable<T | null> => source.pipe(catchError(() => of(null)));

    const conditioning$ = silent(this.http.get<GlobalCodeSearchResponse>(`${this.baseUrl}/api/search/by-code`, { params }));

    const article$ = silent(this.http.get<QrResolveResponse>(`${this.baseUrl}/api/inventaire/articles/search/by-code`, { params }));

    const produitFinal$ = silent(this.http.get<QrResolveResponse>(`${this.baseUrl}/api/inventaire/products/search/by-code`, { params }));

    const emplacement$ = silent(this.http.get<QrResolveResponse>(`${this.baseUrl}/api/inventaire/emplacements/search/by-code`, { params }));

    const materielSupplier$ = silent(
      this.http.get<QrResolveResponse>(`${this.baseUrl}/api/inventaire/materiel-suppliers/search/by-code`, { params })
    );

    const storageUnit$ = silent(
      this.http.get<QrResolveResponse>(`${this.baseUrl}/api/production/storage-units/search/by-code`, { params })
    );

    const bonCommande$ = silent(
      this.http.get<QrResolveResponse>(`${this.baseUrl}/api/inventaire/bons-commande/search/by-code`, { params })
    );

    const ligneConditionnement$ = silent(
      this.http.get<QrResolveResponse>(`${this.baseUrl}/api/inventaire/lignes/search/by-code`, { params })
    );

    const bom$ = silent(this.http.get<QrResolveResponse>(`${this.baseUrl}/api/inventaire/boms/search/by-code`, { params }));

    const unifiedDelivery$ = silent(
      this.http.get<QrResolveResponse>(`${this.baseUrl}/api/production/deliveries/search/by-code`, { params })
    );

    const oilSale$ = silent(
      this.http.get<QrResolveResponse>(`${this.baseUrl}/api/production/oil_sale/search/by-code`, { params })
    );

    const oilTransaction$ = silent(
      this.http.get<QrResolveResponse>(`${this.baseUrl}/api/production/oil_transaction/search/by-code`, { params })
    );

    const oilContainer$ = silent(
      this.http.get<QrResolveResponse>(`${this.baseUrl}/api/production/oil_container/search/by-code`, { params })
    );

    const financialTransaction$ = silent(
      this.http.get<QrResolveResponse>(`${this.baseUrl}/api/finance/transactions/search/by-code`, { params })
    );

    const expense$ = silent(this.http.get<QrResolveResponse>(`${this.baseUrl}/api/finance/expense/search/by-code`, { params }));

    const oilCredit$ = silent(
      this.http.get<QrResolveResponse>(`${this.baseUrl}/api/finance/oil-credit/search/by-code`, { params })
    );

    const bankAccount$ = silent(this.http.get<QrResolveResponse>(`${this.baseUrl}/api/finance/banks/search/by-code`, { params }));

    const waste$ = silent(this.http.get<QrResolveResponse>(`${this.baseUrl}/api/production/waste/search/by-code`, { params }));

    const filtration$ = silent(
      this.http.get<QrResolveResponse>(`${this.baseUrl}/api/production/filtration-operations/search/by-code`, { params })
    );

    const qualityControl$ = silent(
      this.http.get<QrResolveResponse>(`${this.baseUrl}/api/production/qualitycontrolresult/search/by-code`, { params })
    );

    return forkJoin({
      conditioning: conditioning$,
      article: article$,
      produitFinal: produitFinal$,
      emplacement: emplacement$,
      materielSupplier: materielSupplier$,
      storageUnit: storageUnit$,
      bonCommande: bonCommande$,
      ligneConditionnement: ligneConditionnement$,
      bom: bom$,
      unifiedDelivery: unifiedDelivery$,
      oilSale: oilSale$,
      oilTransaction: oilTransaction$,
      oilContainer: oilContainer$,
      financialTransaction: financialTransaction$,
      expense: expense$,
      oilCredit: oilCredit$,
      bankAccount: bankAccount$,
      waste: waste$,
      filtration: filtration$,
      qualityControl: qualityControl$
    }).pipe(
      map((hits) => {
        const matches = new Map<string, QrResolveResponse>();

        const add = (hit?: QrResolveResponse | null) => {
          if (!hit?.entityId) {
            return;
          }
          const key = `${hit.entityType ?? ''}|${hit.entityId}|${hit.publicCode ?? ''}`;
          matches.set(key, hit);
        };

        if (hits.conditioning?.results?.length) {
          hits.conditioning.results.forEach(add);
        } else if (hits.conditioning?.result) {
          add(hits.conditioning.result);
        }

        add(hits.article);
        add(hits.produitFinal);
        add(hits.emplacement);
        add(hits.materielSupplier);
        add(hits.storageUnit);
        add(hits.bonCommande);
        add(hits.ligneConditionnement);
        add(hits.bom);
        add(hits.unifiedDelivery);
        add(hits.oilSale);
        add(hits.oilTransaction);
        add(hits.oilContainer);
        add(hits.financialTransaction);
        add(hits.expense);
        add(hits.oilCredit);
        add(hits.bankAccount);
        add(hits.waste);
        add(hits.filtration);
        add(hits.qualityControl);

        const results = Array.from(matches.values());
        return {
          code: trimmed,
          matchCount: results.length,
          result: results[0],
          results
        };
      })
    );
  }
}
