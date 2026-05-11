import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuditDto } from '../models/AuditDto';

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private inventaireUrl = `${environment.apiUrl}/api/inventaire/audit/all`;
  private ocUrl = `${environment.apiUrl}/api/ordreConditionement/audit/all`;

  constructor(private http: HttpClient) {}

  getAllAudits(): Observable<AuditDto[]> {
    const inventaireAudits$ = this.http.get<AuditDto[]>(this.inventaireUrl).pipe(
      catchError(err => {
        console.error('Erreur audit Inventaire', err);
        return of([]);   // ✅ Retourne un Observable
      })
    );

    const ocAudits$ = this.http.get<AuditDto[]>(this.ocUrl).pipe(
      catchError(err => {
        console.error('Erreur audit OC', err);
        return of([]);   // ✅ Retourne un Observable
      })
    );

    return forkJoin([inventaireAudits$, ocAudits$]).pipe(
      map(([inventaireAudits, ocAudits]) => [...inventaireAudits, ...ocAudits])
    );
  }
}
