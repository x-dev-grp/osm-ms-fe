import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';
import { EmploymentContract } from '../models/employment-contract.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmploymentContractService {
  private baseUrl = environment.apiUrl + '/api/hr/contracts';

  constructor(private http: HttpClient) {}

  getAllList(): Observable<ApiResponse<EmploymentContract>> {
    return this.http.get<ApiResponse<EmploymentContract>>(`${this.baseUrl}/fetchAll`);
  }

  getContract(id: string): Observable<ApiSingleResponse<EmploymentContract>> {
    return this.http.get<ApiSingleResponse<EmploymentContract>>(`${this.baseUrl}/fetch/${id}`);
  }

  createContract(contract: EmploymentContract): Observable<ApiSingleResponse<EmploymentContract>> {
    return this.http.post<ApiSingleResponse<EmploymentContract>>(`${this.baseUrl}`, contract);
  }

  updateContract(contract: EmploymentContract): Observable<ApiSingleResponse<EmploymentContract>> {
    return this.http.put<ApiSingleResponse<EmploymentContract>>(`${this.baseUrl}`, contract);
  }

  deleteContract(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }
}
