import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable }  from 'rxjs';
import { environment } from 'src/environments/environment';
import {AuditDto} from "../models/AuditDto";



@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private apiUrl = `${environment.apiUrl}/api/inventaire/audit`;

  constructor(private http: HttpClient) {}

  getAllAudits(): Observable<AuditDto[]> {
    return this.http.get<AuditDto[]>(`${this.apiUrl}/all`);
  }
}
