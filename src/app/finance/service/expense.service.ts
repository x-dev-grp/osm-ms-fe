import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
 import { ApiResponse } from '../models/api-response';
import { Expense } from '../models/expense.model';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private baseUrl = '/api/finance/expense';
  constructor(private http: HttpClient) {}


  // Get all deliveries with pagination.
  getAllBanks(page: number, size: number): Observable<ApiResponse<never>> {
    return this.http.get<ApiResponse<never>>(`${this.baseUrl}/fetchAll?page=${page}&size=${size}`);
  }

  getAllExpensesList(): Observable<ApiResponse<Expense>> {
    return this.http.get<ApiResponse<Expense>>(`${this.baseUrl}/fetchAll`);
  }

  // Retrieve a single Expensecc by ID.
  getExpense(id: string): Observable<ApiResponse<Expense>> {
    return this.http.get<ApiResponse<Expense>>(`${this.baseUrl}/fetch/${id}`);
  }


  // Create a new Expensecc. The Expensecc payload may include qualityControlResults.
  createExpense(Expense: Expense): Observable<ApiResponse<Expense>> {
    return this.http.post<ApiResponse<Expense>>(this.baseUrl, Expense);
  }

  // Update an existing Expense.
  updateExpense(Expense: Expense): Observable<ApiResponse<Expense>> {
    return this.http.put<ApiResponse<Expense>>(`${this.baseUrl}`, Expense);
  }

  // Delete a Expensecc by ID.
  deleteExpense(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}
