import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response';
import { UnifiedDelivery } from '../models/UnifiedDelivery';

@Injectable({
  providedIn: 'root'
})
export class UnifiedDeliveryService {
  private baseUrl = '/api/production/deliveries';

  constructor(private http: HttpClient) {}

  // Get all deliveries with pagination.
  getAllDeliveries(page: number, size: number): Observable<ApiResponse<never>> {
    return this.http.get<ApiResponse<never>>(`${this.baseUrl}/fetchAll?page=${page}&size=${size}`);
  }

  getAllDeliveriesList(): Observable<ApiResponse<UnifiedDelivery>> {
    return this.http.get<ApiResponse<UnifiedDelivery>>(`${this.baseUrl}/fetchAll`);
  }

  getAllDeliveriesListForPlanning(): Observable<ApiResponse<UnifiedDelivery>> {
    return this.http.get<ApiResponse<UnifiedDelivery>>(`${this.baseUrl}/planning`);
  }

  // Retrieve a single UnifiedDeliverycc by ID.
  getUnifiedDelivery(id: string): Observable<ApiResponse<UnifiedDelivery>> {
    return this.http.get<ApiResponse<UnifiedDelivery>>(`${this.baseUrl}/fetch/${id}`);
  }

  // Create a new UnifiedDeliverycc. The UnifiedDeliverycc payload may include qualityControlResults.
  createUnifiedDelivery(UnifiedDelivery: UnifiedDelivery): Observable<ApiResponse<UnifiedDelivery>> {
    return this.http.post<ApiResponse<UnifiedDelivery>>(this.baseUrl, UnifiedDelivery);
  }

  // Update an existing UnifiedDeliverycc.
  updateUnifiedDelivery(UnifiedDelivery: UnifiedDelivery): Observable<ApiResponse<UnifiedDelivery>> {
    return this.http.put<ApiResponse<UnifiedDelivery>>(`${this.baseUrl}`, UnifiedDelivery);
  }

  // Delete a UnifiedDeliverycc by ID.
  deleteUnifiedDelivery(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }

  updateDelivery(  delivery: UnifiedDelivery): Observable<ApiResponse<UnifiedDelivery>> {
    return this.http.put<ApiResponse<UnifiedDelivery>>(`${this.baseUrl}`, delivery);
  }

}
