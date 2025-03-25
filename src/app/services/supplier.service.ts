import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
 import { Supplier } from '../models/supplier';
import {ApiResponse} from "../models/api-response";

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private baseUrl = '/api/production/suppliers';

  constructor(private http: HttpClient) {}

  // Get all suppliers
  getAllSuppliers(): Observable<ApiResponse<Supplier>> {
    return this.http.get<ApiResponse<Supplier>>(`${this.baseUrl}/fetchAll`);
  }
  // Get supplier by id
  getSupplier(id: number): Observable<ApiResponse<Supplier>> {
    return this.http.get<ApiResponse<Supplier>>(`${this.baseUrl}/${id}`);
  }

  // Add a new supplier
  addSupplier(supplier: Supplier): Observable<ApiResponse<Supplier>> {
    return this.http.post<ApiResponse<Supplier>>(`${this.baseUrl}`, supplier);
  }

  // Update an existing supplier
  updateSupplier(id: string, supplier: Supplier): Observable<ApiResponse<Supplier>> {
    return this.http.put<ApiResponse<Supplier>>(`${this.baseUrl}/${id}`, supplier);
  }

  // Optionally, if a delete endpoint exists, you can implement it here
  // deleteSupplier(id: number): Observable<ApiResponse<void>> {
  //   return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  // }
}
