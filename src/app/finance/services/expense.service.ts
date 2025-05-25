import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseType } from '../../shared/models/base-type.model';
import { TypeCategory } from '../../shared/models/type-category.enum';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private apiUrl = `${environment.apiUrl}/expense`;

  constructor(private http: HttpClient) {}

  getExpenseTypes(): Observable<BaseType[]> {
    return this.http.get<BaseType[]>(`${this.apiUrl}/types`);
  }

  getExpenseCategories(): Observable<BaseType[]> {
    return this.http.get<BaseType[]>(`${this.apiUrl}/categories`);
  }

  getPaymentMethods(): Observable<BaseType[]> {
    return this.http.get<BaseType[]>(`${this.apiUrl}/payment-methods`);
  }

  getExpenseById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createExpense(expense: any): Observable<any> {
    return this.http.post(this.apiUrl, expense);
  }

  updateExpense(expense: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${expense.id}`, expense);
  }

  deleteExpense(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
} 