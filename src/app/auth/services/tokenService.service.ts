// src/app/services/cookie.service.ts
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private tokenKey = 'auth_token'; // Name of the cookie
  private refreshTokenKey = 'auth_refresh_token';
  constructor(private cookieService: CookieService) {}

  // Set token in the cookie
  setToken(token: string): void {
    this.cookieService.set(this.tokenKey, token);
  }
  // Set token in the cookie
  setRefreshToken(token: string): void {
    this.cookieService.set(this.refreshTokenKey, token);
  }
  // Get token from the cookie
  getToken(): string | null {
    return this.cookieService.get(this.tokenKey);
  }
  getRefreshToken(): string | null {
    return this.cookieService.get(this.refreshTokenKey);
  }
  // Delete token from the cookie
  deleteToken(): void {
    this.cookieService.delete(this.tokenKey);
    this.cookieService.delete(this.refreshTokenKey);
  }
}
