import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {ApiResponse} from "../models/api-response";
import { Delivery } from '../models/delivery';


@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private baseUrl = '/api/production/deliveries';

  constructor(private http: HttpClient) {}

  // Get all deliveries with pagination.
  getAllDeliveries(page: number, size: number): Observable<ApiResponse<never>> {
    return this.http.get<ApiResponse<never>>(`${this.baseUrl}/fetchAll?page=${page}&size=${size}`);
  }
  getAllDeliveriesList( ): Observable<ApiResponse<Delivery>> {
    return this.http.get<ApiResponse<Delivery>>(`${this.baseUrl}/fetchAll`);
  }

  // Retrieve a single deliverycc by ID.
  getDelivery(id: number): Observable<ApiResponse<Delivery>> {
    return this.http.get<ApiResponse<Delivery>>(`${this.baseUrl}/${id}`);
  }

  // Create a new deliverycc. The deliverycc payload may include qualityControlResults.
  createDelivery(delivery: Delivery): Observable<ApiResponse<Delivery>> {
    return this.http.post<ApiResponse<Delivery>>(this.baseUrl, delivery);
  }

  // Update an existing deliverycc.
  updateDelivery(  delivery: Delivery): Observable<ApiResponse<Delivery>> {
    return this.http.put<ApiResponse<Delivery>>(`${this.baseUrl}`, delivery);
  }

  // Delete a deliverycc by ID.
  deleteDelivery(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}
