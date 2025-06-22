// src/app/services/cookie.service.ts
import { inject, Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private tokenKey = 'auth_token';
  private refreshTokenKey = 'auth_refresh_token';
  constructor() {}
  private _cookieService = inject(CookieService);
  // Set token in the cookie
  setToken(token: string): void {
    this._cookieService.set(this.tokenKey, token, {
      expires: 3,
      path: '/',
      secure: true,
      sameSite: 'Lax'
    });
  }
  // Set refresh token in the cookie
  setRefreshToken(refreshToken: string): void {
    this._cookieService.set(this.refreshTokenKey, refreshToken, {
      expires: 3,
      path: '/',
      secure: true,
      sameSite: 'Lax'
    });
  }
  // Get token from the cookie
  getToken(): string | null {
    const token = this._cookieService.get(this.tokenKey);
    return token ? token : null;
  }
  getRefreshToken(): string | null {
    const refreshToken = this._cookieService.get(this.refreshTokenKey);
    return refreshToken ? refreshToken : null;
  }
  // Delete token from the cookie
  // deleteToken(): void {
  //   this._cookieService.delete(this.tokenKey);
  //   this._cookieService.delete(this.refreshTokenKey);
  // }
  clearTokens(): void {
    this._cookieService.delete(this.tokenKey, '/');
    this._cookieService.delete(this.refreshTokenKey, '/');
  }
  decodeToken() {
    const token = this._cookieService.get(this.tokenKey);

    if (token && token.split('.').length === 3) {
      try {
        return jwtDecode(token);
      } catch (e) {
        console.error('Invalid token:', e);
        return null;
      }
    }

    console.warn('Token is missing or not a valid JWT');
    return null;
  }
}
