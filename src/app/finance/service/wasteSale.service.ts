import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
 import {WasteSale} from "../models/Waste.model";
import { ApiResponse } from '../../shared/models/api-response';

@Injectable({
  providedIn: 'root'
})
export class WasteSaleService {
  private baseUrl = `${environment.apiUrl}/api/finance/waste_sale`;

  constructor(private http: HttpClient) {
  }


  // Get waste sale by ID
  getWasteSale(id: string): Observable<ApiResponse<WasteSale>> {
    return this.http.get<ApiResponse<WasteSale>>(`${this.baseUrl}/fetch/${id}`);
  }

  // Create new waste sale
  createWasteSale(wasteSale: WasteSale): Observable<ApiResponse<WasteSale>> {
    return this.http.post<ApiResponse<WasteSale>>(this.baseUrl, wasteSale);
  }

  // Update waste sale
  updateWasteSale(id: string, wasteSale: WasteSale): Observable<ApiResponse<WasteSale>> {
    return this.http.put<ApiResponse<WasteSale>>(`${this.baseUrl}/${id}`, wasteSale);
  }

  // Confirm waste sale (update status to CONFIRMED)
  confirmWasteSale(id: string): Observable<ApiResponse<WasteSale>> {
    return this.http.patch<ApiResponse<WasteSale>>(`${this.baseUrl}/${id}/confirm`, {});
  }

  // Cancel waste sale (update status to CANCELLED)
  cancelWasteSale(id: string): Observable<ApiResponse<WasteSale>> {
    return this.http.patch<ApiResponse<WasteSale>>(`${this.baseUrl}/${id}/cancel`, {});
  }

  // Deliver waste sale (update status to DELIVERED)
  deliverWasteSale(id: string): Observable<ApiResponse<WasteSale>> {
    return this.http.patch<ApiResponse<WasteSale>>(`${this.baseUrl}/${id}/deliver`, {});
  }
}
