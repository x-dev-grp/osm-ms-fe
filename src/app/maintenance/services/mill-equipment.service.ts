import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiSingleResponse } from '../../shared/models/api-response';
import { MillEquipment } from '../models/mill-equipment.model';
import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';

@Injectable({ providedIn: 'root' })
export class MillEquipmentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/production/mill-equipment`;

  getById(id: string): Observable<ApiSingleResponse<MillEquipment>> {
    return this.http.get<ApiSingleResponse<MillEquipment>>(`${this.baseUrl}/fetch/${id}`);
  }

  searchAll(): Observable<MillEquipment[]> {
    return this.http
      .post<{ data?: { content?: MillEquipment[] } }>(`${this.baseUrl}/advanced/search`, {
        page: 0,
        size: 500,
        sort: 'name',
        order: 'ASC',
        searchData: {
          operation: SearchOperation.AND,
          searchs: [],
          search: { isDeleted: { equalValue: false } }
        }
      })
      .pipe(map((res) => res.data?.content ?? []));
  }

  create(payload: MillEquipment): Observable<ApiSingleResponse<MillEquipment>> {
    return this.http.post<ApiSingleResponse<MillEquipment>>(`${this.baseUrl}`, payload);
  }

  update(payload: MillEquipment): Observable<ApiSingleResponse<MillEquipment>> {
    return this.http.put<ApiSingleResponse<MillEquipment>>(`${this.baseUrl}`, payload);
  }

  delete(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }
}
