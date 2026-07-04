import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';
import { PayrollPeriod } from '../models/payroll-period.model';
import { PayrollPeriodStatus } from '../models/hr.enums';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PayrollPeriodService {
  private baseUrl = environment.apiUrl + '/api/hr/payroll-periods';

  constructor(private http: HttpClient) {}

  getAllList(): Observable<ApiResponse<PayrollPeriod>> {
    return this.http.get<ApiResponse<PayrollPeriod>>(`${this.baseUrl}/fetchAll`);
  }

  getPayrollPeriod(id: string): Observable<ApiSingleResponse<PayrollPeriod>> {
    return this.http.get<ApiSingleResponse<PayrollPeriod>>(`${this.baseUrl}/fetch/${id}`);
  }

  createPayrollPeriod(period: PayrollPeriod): Observable<ApiSingleResponse<PayrollPeriod>> {
    return this.http.post<ApiSingleResponse<PayrollPeriod>>(`${this.baseUrl}`, period);
  }

  updatePayrollPeriod(period: PayrollPeriod): Observable<ApiSingleResponse<PayrollPeriod>> {
    return this.http.put<ApiSingleResponse<PayrollPeriod>>(`${this.baseUrl}`, period);
  }

  deletePayrollPeriod(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }

  generatePayslips(id: string): Observable<ApiResponse<PayrollPeriod>> {
    return this.http.post<ApiResponse<PayrollPeriod>>(`${this.baseUrl}/${id}/generate-payslips`, {});
  }

  advanceStatus(id: string, status: PayrollPeriodStatus): Observable<ApiResponse<PayrollPeriod>> {
    return this.http.patch<ApiResponse<PayrollPeriod>>(`${this.baseUrl}/${id}/status/${status}`, {});
  }
}
