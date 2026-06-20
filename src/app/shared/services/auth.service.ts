import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface UserDTO {
  username: string;
  phone: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  langKey: string;
  activated: boolean;
}
export interface OSMUserOUTDTO {
  id: string; // UUID from backend
  // ... other backend fields if needed
}
export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly api = environment.apiUrl + '/api/security';

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.api}/login`, { username, password });
  }

  requestPasswordReset(identifier: string): Observable<any> {
    const url = `${this.api}/user/auth/resetPassword`; // removed `/user`
    const params = new HttpParams().set('identifier', identifier);

    return this.http.post<OSMUserOUTDTO>(url, null, { params });
  }
  // 2) Validate the code
  validateResetCode(userId: string, code: string): Observable<void> {
    const url = `${this.api}/user/auth/validateResetCode/${userId}`;
    const params = new HttpParams().set('code', code);
    return this.http.post<void>(url, null, { params });
  }

  // 3) Update password
  updatePassword(userId: string, dto: any): Observable<void> {
    const url = `${this.api}/user/auth/updatePassword/${userId}`;
    return this.http.post<void>(url, dto);
  }
  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${this.api}/set-password?token=${token}`, { newPassword });
  }

  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  logout(): void {
    localStorage.removeItem('jwt_token');
  }
}
