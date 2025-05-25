import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response';
import { Expense } from '../models/expense.model';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private baseUrl = '/api/finance/expense';
  constructor(private http: HttpClient) {}

  getExpense(id: string): Observable<ApiResponse<Expense>> {
    return this.http.get<ApiResponse<Expense>>(`${this.baseUrl}/fetch/${id}`);
  }

  createExpense(expense: Expense): Observable<ApiResponse<Expense>> {
    return this.http.post<ApiResponse<Expense>>(`${this.baseUrl}`, expense);
  }

  updateExpense(expense: Expense): Observable<ApiResponse<Expense>> {
    return this.http.put<ApiResponse<Expense>>(`${this.baseUrl}`, expense);
  }

  deleteExpense(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}
