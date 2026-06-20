import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';
import { MaintenanceWorkOrder } from '../models/maintenance-work-order.model';

@Injectable({ providedIn: 'root' })
export class MaintenanceWorkOrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/production/maintenance-work-orders`;

  getById(id: string): Observable<ApiSingleResponse<MaintenanceWorkOrder>> {
    return this.http.get<ApiSingleResponse<MaintenanceWorkOrder>>(`${this.baseUrl}/fetch/${id}`);
  }

  create(payload: MaintenanceWorkOrder): Observable<ApiSingleResponse<MaintenanceWorkOrder>> {
    return this.http.post<ApiSingleResponse<MaintenanceWorkOrder>>(`${this.baseUrl}`, payload);
  }

  update(payload: MaintenanceWorkOrder): Observable<ApiSingleResponse<MaintenanceWorkOrder>> {
    return this.http.put<ApiSingleResponse<MaintenanceWorkOrder>>(`${this.baseUrl}`, payload);
  }

  delete(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }
}
