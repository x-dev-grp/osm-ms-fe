import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../shared/models/api-response';
import { BankAccount, BankAccountWithTransactions } from '../models/BankAccount';
import { FinancialTransaction } from '../models/financial-transaction.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BankAccountService {
  private baseUrl = environment.apiUrl + '/api/finance/banks';

  constructor(private http: HttpClient) {}

  // Get all deliveries with pagination.
  getAllBanks(page: number, size: number): Observable<ApiResponse<never>> {
    return this.http.get<ApiResponse<never>>(`${this.baseUrl}/fetchAll?page=${page}&size=${size}`);
  }

  getAllBanksList(): Observable<ApiResponse<BankAccount>> {
    return this.http.get<ApiResponse<BankAccount>>(`${this.baseUrl}/fetchAll`);
  }

  // Retrieve a single BankAccountcc by ID.
  getBankAccount(id: string): Observable<ApiResponse<BankAccount>> {
    return this.http.get<ApiResponse<BankAccount>>(`${this.baseUrl}/fetch/${id}`);
  }

  // Create a new BankAccountcc. The BankAccountcc payload may include qualityControlResults.
  createBankAccount(bankAccount: BankAccount): Observable<ApiResponse<BankAccount>> {
    return this.http.post<ApiResponse<BankAccount>>(`${this.baseUrl}`, bankAccount);
  }

  // Update an existing BankAccountcc.
  updateBankAccount(bankAccount: BankAccount): Observable<ApiResponse<BankAccount>> {
    return this.http.put<ApiResponse<BankAccount>>(`${this.baseUrl}`, bankAccount);
  }


  // ==================== BALANCE & TRANSACTION METHODS ====================

  // Get bank account with balance information
  getBankAccountWithBalance(id: string): Observable<ApiResponse<BankAccountWithTransactions>> {
    return this.http.get<ApiResponse<BankAccountWithTransactions>>(`${this.baseUrl}/fetch/${id}/with-balance`);
  }

  // Get bank account balance
  getBankAccountBalance(id: string): Observable<ApiResponse<{balance: number, currency: string}>> {
    return this.http.get<ApiResponse<{balance: number, currency: string}>>(`${this.baseUrl}/${id}/balance`);
  }

  // Get transactions for a specific bank account
  getBankAccountTransactions(
    bankAccountId: string,
    page: number = 0,
    size: number = 10,
    startDate?: string,
    endDate?: string
  ): Observable<ApiResponse<FinancialTransaction>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }

    return this.http.get<ApiResponse<FinancialTransaction>>(
      `${this.baseUrl}/${bankAccountId}/transactions`,
      { params }
    );
  }

  // Get transaction summary for a bank account
  getBankAccountTransactionSummary(bankAccountId: string): Observable<ApiResponse<{
    totalInbound: number;
    totalOutbound: number;
    transactionCount: number;
    pendingCount: number;
    lastTransactionDate: string;
  }>> {
    return this.http.get<ApiResponse<{
      totalInbound: number;
      totalOutbound: number;
      transactionCount: number;
      pendingCount: number;
      lastTransactionDate: string;
    }>>(`${this.baseUrl}/${bankAccountId}/summary`);
  }

  // Get all bank accounts with balances
  getAllBanksWithBalances(): Observable<ApiResponse<BankAccountWithTransactions>> {
    return this.http.get<ApiResponse<BankAccountWithTransactions>>(`${this.baseUrl}/fetchAll/with-balances`);
  }
}
