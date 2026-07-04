import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ApiSingleResponse } from '../../shared/models/api-response';
import { LeaveRequest } from '../models/leave-request.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LeaveRequestService {
  private baseUrl = environment.apiUrl + '/api/hr/leave-requests';

  constructor(private http: HttpClient) {}

  getAllList(): Observable<ApiResponse<LeaveRequest>> {
    return this.http.get<ApiResponse<LeaveRequest>>(`${this.baseUrl}/fetchAll`);
  }

  getLeaveRequest(id: string): Observable<ApiSingleResponse<LeaveRequest>> {
    return this.http.get<ApiSingleResponse<LeaveRequest>>(`${this.baseUrl}/fetch/${id}`);
  }

  createLeaveRequest(leaveRequest: LeaveRequest): Observable<ApiSingleResponse<LeaveRequest>> {
    return this.http.post<ApiSingleResponse<LeaveRequest>>(`${this.baseUrl}`, leaveRequest);
  }

  updateLeaveRequest(leaveRequest: LeaveRequest): Observable<ApiSingleResponse<LeaveRequest>> {
    return this.http.put<ApiSingleResponse<LeaveRequest>>(`${this.baseUrl}`, leaveRequest);
  }

  deleteLeaveRequest(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }

  approveLeaveRequest(id: string): Observable<ApiResponse<LeaveRequest>> {
    return this.http.patch<ApiResponse<LeaveRequest>>(`${this.baseUrl}/${id}/approve`, {});
  }

  rejectLeaveRequest(id: string): Observable<ApiResponse<LeaveRequest>> {
    return this.http.patch<ApiResponse<LeaveRequest>>(`${this.baseUrl}/${id}/reject`, {});
  }
}
