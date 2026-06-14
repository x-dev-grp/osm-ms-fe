// angular import
import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

// project import
import { AppConfig } from 'src/environments/environment';
import { User } from '../../theme/types/user';
import { TokenService } from 'src/app/auth/services/tokenService.service';
import { Role } from 'src/app/theme/types/role';

// Import the 'map' operator from 'rxjs/operators'

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private router = inject(Router);
  private http = inject(HttpClient);
  private _tokenService = inject(TokenService);
  private readonly STORAGE_KEY = 'company_profile';
  private currentUserSignal = signal<User | null>(null);

  constructor() {
    const decodedToken = this._tokenService.decodeToken() as unknown;
    if (decodedToken != null) {
      console.log(decodedToken);
      const role: string = (decodedToken as Record<string, unknown>)['role'] as string;
      const permissions = (decodedToken as Record<string, unknown>)['authorities'];
      const osmUser = (decodedToken as Record<string, unknown>)['osmUser'];
      if (osmUser && typeof osmUser === 'object') {
        const user: User = structuredClone(osmUser as User);
        user.role = role;
        user.permissions = permissions;
        console.log(user);
        this.setCurrentUserValue = user;
      }
    }
    // Check for remembered login
    this.checkRememberedLogin();
  }

  public set setCurrentUserValue(user: User | null) {
    this.currentUserSignal.set(user);
  }

  public get currentUserValue(): User | null {
    // Access the current user valueg from the signal
    return this.currentUserSignal();
  }

  public get currentUserName(): string | null {
    return this.currentUserValue?.username || null;
  }

  hasPermission(permission: string): boolean {
    const user = this.currentUserValue;
    if (!user) return false;

    // Admin has all permissions
    if (user.role === Role.Admin) return true;

    return user.permissions.includes(permission);
  }
hasModule(module:string){
  const user = this.currentUserValue;
  if (!user) return false;

  // Admin has all permissions
  if (user.role === Role.Admin) return true;

  return user.permissions.map((p:string)=>p.toString().substring(0,p.indexOf(":"))).includes(module);
}
  hasRole(role: string): boolean {
    const user = this.currentUserValue;
    return user?.role === role || false;
  }

  /**
   * Checks if the user has any of the specified permissions
   * @param permissions - An array of permission strings to check
   * @returns Returns true if the user has at least one of the specified permissions, false otherwise
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some((permission) => this.hasPermission(permission)); // Using Array.some() to check if at least one permission exists
  }
  hasAnyModule(modules: string[]): boolean {
    return modules.some((m) => this.hasModule(m)); // Using Array.some() to check if at least one permission exists
  }

  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every((permission) => this.hasPermission(permission));
  }

  isAdmin(): boolean {
    return this.currentUserValue?.role === Role.Admin;
  }

  login(payload: Record<string, string>): Observable<Record<string, unknown>> {
    const body = new URLSearchParams();
    body.set('grant_type', 'TOKEN');
    body.set('client_id', AppConfig.authentication.client_id);
    body.set('username', payload['username']);
    body.set('password', payload['password']);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });
    // Logging for debugging in production
    console.log('[AuthService] Login request:', {
      url: AppConfig.authentication.authorization,
      payload: { ...payload, password: '***' }, // mask password
      headers: headers.keys().reduce((acc, key) => ({ ...acc, [key]: headers.get(key) }), {})
    });
    return this.http.post<Record<string, unknown>>(`${AppConfig.authentication.authorization}`, body.toString(), { headers }).pipe(
      // Log the response for debugging
      tap((response) => {
        console.log('[AuthService] Login response:', response);
      }),
      catchError((error) => {
        console.error('[AuthService] Login error:', error);
        throw error;
      })
    );
  }

  refreshToken(refreshToken: string | null): Observable<Record<string, unknown>> {
    const body = new URLSearchParams();
    body.set('grant_type', 'refresh_token');
    body.set('client_id', AppConfig.authentication.client_id);
    body.set('refresh_token', refreshToken ?? '');
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });
    return this.http.post<Record<string, unknown>>(`${AppConfig.authentication.authorization}`, body.toString(), { headers });
  }

  logout(queryParams?: string) {
    this._tokenService.clearTokens();
    // this._companyProfileService.clearCache();
    localStorage.removeItem(this.STORAGE_KEY);
    this.setCurrentUserValue = null;
    if (!queryParams) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.router.navigate(['/auth/login'], {
      queryParams: { error: queryParams }
    });
  }

  // Check for remembered login
  private checkRememberedLogin(): void {
    const rememberMe = localStorage.getItem('rememberMe');
    const expiry = localStorage.getItem('rememberMeExpiry');

    if (rememberMe === 'true' && expiry) {
      const expiryDate = new Date(expiry);
      const now = new Date();

      // Check if the remember me token is still valid
      if (expiryDate > now) {
        const rememberedUsername = localStorage.getItem('rememberedUsername');
        if (rememberedUsername) {
          // We have a remembered username, but we still need the user to enter password
          // The username field can be pre-filled in the login form
        }
      } else {
        // Clear expired remember me data
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberMeExpiry');
        localStorage.removeItem('rememberedUsername');
      }
    }
  }
}
