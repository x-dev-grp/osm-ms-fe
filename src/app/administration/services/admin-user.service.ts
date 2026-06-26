import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../../theme/types/user';

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly baseUrl = `${environment.apiUrl}/api/security/admin/users`;

  constructor(private http: HttpClient) {}

  createOosmAdminUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/osm-admin`, user);
  }

  issueTemporaryPassword(userId: string): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/${userId}/issue-temporary-password`, null);
  }
}
