// angular import
import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

// project import
import { AppConfig } from 'src/environments/environment';
import { User } from '../../@theme/types/user';
import { TokenService } from 'src/app/auth/services/tokenService.service';
import { Role } from 'src/app/@theme/types/role';
import { CompanyProfileService } from '../../shared/services/company-profile.service';

// Import the 'map' operator from 'rxjs/operators'

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private router = inject(Router);
  private http = inject(HttpClient);
  private _tokenService = inject(TokenService);
  private _companyProfileService = inject(CompanyProfileService);
  private currentUserSignal = signal<User | null>(null);

  constructor() {
   const decodedToken = this._tokenService.decodeToken() as unknown;
   if (decodedToken != null) {
    console.log(decodedToken)
    const role: string = (decodedToken as Record<string, unknown>)['role'] as string;
    const permissions = (decodedToken as Record<string, unknown>)['authorities'];
    const osmUser = (decodedToken as Record<string, unknown>)['osmUser'];
    if (osmUser && typeof osmUser === 'object') {
      const user: User = structuredClone(osmUser as User);
      user.role = role;
      user.permissions = permissions;
      console.log(user)
      this.setCurrentUserValue = user;
    }
   }
  }

  public set setCurrentUserValue(user:User | null){
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
    const user = this.currentUserValue
    if (!user) return false;

    // Admin has all permissions
    if (user.role === Role.Admin) return true;

    return user.permissions.includes(permission);
  }

  hasRole(role: string): boolean {
    const user = this.currentUserValue;
    return user?.role === role || false;
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }
isAdmin(): boolean {
    return this.currentUserValue?.role === Role.Admin;
}
  login(payload: Record<string, string>): Observable<Record<string, unknown>> {
    const body = new URLSearchParams();
    body.set('grant_type', 'TOKEN');
    body.set('username', payload['username']);
    body.set('password', payload['password']);

    const headers = new HttpHeaders({
      authorization: AppConfig.authentication.authorization_header,
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
      tap(response => {
        console.log('[AuthService] Login response:', response);
      }),
      catchError(error => {
        console.error('[AuthService] Login error:', error);
        throw error;
      })
    );
  }
  refreshToken(refreshToken: string | null): Observable<Record<string, unknown>> {
    const body = new URLSearchParams();
    body.set('grant_type', 'refresh_token');
    body.set('refresh_token', refreshToken ?? '');
    const headers = new HttpHeaders({
      authorization: AppConfig.authentication.authorization_header,
      'Content-Type': 'application/x-www-form-urlencoded'
    });
    return this.http.post<Record<string, unknown>>(`${AppConfig.authentication.authorization}`, body.toString(), { headers });
  }


  logout(queryParams?:string) {
     this._tokenService.clearTokens()
     this._companyProfileService.clearCache();
     this.setCurrentUserValue=null;
     if(!queryParams){
      this.router.navigate(["/auth/login"])
      return;
     }
     this.router.navigate(['/auth/login'], {
      queryParams: { error: queryParams }
    });

    }
}
