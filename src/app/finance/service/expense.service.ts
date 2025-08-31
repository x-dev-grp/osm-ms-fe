import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Expense } from '../models/expense.model';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response';

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

  deleteExpense(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}
