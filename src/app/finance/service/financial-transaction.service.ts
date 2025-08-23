import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  FinancialTransaction
} from '../models/financial-transaction.model';
import { ApiResponse } from '../../shared/models/api-response';

@Injectable({
  providedIn: 'root'
})
export class FinancialTransactionService {
  private baseUrl = environment.apiUrl + '/api/finance/transactions';

  constructor(private http: HttpClient) {}

  // ==================== CRUD OPERATIONS ====================


  /**
   * Get transaction by ID
   */
  getTransactionById(id: string): Observable<ApiResponse<FinancialTransaction>> {
    return this.http.get<ApiResponse<FinancialTransaction>>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create new transaction
   */
  createTransaction(dto: FinancialTransaction): Observable<ApiResponse<FinancialTransaction>> {
    return this.http.post<ApiResponse<FinancialTransaction>>(`${this.baseUrl}`, dto);
  }

  /**
   * Update transaction
   */
  updateTransaction(dto: FinancialTransaction): Observable<ApiResponse<FinancialTransaction>> {
    return this.http.put<ApiResponse<FinancialTransaction>>(`${this.baseUrl}/${dto.id}`, dto);
  }

  /**
   * Delete transaction
   */


  /**
   * Approve transaction
   */
  approveTransaction(id: string, approvedBy: string): Observable<ApiResponse<FinancialTransaction>> {
    return this.http.post<ApiResponse<FinancialTransaction>>(`${this.baseUrl}/${id}/approve`, { approvedBy });
  }

  /**
   * Reject transaction
   */
  rejectTransaction(id: string, approvedBy: string, reason?: string): Observable<ApiResponse<FinancialTransaction>> {
    return this.http.post<ApiResponse<FinancialTransaction>>(`${this.baseUrl}/${id}/reject`, { approvedBy, reason });
  }

  /**
   * Get pending transactions
   */
  getPendingTransactions(page: number = 0, size: number = 10): Observable<ApiResponse<FinancialTransaction[]>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<FinancialTransaction[]>>(`${this.baseUrl}/pending`, { params });
  }

  // ==================== EXPORT OPERATIONS ====================

  /**
   * Export transactions to Excel
   */


  // ==================== UTILITY METHODS ====================

  /**
   * Get transaction types for dropdown
   */
  getTransactionTypes(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.baseUrl}/types`);
  }

  /**
   * Get currencies for dropdown
   */
  getCurrencies(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.baseUrl}/currencies`);
  }

  /**
   * Get payment methods for dropdown
   */
  getPaymentMethods(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.baseUrl}/payment-methods`);
  }
}
