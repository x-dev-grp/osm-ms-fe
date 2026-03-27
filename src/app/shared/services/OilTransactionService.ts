import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { OilTransaction, TransactionState } from '../models/OilTransaction';
import { ApiResponse } from '../models/api-response';
import {QrCodeRequest, QrCodeResponse} from "../models/qr-models";

// Interface for exchange completion payload
export interface ExchangeCompletionPayload {
  id: string;
  storageUnitDestinationId: string;
  oilQuantity: number;
  oilUnitPrice: number;
  qualityGrade: string;
  notes?: string;
  transactionState: TransactionState;
}

@Injectable({
  providedIn: 'root'
})
export class OilTransactionService {
  private readonly baseUrl = `${environment.apiUrl}/api/production/oil_transaction`;

  constructor(private http: HttpClient) {}

  /** Get all transactions */
  getAll(): Observable<OilTransaction[]> {
    return this.http.get<OilTransaction[]>(this.baseUrl);
  }

  /** Get a single transaction by its ID */

  getById(id: string): Observable<ApiResponse<OilTransaction>> {
    return this.http.get<ApiResponse<OilTransaction>>(`${this.baseUrl}/fetch/${id}`);
  }

  /** Create a new transaction */
  create(tx: Partial<OilTransaction>): Observable<OilTransaction> {
    return this.http.post<OilTransaction>(this.baseUrl, tx);
  }

  /** Update an existing transaction */
  update(id: string, tx: Partial<OilTransaction>): Observable<OilTransaction> {
    return this.http.put<OilTransaction>(`${this.baseUrl}/${id}`, tx);
  }

  /** Fetch all transactions for a given storage unit */
  getByStorageUnit(storageUnitId: string): Observable<OilTransaction[]> {
    return this.http.get<OilTransaction[]>(`${this.baseUrl}/storage-unit/${storageUnitId}`);
  }

  // Get all oil transactions with pagination
  getAllOilTransactions(page: number, size: number): Observable<ApiResponse<never>> {
    return this.http.get<ApiResponse<never>>(`${this.baseUrl}/fetchAll?page=${page}&size=${size}`);
  }

  // Get all oil transactions list
  getAllOilTransactionsList(): Observable<ApiResponse<OilTransaction>> {
    return this.http.get<ApiResponse<OilTransaction>>(`${this.baseUrl}/fetchAll`);
  }

  // Retrieve a single oil transaction by ID
  getOilTransaction(id: string): Observable<ApiResponse<OilTransaction>> {
    return this.http.get<ApiResponse<OilTransaction>>(`${this.baseUrl}/fetch/${id}`);
  }

  // Create a new oil transaction
  createOilTransaction(oilTransaction: OilTransaction): Observable<ApiResponse<OilTransaction>> {
    return this.http.post<ApiResponse<OilTransaction>>(`${this.baseUrl}`, oilTransaction);
  }
  createOilTransactionForSale(oilTransaction: OilTransaction): Observable<ApiResponse<OilTransaction>> {
    return this.http.post<ApiResponse<OilTransaction>>(`${this.baseUrl}/create-for-sale`, oilTransaction);
  }

  // Update an existing oil transaction
  updateOilTransaction(oilTransaction: OilTransaction): Observable<ApiResponse<OilTransaction>> {
    return this.http.put<ApiResponse<OilTransaction>>(`${this.baseUrl}/${oilTransaction.id}`, oilTransaction);
  }

  // Delete an oil transaction by ID
  deleteOilTransaction(id: string): Observable<{ success: boolean; message: string; data: void }> {
    return this.http.delete<{ success: boolean; message: string; data: void }>(`${this.baseUrl}/${id}`);
  }

  // Complete an exchange transaction
  completeExchange(payload: ExchangeCompletionPayload): Observable<ApiResponse<OilTransaction>> {
    return this.http.post<ApiResponse<OilTransaction>>(`${this.baseUrl}/complete-exchange`, payload);
  }

  // Approve an oil transaction
  approveOilTransaction(oilTransaction: OilTransaction): Observable<ApiResponse<OilTransaction>> {
    return this.http.put<ApiResponse<OilTransaction>>(`${this.baseUrl}/approve`, oilTransaction);
  }
  generateQrCode(request: QrCodeRequest): Observable<QrCodeResponse> {
    return this.http.post<QrCodeResponse>(`${this.baseUrl}/generate`, request);
  }
}
