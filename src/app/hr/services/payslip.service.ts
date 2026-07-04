import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';
import { Payslip } from '../models/payslip.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PayslipService {
  private baseUrl = environment.apiUrl + '/api/hr/payslips';

  constructor(private http: HttpClient) {}

  getAllList(): Observable<ApiResponse<Payslip>> {
    return this.http.get<ApiResponse<Payslip>>(`${this.baseUrl}/fetchAll`);
  }

  getPayslip(id: string): Observable<ApiSingleResponse<Payslip>> {
    return this.http.get<ApiSingleResponse<Payslip>>(`${this.baseUrl}/fetch/${id}`);
  }

  createPayslip(payslip: Payslip): Observable<ApiSingleResponse<Payslip>> {
    return this.http.post<ApiSingleResponse<Payslip>>(`${this.baseUrl}`, payslip);
  }

  updatePayslip(payslip: Payslip): Observable<ApiSingleResponse<Payslip>> {
    return this.http.put<ApiSingleResponse<Payslip>>(`${this.baseUrl}`, payslip);
  }

  deletePayslip(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }
}
