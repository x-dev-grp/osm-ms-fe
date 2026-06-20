import { inject, Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private static readonly SESSION_ACCESS_KEY = 'auth_token';
  private static readonly SESSION_REFRESH_KEY = 'auth_refresh_token';
  private static readonly PERSISTENT_ACCESS_KEY = 'auth_token_remember';
  private static readonly PERSISTENT_REFRESH_KEY = 'auth_refresh_token_remember';
  private static readonly REMEMBER_ME_KEY = 'rememberMe';
  private static readonly REMEMBER_ME_EXPIRY_KEY = 'rememberMeExpiry';
  private static readonly REMEMBERED_USERNAME_KEY = 'rememberedUsername';
  private static readonly REMEMBER_ME_TTL_MS = 24 * 60 * 60 * 1000;

  persistLogin(accessToken: string, refreshToken: string, rememberMe: boolean, username?: string): void {
    if (rememberMe) {
      const expiryDate = new Date(Date.now() + TokenService.REMEMBER_ME_TTL_MS);
      localStorage.setItem(TokenService.REMEMBER_ME_KEY, 'true');
      localStorage.setItem(TokenService.REMEMBER_ME_EXPIRY_KEY, expiryDate.toISOString());
      if (username) {
        localStorage.setItem(TokenService.REMEMBERED_USERNAME_KEY, username);
      }
      localStorage.setItem(TokenService.PERSISTENT_ACCESS_KEY, accessToken);
      localStorage.setItem(TokenService.PERSISTENT_REFRESH_KEY, refreshToken);
      sessionStorage.removeItem(TokenService.SESSION_ACCESS_KEY);
      sessionStorage.removeItem(TokenService.SESSION_REFRESH_KEY);
      return;
    }

    this.clearRememberMe();
    sessionStorage.setItem(TokenService.SESSION_ACCESS_KEY, accessToken);
    sessionStorage.setItem(TokenService.SESSION_REFRESH_KEY, refreshToken);
  }

  isRememberMeActive(): boolean {
    return this.isRememberMeValid();
  }

  isAccessTokenExpired(leewaySeconds = 30): boolean {
    const decoded = this.decodeToken();
    const exp = decoded?.['exp'];
    if (typeof exp !== 'number') {
      return true;
    }
    return Date.now() >= exp * 1000 - leewaySeconds * 1000;
  }

  getRememberedUsername(): string | null {
    if (!this.isRememberMeValid()) {
      return null;
    }
    return localStorage.getItem(TokenService.REMEMBERED_USERNAME_KEY);
  }

  purgeExpiredRememberMe(): void {
    if (localStorage.getItem(TokenService.REMEMBER_ME_KEY) === 'true' && !this.isRememberMeValid()) {
      this.clearRememberMe();
    }
  }

  setToken(token: string): void {
    if (this.isRememberMeValid()) {
      localStorage.setItem(TokenService.PERSISTENT_ACCESS_KEY, token);
      return;
    }
    sessionStorage.setItem(TokenService.SESSION_ACCESS_KEY, token);
  }

  setRefreshToken(refreshToken: string): void {
    if (this.isRememberMeValid()) {
      localStorage.setItem(TokenService.PERSISTENT_REFRESH_KEY, refreshToken);
      return;
    }
    sessionStorage.setItem(TokenService.SESSION_REFRESH_KEY, refreshToken);
  }

  getToken(): string | null {
    if (this.isRememberMeValid()) {
      return localStorage.getItem(TokenService.PERSISTENT_ACCESS_KEY);
    }
    return sessionStorage.getItem(TokenService.SESSION_ACCESS_KEY);
  }

  getRefreshToken(): string | null {
    if (this.isRememberMeValid()) {
      return localStorage.getItem(TokenService.PERSISTENT_REFRESH_KEY);
    }
    return sessionStorage.getItem(TokenService.SESSION_REFRESH_KEY);
  }

  clearTokens(): void {
    sessionStorage.removeItem(TokenService.SESSION_ACCESS_KEY);
    sessionStorage.removeItem(TokenService.SESSION_REFRESH_KEY);
    this.clearRememberMe();
  }

  decodeToken(): Record<string, unknown> | null {
    const token = this.getToken();
    if (token && token.split('.').length === 3) {
      try {
        return jwtDecode(token) as Record<string, unknown>;
      } catch (e) {
        console.error('Invalid token:', e);
        return null;
      }
    }
    return null;
  }

  private isRememberMeValid(): boolean {
    if (localStorage.getItem(TokenService.REMEMBER_ME_KEY) !== 'true') {
      return false;
    }

    const expiry = localStorage.getItem(TokenService.REMEMBER_ME_EXPIRY_KEY);
    if (!expiry) {
      return false;
    }

    return new Date(expiry) > new Date();
  }

  private clearRememberMe(): void {
    localStorage.removeItem(TokenService.REMEMBER_ME_KEY);
    localStorage.removeItem(TokenService.REMEMBER_ME_EXPIRY_KEY);
    localStorage.removeItem(TokenService.REMEMBERED_USERNAME_KEY);
    localStorage.removeItem(TokenService.PERSISTENT_ACCESS_KEY);
    localStorage.removeItem(TokenService.PERSISTENT_REFRESH_KEY);
  }
}
