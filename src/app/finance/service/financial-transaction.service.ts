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
   * Get all transactions
   */
  getAllTransactions(): Observable<ApiResponse<FinancialTransaction>> {
    return this.http.get<ApiResponse<FinancialTransaction>>(`${this.baseUrl}/fetchAll`);
  }

  /**
   * Get transaction by ID
   */
  getTransactionById(id: string): Observable<ApiResponse<FinancialTransaction>> {
    return this.http.get<ApiResponse<FinancialTransaction>>(`${this.baseUrl}/fetch/${id}`);
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


  getTransactionsByBankId(
    bankId: string,
  ): Observable<ApiResponse<FinancialTransaction>> {

    // Example endpoint: /api/finance/transactions/bank/{bankId}?page=&size=
    return this.http.get<ApiResponse<FinancialTransaction>>(
      `${this.baseUrl}/bank/${bankId}`,
     );
  }

}
