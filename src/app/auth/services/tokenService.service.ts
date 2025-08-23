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
    // this._cookieService.set(this.tokenKey, token, {
    //   expires: 3,
    //   path: '/',
    //   secure: true,
    //   sameSite: 'Strict'
    // });
    sessionStorage.setItem(this.tokenKey, token);
  }
  // Set refresh token in the cookie
  setRefreshToken(refreshToken: string): void {
    // this._cookieService.set(this.refreshTokenKey, refreshToken, {
    //   expires: 3,
    //   path: '/',
    //   secure: true,
    //   sameSite: 'Strict'
    // });
    sessionStorage.setItem(this.refreshTokenKey, refreshToken);

  }
  // Get token from the cookie
  getToken(): string | null {
   // return this._cookieService.get(this.tokenKey);
    return sessionStorage.getItem(this.tokenKey);
  }
  getRefreshToken(): string | null{
    //return this._cookieService.get(this.refreshTokenKey);
    return  sessionStorage.getItem(this.refreshTokenKey);
  }
  // Delete token from the cookie
  // deleteToken(): void {
  //   this._cookieService.delete(this.tokenKey);
  //   this._cookieService.delete(this.refreshTokenKey);
  // }
  clearTokens(): void {
    // this._cookieService.delete(this.tokenKey, '/');
    // this._cookieService.delete(this.refreshTokenKey, '/');
     sessionStorage.removeItem(this.tokenKey);
     sessionStorage.removeItem(this.refreshTokenKey);
  }
  decodeToken() {
    //const token = this._cookieService.get(this.tokenKey);
    const token = sessionStorage.getItem(this.tokenKey);
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
