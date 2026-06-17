import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  FinancialTransaction
} from '../models/financial-transaction.model';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';

export interface SupplierFinancialSummary {
  supplierId?: string;
  transactionCount: number;
  totalAmount: number;
  totalPaidAmount: number;
  totalUnpaidAmount: number;
  inboundAmount: number;
  outboundAmount: number;
  inboundCount: number;
  outboundCount: number;
}

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
  getTransactionById(id: string): Observable<ApiSingleResponse<FinancialTransaction>> {
    return this.http.get<ApiSingleResponse<FinancialTransaction>>(`${this.baseUrl}/fetch/${id}`);
  }

  /**
   * Create new transaction
   */
  createTransaction(dto: FinancialTransaction): Observable<ApiSingleResponse<FinancialTransaction>> {
    return this.http.post<ApiSingleResponse<FinancialTransaction>>(`${this.baseUrl}`, dto);
  }

  /**
   * Update transaction
   */
  updateTransaction(dto: FinancialTransaction): Observable<ApiSingleResponse<FinancialTransaction>> {
    return this.http.put<ApiSingleResponse<FinancialTransaction>>(`${this.baseUrl}/${dto.id}`, dto);
  }

  /**
   * Delete transaction
   */


  /**
   * Approve transaction
   */
  approveTransaction(id: string): Observable<ApiSingleResponse<FinancialTransaction>> {
    return this.http.post<ApiSingleResponse<FinancialTransaction>>(`${this.baseUrl}/${id}/approve`, {});
  }

  /**
   * Reject transaction
   */
  rejectTransaction(id: string, reason?: string): Observable<ApiSingleResponse<FinancialTransaction>> {
    return this.http.post<ApiSingleResponse<FinancialTransaction>>(`${this.baseUrl}/${id}/reject`, { reason });
  }


  getTransactionsByBankId(
    bankId: string,
  ): Observable<ApiResponse<FinancialTransaction>> {

    // Example endpoint: /api/finance/transactions/bank/{bankId}?page=&size=
    return this.http.get<ApiResponse<FinancialTransaction>>(
      `${this.baseUrl}/bank/${bankId}`,
     );
  }

  getTransactionsBySupplier(supplierId: string): Observable<ApiResponse<FinancialTransaction>> {
    return this.http.get<ApiResponse<FinancialTransaction>>(`${this.baseUrl}/supplier/${supplierId}`);
  }

  getSupplierFinancialSummary(supplierId: string): Observable<SupplierFinancialSummary> {
    return this.http.get<SupplierFinancialSummary>(`${this.baseUrl}/supplier/${supplierId}/summary`);
  }

}
