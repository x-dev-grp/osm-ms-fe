import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
 import { ApiResponse } from '../models/api-response';
import { SupplierType } from '../models/supplier-type';

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
  getSupplier(id: number): Observable<ApiResponse<SupplierType>> {
    return this.http.get<ApiResponse<SupplierType>>(`${this.baseUrl}/${id}`);
  }

  // Add a new supplier
  addSupplier(supplier: SupplierType): Observable<ApiResponse<SupplierType>> {
    return this.http.post<ApiResponse<SupplierType>>(`${this.baseUrl}`, supplier);
  }

  // Update an existing supplier
  updateSupplier( supplier: SupplierType): Observable<ApiResponse<SupplierType>> {
    return this.http.put<ApiResponse<SupplierType>>(`${this.baseUrl}`, supplier);
  }

  // Optionally, if a delete endpoint exists, you can implement it here
  deleteSupplier(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}
