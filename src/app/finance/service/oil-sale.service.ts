import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  OilSale,
  CreateOilSaleDto,
  UpdateOilSaleDto,
  OilSaleSearchDto,
  OilSaleStatistics,
  StorageUnit
} from '../models/oil-sale.model';
import { ApiResponse } from '../models/financial-transaction.model';

@Injectable({
  providedIn: 'root'
})
export class OilSaleService {
  private baseUrl = `${environment.apiUrl}/api/finance/oil_sale`;

  constructor(private http: HttpClient) {}


  // Get oil sale by ID
  getOilSale(id: string): Observable<ApiResponse<OilSale>> {
    return this.http.get<ApiResponse<OilSale>>(`${this.baseUrl}/fetch/${id}`);
  }

  // Create new oil sale
  createOilSale(oilSale: OilSale): Observable<ApiResponse<OilSale>> {
    return this.http.post<ApiResponse<OilSale>>(this.baseUrl, oilSale);
  }

  // Update oil sale
  updateOilSale(id: string, oilSale: UpdateOilSaleDto): Observable<ApiResponse<OilSale>> {
    return this.http.put<ApiResponse<OilSale>>(`${this.baseUrl}/${id}`, oilSale);
  }


  // Get oil sale statistics
  getOilSaleStatistics(search?: OilSaleSearchDto): Observable<ApiResponse<OilSaleStatistics>> {
    let params = new HttpParams();
    if (search) {
      Object.keys(search).forEach(key => {
        const value = (search as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get<ApiResponse<OilSaleStatistics>>(`${this.baseUrl}/statistics`, { params });
  }

  // Get available storage units
  getAvailableStorageUnits(): Observable<ApiResponse<StorageUnit[]>> {
    return this.http.get<ApiResponse<StorageUnit[]>>(`${environment.apiUrl}/production/storage-units/available`);
  }

  // Get storage unit by ID
  getStorageUnit(id: string): Observable<ApiResponse<StorageUnit>> {
    return this.http.get<ApiResponse<StorageUnit>>(`${environment.apiUrl}/production/storage-units/${id}`);
  }

  // Confirm oil sale (update status to CONFIRMED)
  confirmOilSale(id: string): Observable<ApiResponse<OilSale>> {
    return this.http.patch<ApiResponse<OilSale>>(`${this.baseUrl}/${id}/confirm`, {});
  }

  // Cancel oil sale (update status to CANCELLED)
  cancelOilSale(id: string): Observable<ApiResponse<OilSale>> {
    return this.http.patch<ApiResponse<OilSale>>(`${this.baseUrl}/${id}/cancel`, {});
  }

  // Deliver oil sale (update status to DELIVERED)
  deliverOilSale(id: string): Observable<ApiResponse<OilSale>> {
    return this.http.patch<ApiResponse<OilSale>>(`${this.baseUrl}/${id}/deliver`, {});
  }
}
