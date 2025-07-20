// angular import
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// project import
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { TokenService } from '../services/tokenService.service';
import { AuthenticationService } from '../services/authentication.service';
import { catchError, first, of, switchMap, from } from 'rxjs';
import { User } from 'src/app/@theme/types/user';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Role } from '../../@theme/types/role';
import { CompanyProfileService } from '../../shared/services/company-profile.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, SharedModule, RouterModule, MatProgressSpinnerModule],
  templateUrl: './login.component.html',
  standalone: true,
  styleUrls: ['../authentication.scss']
})
export class LoginComponent implements OnInit {
  authenticationService = inject(AuthenticationService);
  loading = false;
  form: FormGroup;
  // public props
  hide = true;
  errorMessage: any ;
  private _fb = inject(FormBuilder);
  private router = inject(Router);
  private tokenService = inject(TokenService);
  private companyProfileService = inject(CompanyProfileService);

  // public method

  getUserNameErrorMessage() {
    if (this.form.controls['username'].hasError('required')) {
      return 'You must enter an email';
    }
    return this.form.controls['username'].hasError('email') ? 'Not a valid email' : '';
  }

  getPasswordErrorMessage() {
    if (this.form.controls['password'].hasError('required')) {
      return 'You must enter a password';
    }
    return this.form.controls['password'].hasError('minLength') ? 'Password length must be greater than 8' : '';
  }

  ngOnInit(): void {
    this.errorMessage = null;
    this.form = this._fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  submit() {
    if (this.form.invalid) {
      return;
    }
    this.loading = true;
    this.authenticationService
      .login(this.form.value)
      .pipe(
        first(),
        switchMap((response: unknown) => {
          if (!response) {
            this.loading = false;
            return of(null);
          }
          this.errorMessage = null;
          this.tokenService.setToken((response as Record<string, unknown>)['access_token'] as string);
          this.tokenService.setRefreshToken((response as Record<string, unknown>)['refresh_token'] as string);
          const decodedToken = this.tokenService.decodeToken() as Record<string, unknown>;
          if (decodedToken && decodedToken['osmUser']) {
            const role = decodedToken['role'] as string;
            const permissions = decodedToken['authorities'];
            const user: User = decodedToken['osmUser'] as User;
            user.role = role;
            user.permissions = permissions;
            this.authenticationService.setCurrentUserValue = user;
            const tenantId = user.tenantId || decodedToken['tenantId'];
            if (role !== Role.OsmAdmin && tenantId) {
              // Fetch company profile by tenantId for non-admins
              return this.companyProfileService.getProfileByTenantId(String(tenantId)).pipe(
                first(),
                switchMap((profile) => {
                  // Optionally store profile in localStorage or service
                  localStorage.setItem('company_profile', JSON.stringify(profile.data));
                  return from(this.router.navigate(['/dashboard']));
                })
              );
            } else {
              // For OsmAdmin, skip company profile fetch
              return from(this.router.navigate(['/administration/dashboard']));
            }
          }
          this.loading = false;
          return of(null);
        }),
        catchError((err: unknown) => {
          this.loading = false;
          if (isHttpError(err) && 'status' in err && [504, 503].includes((err.status as number))) {
            this.errorMessage = 'Service unavailable please try again later';
          } else if (isHttpError(err) && err.error && err.error.error_uri && err.error.error_description) {
            this.router.navigate(['/auth/user/update-password'], { queryParams: { username: err.error.error_description, id: err.error.error_uri } });
          } else {
            this.errorMessage = isHttpError(err) && 'error' in err ? (err.error as string) : 'An error occurred during login.';
          }
          return of(null);
        })
      )
      .subscribe({
        next: (result) => {
          this.loading = false;
          if (result === null) return;
          // Navigation is already handled in switchMap
        }
      });
  }
}

// Add a type guard for error objects
function isHttpError(obj: unknown): obj is { status?: number; error?: { error_uri?: string; error_description?: string } } {
  return typeof obj === 'object' && obj !== null;
}
