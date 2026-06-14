// angular import
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// project import
import { SharedModule } from 'src/app/shared/shared.module';
import { TokenService } from '../services/tokenService.service';
import { AuthenticationService } from '../services/authentication.service';
import { catchError, first, of } from 'rxjs';
import { User } from 'src/app/theme/types/user';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Role } from '../../theme/types/role';
import { TranslateService } from '@ngx-translate/core';

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
  errorMessage: any;
  private _fb = inject(FormBuilder);
  private router = inject(Router);
  private tokenService = inject(TokenService);
  private translateService = inject(TranslateService);
  getUserNameErrorMessage() {
    if (this.form.controls['username'].hasError('required')) {
      return this.translateService.instant('LOGIN.USERNAME_REQUIRED');
    }
    return this.form.controls['username'].hasError('email') ? this.translateService.instant('LOGIN.USERNAME_INVALID') : '';
  }

  getPasswordErrorMessage() {
    if (this.form.controls['password'].hasError('required')) {
      return this.translateService.instant('LOGIN.PASSWORD_REQUIRED');
    }
    if (this.form.controls['password'].hasError('minlength')) {
      return this.translateService.instant('LOGIN.PASSWORD_MIN_LENGTH_ERROR');
    }
    if (this.form.controls['password'].hasError('passwordStrength')) {
      return this.translateService.instant('LOGIN.PASSWORD_STRENGTH_ERROR');
    }
    return '';
  }

  ngOnInit(): void {
    this.errorMessage = null;
    this.form = this._fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
      // password: ['', [Validators.required, Validators.minLength(8), this.passwordStrengthValidator]],
      rememberMe: [false]
    });

    // Pre-fill username if remembered
    this.prefillRememberedUsername();
  }

  // Pre-fill username if there's a remembered login
  private prefillRememberedUsername(): void {
    const rememberMe = localStorage.getItem('rememberMe');
    const expiry = localStorage.getItem('rememberMeExpiry');

    if (rememberMe === 'true' && expiry) {
      const expiryDate = new Date(expiry);
      const now = new Date();

      // Check if the remember me token is still valid
      if (expiryDate > now) {
        const rememberedUsername = localStorage.getItem('rememberedUsername');
        if (rememberedUsername) {
          this.form.patchValue({
            username: rememberedUsername,
            rememberMe: true
          });
        }
      } else {
        // Clear expired remember me data
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberMeExpiry');
        localStorage.removeItem('rememberedUsername');
      }
    }
  }

  // Custom validator for password strength
  private passwordStrengthValidator(control: any) {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(value);

    const passwordValid = hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

    return passwordValid ? null : { passwordStrength: true };
  }

  submit() {
    if (this.form.invalid) {
      return;
    }
    this.loading = true;

    // Handle "Remember Me" functionality
    if (this.form.get('rememberMe')?.value) {
      // Store in localStorage for 30 days
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('rememberMeExpiry', expiryDate.toISOString());
      localStorage.setItem('rememberedUsername', this.form.get('username')?.value);
    } else {
      // Clear any existing remember me data
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('rememberMeExpiry');
      localStorage.removeItem('rememberedUsername');
    }

    this.authenticationService
      .login(this.form.value)
      .pipe(
        first(),
        catchError((err: any) => {
          this.loading = false;
          console.log(err);
          if ([504, 503].includes(err?.status)) {
            this.errorMessage = { message: this.translateService.instant('LOGIN.SERVICE_UNAVAILABLE') };
          } else if (err?.error?.error_uri && err?.error?.error_description) {
            this.router.navigate([
              '/auth/user/update-password',
              {
                username: err.error.error_description,
                id: err.error.error_uri
              }
            ], {
              state: { temporaryPassword: this.form.get('password')?.value }
            });
          } else {
            this.errorMessage = err?.error;
          }
          return of(null);
        })
      )
      .subscribe({
        next: (response: unknown) => {
          if (response) {
            this.errorMessage = null;
            this.loading = false;
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
              if (role === Role.OsmAdmin) {
                this.router.navigate(['/administration/dashboard']);
              } else {
                this.router.navigate(['/welcome']);
              }
            }
          }
        },
        error: (error: unknown) => {
          if (typeof error === 'object' && error !== null && 'error' in error) {
            this.errorMessage = (error as { error?: string }).error ?? null;
          } else {
            this.errorMessage = this.translateService.instant('LOGIN.UNEXPECTED_ERROR');
          }
          this.loading = false;
        }
      });
  }
}
