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
      unifiedDelivery: unifiedDelivery$
    }).pipe(
      map(
        ({
          conditioning,
          article,
          produitFinal,
          emplacement,
          materielSupplier,
          storageUnit,
          bonCommande,
          ligneConditionnement,
          bom,
          unifiedDelivery
        }) => {
          const matches = new Map<string, QrResolveResponse>();

          const add = (hit?: QrResolveResponse | null) => {
            if (!hit?.entityId) {
              return;
            }
            const key = `${hit.entityType ?? ''}|${hit.entityId}|${hit.publicCode ?? ''}`;
            matches.set(key, hit);
          };

          if (conditioning?.results?.length) {
            conditioning.results.forEach(add);
          } else if (conditioning?.result) {
            add(conditioning.result);
          }

          add(article);
          add(produitFinal);
          add(emplacement);
          add(materielSupplier);
          add(storageUnit);
          add(bonCommande);
          add(ligneConditionnement);
          add(bom);
          add(unifiedDelivery);

          const results = Array.from(matches.values());
          return {
            code: trimmed,
            matchCount: results.length,
            result: results[0],
            results
          };
        }
      )
    );
  }
}
