import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Certification } from '../models/certification.model';

@Injectable({
  providedIn: 'root'
})
export class CertificationService {
  private readonly baseUrl = `${environment.apiUrl}/api/certifications`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Certification[]> {
    return this.http.get<any>(`${this.baseUrl}/fetchAll`).pipe(map((response) => response.data ?? []));
  }

  getById(id: string): Observable<Certification> {
    return this.http.get<any>(`${this.baseUrl}/fetch/${id}`).pipe(map((response) => response.data));
  }

  create(certification: Certification): Observable<Certification> {
    return this.http.post<any>(this.baseUrl, certification).pipe(map((response) => response.data));
  }

  update(certification: Certification): Observable<Certification> {
    return this.http.put<any>(this.baseUrl, certification).pipe(map((response) => response.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<any>(`${this.baseUrl}/remove/${id}`).pipe(map(() => void 0));
  }

  advancedSearch(searchData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/advanced/search`, searchData);
  }
}
