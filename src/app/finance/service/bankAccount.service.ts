import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../shared/models/api-response';
import { BankAccount } from '../models/BankAccount';
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

  // Delete a BankAccountcc by ID.
  deleteBankAccount(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}
