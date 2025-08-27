import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response';
import {Department} from "../model/department.model";


@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private baseUrl = `${environment.apiUrl}/api/hr/department`;

  constructor(private http: HttpClient) {}

  // Récupérer tous les départements
  getAllDepartments(): Observable<ApiResponse<Department[]>> {
    return this.http.get<ApiResponse<Department[]>>(`${this.baseUrl}/fetchAll`);
  }

  // Récupérer un département par ID
  getDepartment(id: string): Observable<ApiResponse<Department>> {
    return this.http.get<ApiResponse<Department>>(`${this.baseUrl}/fetch/${id}`);
  }

  // Ajouter un département
  addDepartment(department: Department): Observable<ApiResponse<Department>> {
    return this.http.post<ApiResponse<Department>>(`${this.baseUrl}`, department);
  }

  // Mettre à jour un département
  updateDepartment(department: Department): Observable<ApiResponse<Department>> {
    return this.http.put<ApiResponse<Department>>(`${this.baseUrl}`, department);
  }
}
