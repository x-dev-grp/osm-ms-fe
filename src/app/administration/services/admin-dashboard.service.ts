import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminDashboardStats } from '../models/admin-dashboard-stats.model';

@Injectable({ providedIn: 'root' })
export class AdminDashboardService {
  private readonly baseUrl = `${environment.apiUrl}/api/security/admin/dashboard`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<AdminDashboardStats> {
    return this.http.get<AdminDashboardStats>(`${this.baseUrl}/stats`);
  }
}
