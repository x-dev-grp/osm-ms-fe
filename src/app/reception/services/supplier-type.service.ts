import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SupplierType } from '../../shared/models/supplier-type';
import { ApiResponse } from '../../shared/models/api-response';


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
  // Get SupplierType by id
  getSupplier(id: string): Observable<ApiResponse<SupplierType>> {
    return this.http.get<ApiResponse<SupplierType>>(`${this.baseUrl}/${id}`);
  }

  // Add a new SupplierType
  addSupplier(SupplierType: SupplierType): Observable<ApiResponse<SupplierType>> {
    return this.http.post<ApiResponse<SupplierType>>(`${this.baseUrl}`, SupplierType);
  }

  // Update an existing SupplierType
  updateSupplier( SupplierType: SupplierType): Observable<ApiResponse<SupplierType>> {
    return this.http.put<ApiResponse<SupplierType>>(`${this.baseUrl}`, SupplierType);
  }

  // Optionally, if a delete endpoint exists, you can implement it here
  deleteSupplier(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}
