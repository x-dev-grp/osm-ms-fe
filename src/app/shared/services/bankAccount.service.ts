import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response';
import { BankAccount } from '../models/BankAccount';

@Injectable({
  providedIn: 'root'
})
export class BankAccountService {
  private baseUrl = '/api/production/banks';

  constructor(private http: HttpClient) {}

  // Get all deliveries with pagination.
  getAllBanks(page: number, size: number): Observable<ApiResponse<never>> {
    return this.http.get<ApiResponse<never>>(`${this.baseUrl}/fetchAll?page=${page}&size=${size}`);
  }

  getAllBanksList(): Observable<ApiResponse<BankAccount>> {
    return this.http.get<ApiResponse<BankAccount>>(`${this.baseUrl}/fetchAll`);
  }

  // Retrieve a single BankAccountcc by ID.
  getBankAccount(id: number): Observable<ApiResponse<BankAccount>> {
    return this.http.get<ApiResponse<BankAccount>>(`${this.baseUrl}/${id}`);
  }

  // Create a new BankAccountcc. The BankAccountcc payload may include qualityControlResults.
  createBankAccount(BankAccount: BankAccount): Observable<ApiResponse<BankAccount>> {
    return this.http.post<ApiResponse<BankAccount>>(this.baseUrl, BankAccount);
  }

  // Update an existing BankAccountcc.
  updateBankAccount(BankAccount: BankAccount): Observable<ApiResponse<BankAccount>> {
    return this.http.put<ApiResponse<BankAccount>>(`${this.baseUrl}`, BankAccount);
  }

  // Delete a BankAccountcc by ID.
  deleteBankAccount(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}
