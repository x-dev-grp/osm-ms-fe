import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Expense } from '../models/expense.model';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response';
import { QrCodeInfo, QrResolveResponse } from '../../shared/models/qr-models';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private baseUrl = environment.apiUrl + '/api/finance/expense';
  constructor(private http: HttpClient) {}

  // Get all expenses
  getAllExpenses(): Observable<ApiResponse<Expense>> {
    return this.http.get<ApiResponse<Expense>>(`${this.baseUrl}/fetchAll`);
  }

  getExpense(id: string): Observable<ApiResponse<Expense>> {
    return this.http.get<ApiResponse<Expense>>(`${this.baseUrl}/fetch/${id}`);
  }

  createExpense(expense: Expense): Observable<ApiResponse<Expense>> {
    return this.http.post<ApiResponse<Expense>>(`${this.baseUrl}`, expense);
  }

  updateExpense(expense: Expense): Observable<ApiResponse<Expense>> {
    return this.http.put<ApiResponse<Expense>>(`${this.baseUrl}`, expense);
  }

  generateQr(expenseId: string): Observable<QrCodeInfo> {
    return this.http.get<QrCodeInfo>(`${this.baseUrl}/qr/EXPENSE/${expenseId}`);
  }

  searchByCode(code: string): Observable<QrResolveResponse> {
    return this.http.get<QrResolveResponse>(`${this.baseUrl}/search/by-code`, { params: { code } });
  }

}
