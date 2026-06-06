import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
 import { OilCredit } from '../models/OilCredit';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response';

@Injectable({
  providedIn: 'root'
})
export class OilCreditService {
  private baseUrl = environment.apiUrl + '/api/finance/oil-credit';

  constructor(private http: HttpClient) {}

  // Get all deliveries with pagination.
  getAllOilCredit(page: number, size: number): Observable<ApiResponse<never>> {
    return this.http.get<ApiResponse<never>>(`${this.baseUrl}/fetchAll?page=${page}&size=${size}`);
  }

  getAllOilCreditList(): Observable<ApiResponse<OilCredit>> {
    return this.http.get<ApiResponse<OilCredit>>(`${this.baseUrl}/fetchAll`);
  }

  // Retrieve a single OilCreditcc by ID.
  getOilCredit(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/fetch/${id}`);
  }


  // Create a new OilCreditcc. The OilCreditcc payload may include qualityControlResults.
  createOilCredit(OilCredit: OilCredit): Observable<ApiResponse<OilCredit>> {
    return this.http.post<ApiResponse<OilCredit>>(this.baseUrl, OilCredit);
  }

  // Update an existing OilCreditcc.
  updateOilCredit(OilCredit: OilCredit): Observable<ApiResponse<OilCredit>> {
    return this.http.put<ApiResponse<OilCredit>>(`${this.baseUrl}`, OilCredit);
  }


}
