import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {Observable} from "rxjs";

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

  constructor(private http: HttpClient) { }

  login(username: string, password: string): Observable<any>  {
    return this.http.post<any>('/api/security/login', { username, password });
  }
  signup(userDTO: UserDTO): Observable<any> {
    return this.http.post<any>('/api/security/signup', userDTO);
  }
  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }
// Method to send the password reset request to the backend
  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`/api/security/set-password?token=${token}`, { newPassword });
  }
  logout() {
    localStorage.removeItem('jwt_token');
  }
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
  // Log the user in (this should be replaced with your actual login logic)
  saveToken(token: string): void {
    localStorage.setItem('token', token);
  }


}
