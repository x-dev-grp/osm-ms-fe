// angular import
import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

// project import
import { AppConfig } from 'src/environments/environment';
import { User } from '../../@theme/types/user';
import { TokenService } from 'src/app/auth/services/tokenService.service';
import { Observable } from 'rxjs';
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
    const decodedToken: any = this._tokenService.decodeToken();
    if (decodedToken != null) {
      console.log(decodedToken);
      const role: any = decodedToken?.role;
      const permissions = decodedToken?.permissions;
      let user: User = decodedToken?.osmUser;
      user.role = role;
      user.permissions = permissions;
      this.setCurrentUserValue = user;
    }
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

  login(payload: any): Observable<any> {
    const body = new URLSearchParams();
    body.set('grant_type', 'TOKEN'); 
    body.set('username', payload.username);
    body.set('password', payload.password);

    const headers = new HttpHeaders({
      authorization: AppConfig.authentication.authorization_header,
      'Content-Type': 'application/x-www-form-urlencoded'
    });
    return this.http.post<any>(`${AppConfig.authentication.authorization}`, body.toString(), { headers });
  }
  refreshToken(refreshToken:string):Observable<any> {
    const body = new URLSearchParams();
    body.set('grant_type', 'refresh_token'); 
    body.set('refresh_token', refreshToken);
    const headers = new HttpHeaders({
      authorization: AppConfig.authentication.authorization_header,
      'Content-Type': 'application/x-www-form-urlencoded'
    });
    return this.http.post<any>(`${AppConfig.authentication.authorization}`, body.toString(), { headers });
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
  