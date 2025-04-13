// angular import
import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

// project import
import { AppConfig, environment } from 'src/environments/environment';
import { User } from '../types/user';

// Import the 'map' operator from 'rxjs/operators'
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private router = inject(Router);
  private http = inject(HttpClient);

  private currentUserSignal = signal<User | null>(null);
  isLogin: boolean = false;

  constructor() {
    // Initialize the signal with the current user from localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSignal.set(JSON.parse(storedUser) as User);
      this.isLogin = true;
    }
  }

  public get currentUserValue(): User | null {
    // Access the current user value from the signal
    return this.currentUserSignal();
  }

  public get currentUserName(): string | null {
    const currentUser = this.currentUserValue;
    return currentUser ? currentUser.user.name : null;
  }


  login(payload:any) {
    const body = new URLSearchParams();
    body.set('grant_type', 'TOKEN'); // Use the appropriate grant type e.g. 'client_credentials'
    body.set('username', payload.username);
    body.set('password', payload.password);


    const headers = new HttpHeaders({
      authorization: AppConfig.authentication.authorization_header,
      'Content-Type': 'application/x-www-form-urlencoded'
    });
    return this.http.post<any>(`${AppConfig.authentication.authorization}`,body.toString(),{headers});
  }


  isLoggedIn() {
    return this.isLogin;
  }

  logout() {
    // Remove user from local storage to log user out
    localStorage.removeItem('currentUser');
    this.isLogin = false;
    // Update the signal to null
    this.currentUserSignal.set(null);
    this.router.navigate(['/auth/login']);
  }
}
