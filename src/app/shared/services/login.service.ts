import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  // This base URL points to your Gateway, which routes to the security microservice
  private baseUrl = environment.apiUrl + '/api/security';

  constructor(private http: HttpClient) {}

  // Example login endpoint
  // Example login endpoint
  loginUser(username: string, password: string): Observable<any> {
    const payload = { username, password };
    return this.http.post(`${this.baseUrl}/login`, payload, { responseType: 'text' });
  }
}
