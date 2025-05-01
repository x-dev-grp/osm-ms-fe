import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
 import {ApiResponse} from "../models/api-response";
import { SupplierType } from '../models/supplier-type';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private baseUrl = '/api/production/suppliers';

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
  updateSupplier(id: string, supplier: SupplierType): Observable<ApiResponse<SupplierType>> {
    return this.http.put<ApiResponse<SupplierType>>(`${this.baseUrl}/${id}`, supplier);
  }

  // Optionally, if a delete endpoint exists, you can implement it here
  // deleteSupplier(id: number): Observable<ApiResponse<void>> {
  //   return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  // }
}
