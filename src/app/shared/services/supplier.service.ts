import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SupplierType } from '../models/supplier-type';
import { ApiResponse } from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class SupplierTypeService {
  private baseUrl = '/api/production/suppliers_type';

  constructor(private http: HttpClient) {}

  // Get all suppliers
  getAllSuppliers(): Observable<ApiResponse<SupplierType>> {
    return this.http.get<ApiResponse<SupplierType>>(`${this.baseUrl}/fetchAll`);
  }

  // Get supplier by id
  getSupplier(id: string): Observable<ApiResponse<SupplierType>> {
    return this.http.get<ApiResponse<SupplierType>>(`${this.baseUrl}/fetch/${id}`);
  }

  // Add a new supplier
  addSupplier(supplier: SupplierType): Observable<ApiResponse<SupplierType>> {
    return this.http.post<ApiResponse<SupplierType>>(`${this.baseUrl}`, supplier);
  }

  // Update an existing supplier
  updateSupplier( supplier: SupplierType): Observable<ApiResponse<SupplierType>> {
    return this.http.put<ApiResponse<SupplierType>>(`${this.baseUrl}`, supplier);
  }

  deleteSupplier(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }

  getPaidPaymentsCount(supplierId: string): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/${supplierId}/payments/paid/count`);
  }

  getUnpaidPaymentsCount(supplierId: string): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/${supplierId}/payments/unpaid/count`);
  }
}
