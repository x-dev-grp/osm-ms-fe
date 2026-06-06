import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
 import { ApiResponse } from '../models/api-response';
import { OilContainer } from '../models/oil-container';
import {QrCodeRequest, QrCodeResponse} from "../models/qr-models";

@Injectable({
  providedIn: 'root'
})
export class OilContainerService {
  private baseUrl = `${environment.apiUrl}/api/production/oil_container`;

  constructor(private http: HttpClient) {}

  // Get all suppliers
  getAllOilContainers(): Observable<ApiResponse<OilContainer>> {
    return this.http.get<ApiResponse<OilContainer>>(`${this.baseUrl}/fetchAll`);
  }

  // Get oilContainer by id
  getOilContainer(id: string): Observable<ApiResponse<OilContainer>> {
    return this.http.get<ApiResponse<OilContainer>>(`${this.baseUrl}/fetch/${id}`);
  }

  // Add a new oilContainer
  addOilContainer(oilContainer: OilContainer): Observable<ApiResponse<OilContainer>> {
    return this.http.post<ApiResponse<OilContainer>>(`${this.baseUrl}`, oilContainer);
  }

  // Update an existing oilContainer
  updateOilContainer( oilContainer: OilContainer): Observable<ApiResponse<OilContainer>> {
    return this.http.put<ApiResponse<OilContainer>>(`${this.baseUrl}`, oilContainer);
  }
  generateQrCode(request: QrCodeRequest): Observable<QrCodeResponse> {
    return this.http.post<QrCodeResponse>(`${this.baseUrl}/generate`, request);
  }

}
