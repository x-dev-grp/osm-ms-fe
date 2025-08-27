import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response';
import { Contract } from '../model/contract.model';

@Injectable({
  providedIn: 'root'
})
export class ContractService {
  private baseUrl = `${environment.apiUrl}/api/hr/contract`;

  constructor(private http: HttpClient) {}

  // Ajouter un contrat à un employé
  addContractEmployee(employeeId: string, contract: Contract): Observable<ApiResponse<Contract>> {
    return this.http.post<ApiResponse<Contract>>(`${this.baseUrl}/employee/${employeeId}`, contract);
  }
  // Get contract by id
  getContract(id: string): Observable<ApiResponse<Contract>> {
    return this.http.get<ApiResponse<Contract>>(`${this.baseUrl}/fetch/${id}`);
  }

  //Add a new contract
  addContract(contract: Contract): Observable<ApiResponse<Contract>> {
    return this.http.post<ApiResponse<Contract>>(`${this.baseUrl}`, contract);
  }

  // Update an existing contract
  updateContract(contract: Contract): Observable<ApiResponse<Contract>> {
    return this.http.put<ApiResponse<Contract>>(`${this.baseUrl}`, contract);
  }

  // Delete a contract
  deleteContract(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
  //  Récupérer tous les contrats d’un employé
  getContractsByEmployee(employeeId: string): Observable<ApiResponse<Contract[]>> {
    return this.http.get<ApiResponse<Contract[]>>(`${this.baseUrl}/employee/${employeeId}`);
  }

// Récupérer tous les contrats
  getAllContracts(): Observable<ApiResponse<Contract[]>> {
    return this.http.get<ApiResponse<Contract[]>>(`${this.baseUrl}/fetchAll`);
  }
  updateEmployeeContract(employeeId: string, contractId: string, contract: Contract): Observable<ApiResponse<Contract>> {
    return this.http.put<ApiResponse<Contract>>(
      `${this.baseUrl}/employee/${employeeId}/${contractId}`,
      contract
    );
  }





}
