import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiSingleResponse } from '../../shared/models/api-response';
import { EquipmentServiceMission } from '../models/equipment-service-mission.model';

@Injectable({ providedIn: 'root' })
export class EquipmentServiceMissionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/production/equipment-service-missions`;

  getById(id: string): Observable<ApiSingleResponse<EquipmentServiceMission>> {
    return this.http.get<ApiSingleResponse<EquipmentServiceMission>>(`${this.baseUrl}/fetch/${id}`);
  }

  create(payload: EquipmentServiceMission): Observable<ApiSingleResponse<EquipmentServiceMission>> {
    return this.http.post<ApiSingleResponse<EquipmentServiceMission>>(`${this.baseUrl}`, payload);
  }

  update(payload: EquipmentServiceMission): Observable<ApiSingleResponse<EquipmentServiceMission>> {
    return this.http.put<ApiSingleResponse<EquipmentServiceMission>>(`${this.baseUrl}`, payload);
  }

  delete(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }
}
