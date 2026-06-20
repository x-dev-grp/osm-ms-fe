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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Role } from '../../theme/types/role';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  imports: [TranslateModule, CommonModule, SharedModule, RouterModule, MatProgressSpinnerModule],
  templateUrl: './login.component.html',
  standalone: true,
  styleUrls: ['../authentication.scss']
})
export class LoginComponent implements OnInit {
  authenticationService = inject(AuthenticationService);
  loading = false;
  form: FormGroup;
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
    this.tokenService.purgeExpiredRememberMe();
    this.form = this._fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });
    this.prefillRememberedUsername();
  }

  private prefillRememberedUsername(): void {
    const rememberedUsername = this.tokenService.getRememberedUsername();
    if (rememberedUsername) {
      this.form.patchValue({
        username: rememberedUsername,
        rememberMe: true
      });
    }
  }

  submit() {
    if (this.form.invalid) {
      return;
    }
    this.loading = true;
    const rememberMe = this.form.get('rememberMe')?.value === true;

    this.authenticationService
      .login(this.form.value)
      .pipe(
        first(),
        catchError((err: any) => {
          this.loading = false;
          if ([504, 503].includes(err?.status)) {
            this.errorMessage = { message: this.translateService.instant('LOGIN.SERVICE_UNAVAILABLE') };
          } else if (err?.error?.error_uri && err?.error?.error_description) {
            this.router.navigate(
              [
                '/auth/user/update-password',
                {
                  username: err.error.error_description,
                  id: err.error.error_uri
                }
              ],
              {
                state: { temporaryPassword: this.form.get('password')?.value }
              }
            );
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
            const accessToken = (response as Record<string, unknown>)['access_token'] as string;
            const refreshToken = (response as Record<string, unknown>)['refresh_token'] as string;
            this.tokenService.persistLogin(
              accessToken,
              refreshToken,
              rememberMe,
              this.form.get('username')?.value
            );
            if (this.authenticationService.applyAccessToken(this.tokenService.getToken()!)) {
              const role = this.authenticationService.currentUserValue?.role;
              if (role === Role.OsmAdmin) {
                this.router.navigate(['/administration/dashboard']);
              } else {
                this.router.navigate(['/welcome']);
              }
            }
          }
        },
        error: () => {
          this.errorMessage = this.translateService.instant('LOGIN.UNEXPECTED_ERROR');
          this.loading = false;
        }
      });
  }
}
