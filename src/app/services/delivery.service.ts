import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {ApiResponse} from "../models/api-response";
import {Delivery} from "../models/Delivery";


@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private baseUrl = ' /api/production/deliveries';

  constructor(private http: HttpClient) {}

  // Get all deliveries with pagination.
  getAllDeliveries(page: number, size: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}?page=${page}&size=${size}`);
  }

  // Retrieve a single delivery by ID.
  getDelivery(id: number): Observable<ApiResponse<Delivery>> {
    return this.http.get<ApiResponse<Delivery>>(`${this.baseUrl}/${id}`);
  }

  // Create a new delivery. The delivery payload may include qualityControlResults.
  createDelivery(delivery: Delivery): Observable<ApiResponse<Delivery>> {
    return this.http.post<ApiResponse<Delivery>>(this.baseUrl, delivery);
  }

  // Update an existing delivery.
  updateDelivery(id: number, delivery: Delivery): Observable<ApiResponse<Delivery>> {
    return this.http.put<ApiResponse<Delivery>>(`${this.baseUrl}/${id}`, delivery);
  }

  // Delete a delivery by ID.
  deleteDelivery(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}
