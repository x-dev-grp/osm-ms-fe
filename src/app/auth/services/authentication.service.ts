// angular import
import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

// project import
import { AppConfig } from 'src/environments/environment';
import { User } from '../../@theme/types/user';
import { TokenService } from 'src/app/auth/services/tokenService.service';
import { Observable } from 'rxjs';

// Import the 'map' operator from 'rxjs/operators'

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private router = inject(Router);
  private http = inject(HttpClient);
  private _tokenService=inject(TokenService);
  private currentUserSignal = signal<User | null>(null);
  isLogin: boolean = false;

  constructor() {
    const token=this._tokenService.getToken();
    const decoded =this._tokenService.decodeToken()
    console.log(decoded)
  }

  public get currentUserValue(): User | null {
    // Access the current user value from the signal
    return this.currentUserSignal(); 
  }

  public get currentUserName(): string | null {
    const currentUser = this.currentUserValue;
    return currentUser ? currentUser?.user?.name : null;
  }

  login(payload: any):Observable<any> {
    const body = new URLSearchParams();
    body.set('grant_type', 'TOKEN'); // Use the appropriate grant type e.g. 'client_credentials'
    body.set('username', payload.username);
    body.set('password', payload.password);

    this.isLogin = true;
    const headers = new HttpHeaders({
      authorization: AppConfig.authentication.authorization_header,
      'Content-Type': 'application/x-www-form-urlencoded'
    });
    return this.http.post<any>(`${AppConfig.authentication.authorization}`, body.toString(), { headers });
  }
  refreshToken(refreshToken:string):Observable<any> {
    const body = new URLSearchParams();
    body.set('grant_type', 'refresh_token'); // Use the appropriate grant type e.g. 'client_credentials'
    body.set('refresh_token', refreshToken);

    this.isLogin = true;
    const headers = new HttpHeaders({
      authorization: AppConfig.authentication.authorization_header,
      'Content-Type': 'application/x-www-form-urlencoded'
    });
    return this.http.post<any>(`${AppConfig.authentication.authorization}`, body.toString(), { headers });
  }

  isLoggedIn() {
    return this.isLogin;
  }

  logout() {
     this._tokenService.deleteToken()
     this.router.navigate(["/login"])  }
}
  