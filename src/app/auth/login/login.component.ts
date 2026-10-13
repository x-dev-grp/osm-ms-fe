// angular import
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { catchError, defaultIfEmpty, first, of } from 'rxjs';

// project import
import { SharedModule } from 'src/app/shared/shared.module';
import { TokenService } from '../services/tokenService.service';
import { AuthenticationService } from '../services/authentication.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Role } from '../../theme/types/role';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { APP_LOGO_FULL } from '../../shared/config/logo.config';
import { AuthLangSwitcherComponent } from '../auth-lang-switcher.component';

@Component({
  selector: 'app-login',
  imports: [TranslateModule, CommonModule, SharedModule, RouterModule, MatProgressSpinnerModule, AuthLangSwitcherComponent],
  templateUrl: './login.component.html',
  standalone: true,
  styleUrls: ['../authentication.scss']
})
export class LoginComponent implements OnInit {
  readonly appLogoFull = APP_LOGO_FULL;

  authenticationService = inject(AuthenticationService);
  loading = false;
  form!: FormGroup;
  hide = true;
  errorKey: string | null = null;
  successKey: string | null = null;
  private _fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private tokenService = inject(TokenService);
  private translateService = inject(TranslateService);

  getUserNameErrorMessage() {
    if (this.form.controls['username'].hasError('required')) {
      return this.translateService.instant('LOGIN.IDENTIFIER_REQUIRED');
    }
    return '';
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
    this.errorKey = null;
    this.successKey = this.route.snapshot.queryParamMap.get('success') === 'password-changed' ? 'LOGIN.PASSWORD_CHANGED' : null;
    this.tokenService.purgeExpiredRememberMe();
    this.form = this._fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });
    this.prefillRememberedUsername();
    this.applyLogoutReason(this.route.snapshot.queryParamMap.get('error'));
  }

  private applyLogoutReason(reason: string | null): void {
    if (reason === 'locked') {
      this.errorKey = 'LOGIN.ACCOUNT_LOCKED';
    } else if (reason === 'no-access') {
      this.errorKey = 'LOGIN.NO_ACCESS';
    } else if (reason === 'session-unavailable') {
      this.errorKey = 'LOGIN.SESSION_UNAVAILABLE';
    }
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
    if (this.loading) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorKey = null;
    this.successKey = null;
    const rememberMe = this.form.get('rememberMe')?.value === true;
    const username = String(this.form.get('username')?.value ?? '').trim();
    const password = this.form.get('password')?.value as string;

    this.authenticationService
      .login({ username, password })
      .pipe(
        first(),
        catchError((err: any) => {
          if (err?.status === 0 || err?.status >= 500) {
            this.errorKey = 'LOGIN.SERVICE_UNAVAILABLE';
            this.loading = false;
          } else if (
            err?.error?.error === 'access_denied' &&
            /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(err?.error?.error_uri ?? '') &&
            typeof err?.error?.error_description === 'string'
          ) {
            void this.router
              .navigate(
                [
                  '/auth/user/update-password',
                  {
                    username: err.error.error_description,
                    id: err.error.error_uri
                  }
                ],
                { state: { temporaryPassword: password } }
              )
              .finally(() => {
                this.loading = false;
              });
          } else {
            this.errorKey = 'LOGIN.INVALID_CREDENTIALS';
            this.loading = false;
          }
          return of(null);
        })
      )
      .subscribe({
        next: (response: unknown) => {
          if (!response) {
            return;
          }

          const accessToken = (response as Record<string, unknown>)['access_token'] as string;
          const refreshToken = (response as Record<string, unknown>)['refresh_token'] as string;
          this.tokenService.persistLogin(accessToken, refreshToken, rememberMe, username);
          this.authenticationService.applyAccessToken(accessToken, { reloadPhoto: false });
          this.authenticationService
            .refreshSession()
            .pipe(defaultIfEmpty(null), first())
            .subscribe({
              next: (session) => {
                if (!session) {
                  this.loading = false;
                  this.authenticationService.logout('session-unavailable');
                  return;
                }
                const role = this.authenticationService.currentUserValue?.role;
                const target = role === Role.OosmAdmin ? ['/dashboard/administration'] : ['/dashboard'];
                void this.router.navigate(target).finally(() => {
                  this.loading = false;
                });
              },
              error: () => {
                this.loading = false;
                this.authenticationService.logout('session-unavailable');
              }
            });
        },
        error: () => {
          this.errorKey = 'LOGIN.UNEXPECTED_ERROR';
          this.loading = false;
        }
      });
  }
}
