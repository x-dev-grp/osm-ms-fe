import { HttpClient } from '@angular/common/http';
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


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly api = environment.apiUrl + '/api/security';

  constructor(private http: HttpClient) { }

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(
      `${this.api}/login`,
      { username, password }
    );
  }
  signup(userDTO: UserDTO): Observable<any> {
    return this.http.post<any>(
      `${this.api}/signup`,
      userDTO
    );
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post<any>(
      `${this.api}/set-password?token=${token}`,
      { newPassword }
    );
  }

  saveToken(token: string): void {
    localStorage.setItem('jwt_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('jwt_token');
  }
}
