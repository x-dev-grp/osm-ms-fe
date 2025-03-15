import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  // This base URL points to your Gateway, which routes to the security microservice
  private baseUrl = '/api/security';

  constructor(private http: HttpClient) {}

  // Example login endpoint
  loginUsier(username: string, password: string): Observable<any> {
    const payload = { username, password };
    return this.http.post<any>(`${this.baseUrl}/login`, payload);
  }
}
