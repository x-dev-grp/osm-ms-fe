import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response';
import { QualityControlResultDto } from '../models/QualityControlResultDto';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class QualityControlResultService {
  private baseUrl = `${environment.apiUrl}/api/production/qualitycontrolresult`;

  constructor(private http: HttpClient) {}

  getAllResultsByDeliveryID(deleveryID: string): Observable<ApiResponse<QualityControlResultDto>> {
    return this.http.get<ApiResponse<QualityControlResultDto>>(`${this.baseUrl}/fetchByDelivery/${deleveryID}`);
  }

  // Create a new results
  createResults(results: QualityControlResultDto[]): Observable<ApiResponse<QualityControlResultDto>> {
    return this.http.post<ApiResponse<QualityControlResultDto>>(`${this.baseUrl}/save-batch`, results);
  }

  // Update an existing results
  updateResults(results: QualityControlResultDto[]): Observable<ApiResponse<QualityControlResultDto>> {
    return this.http.put<ApiResponse<QualityControlResultDto>>(`${this.baseUrl}/update-batch`, results);
  }

  // Delete a results by ID
  deleteResults(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }

  // Save results with idx as path param (for direct QC entry)
  saveResultsWithIdx(idx: string, results: QualityControlResultDto[]): Observable<ApiResponse<QualityControlResultDto>> {
    return this.http.post<ApiResponse<QualityControlResultDto>>(`${this.baseUrl}/save-batch-direct/${idx}`, results);
  }

  // Fetch only oil QC results for a given oil reception (deliveryId)
  getOilResultsByOliveLotNumber(oliveLotNUmber: string): Observable<ApiResponse<QualityControlResultDto>> {
    return this.http.get<ApiResponse<QualityControlResultDto>>(`${this.baseUrl}/fetchByOilDeliveryOfOliveDelivery/${oliveLotNUmber}`);
  }
}
