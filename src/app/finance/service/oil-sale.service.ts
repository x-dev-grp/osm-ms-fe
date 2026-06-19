import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OilSaleDeliveryRequest } from '../oil-sales/oil-sale-delivery.request';
import { environment } from '../../../environments/environment';
import {
  OilSale,
} from '../models/oil-sale.model';
import { ApiResponse } from '../../shared/models/api-response';
import { OilSaleCreateRequest } from '../oil-sales/oil-sale-add/oil-sale-create.request';


@Injectable({
  providedIn: 'root'
})
export class OilSaleService {
  private baseUrl = `${environment.apiUrl}/api/production/oil_sale`;

  constructor(private http: HttpClient) {}

  // Get all oil sales
  getAllOilSales(): Observable<ApiResponse<OilSale>> {
    return this.http.get<ApiResponse<OilSale>>(`${this.baseUrl}/fetchAll`);
  }

  // Get oil sale by ID
  getOilSale(id: string): Observable<ApiResponse<OilSale>> {
    return this.http.get<ApiResponse<OilSale>>(`${this.baseUrl}/fetch/${id}`);
  }

  // Create new oil sale
  createOilSale(oilSale: OilSaleCreateRequest): Observable<ApiResponse<OilSale>> {
    return this.http.post<ApiResponse<OilSale>>(`${this.baseUrl}/create`, oilSale);
  }

  // Update oil sale
  updateOilSale(id: string, oilSale: OilSale): Observable<ApiResponse<OilSale>> {
    return this.http.put<ApiResponse<OilSale>>(`${this.baseUrl}/${id}`, oilSale);
  }



  // Confirm oil sale (update status to CONFIRMED)
  confirmOilSale(id: string): Observable<ApiResponse<OilSale>> {
    return this.http.patch<ApiResponse<OilSale>>(`${this.baseUrl}/${id}/confirm`, {});
  }

  // Cancel oil sale (update status to CANCELLED)
  cancelOilSale(id: string): Observable<ApiResponse<OilSale>> {
    return this.http.patch<ApiResponse<OilSale>>(`${this.baseUrl}/${id}/cancel`, {});
  }

  // Deliver oil sale (optionally with delivery info in the same request)
  deliverOilSale(id: string, delivery?: OilSaleDeliveryRequest): Observable<ApiResponse<OilSale>> {
    return this.http.patch<ApiResponse<OilSale>>(`${this.baseUrl}/${id}/deliver`, delivery ?? {});
  }

  processPayment(payload:any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/payment`, payload);
  }
}
