import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response';
import { StorageUnitDto } from '../models/StorageUnitDto';
import { ChangeSupplierDto } from '../../storage/assign-supplier/assign-supplier.component';
import { QrCodeInfo, QrResolveResponse } from '../models/qr-models';

@Injectable({
  providedIn: 'root'
})
export class StorageUnitDtoService {
  private baseUrl = `${environment.apiUrl}/api/production/storage-units`;

  constructor(private http: HttpClient) {}

  // Get all quality control StorageUnit
  getAllStorageUnit(): Observable<ApiResponse<StorageUnitDto>> {
    return this.http.get<ApiResponse<StorageUnitDto>>(`${this.baseUrl}/fetchAll`);
  }

  // Get a StorageUnit by ID
  getStorageUnit(id: string): Observable<ApiResponse<StorageUnitDto>> {
    return this.http.get<ApiResponse<StorageUnitDto>>(`${this.baseUrl}/fetch/${id}`);
  }

  // Create a new StorageUnit
  createStorageUnit(StorageUnit: StorageUnitDto): Observable<ApiResponse<StorageUnitDto>> {
    return this.http.post<ApiResponse<StorageUnitDto>>(this.baseUrl, StorageUnit);
  }

  // Update an existing StorageUnit
  updateStorageUnit(StorageUnit: StorageUnitDto): Observable<ApiResponse<StorageUnitDto>> {
    return this.http.put<ApiResponse<StorageUnitDto>>(`${this.baseUrl}`, StorageUnit);
  }

  // Delete a StorageUnit by ID
  deleteStorageUnit(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/delete/${id}`);
  }

  assignSupplier(dto: ChangeSupplierDto): Observable<ApiResponse<void>> {
    const url = `${this.baseUrl}/${dto.storageId}/assign-supplier`;
    let params = new HttpParams();

    if (dto.supplierId != null) {
      params = params.set('supplierId', dto.supplierId);
    }

    return this.http.put<ApiResponse<void>>(url, null, { params });
  }

  generateQrCode(storageUnitId: string): Observable<QrCodeInfo> {
    return this.http.get<QrCodeInfo>(`${this.baseUrl}/qr/STORAGEUNIT/${storageUnitId}`);
  }

  resolveByPublicCode(publicCode: string): Observable<QrResolveResponse> {
    return this.http.get<QrResolveResponse>(`${this.baseUrl}/resolve/${encodeURIComponent(publicCode)}`);
  }

  searchByCode(code: string): Observable<QrResolveResponse> {
    return this.http.get<QrResolveResponse>(`${this.baseUrl}/search/by-code`, {
      params: { code }
    });
  }
}
