// angular import
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { catchError, first, of } from 'rxjs';

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
  errorMessage: { message?: string } | string | null = null;
  private _fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private tokenService = inject(TokenService);
  private translateService = inject(TranslateService);

  get errorText(): string {
    if (!this.errorMessage) {
      return '';
    }
    if (typeof this.errorMessage === 'string') {
      return this.errorMessage;
    }
    return this.errorMessage.message ?? '';
  }

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
    this.errorMessage = null;
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
      this.errorMessage = { message: this.translateService.instant('LOGIN.ACCOUNT_LOCKED') };
    } else if (reason === 'no-access') {
      this.errorMessage = { message: this.translateService.instant('LOGIN.NO_ACCESS') };
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = null;
    const rememberMe = this.form.get('rememberMe')?.value === true;
    const username = String(this.form.get('username')?.value ?? '').trim();
    const password = this.form.get('password')?.value as string;

    this.authenticationService
      .login({ username, password })
      .pipe(
        first(),
        catchError((err: any) => {
          this.loading = false;
          if ([504, 503].includes(err?.status)) {
            this.errorMessage = { message: this.translateService.instant('LOGIN.SERVICE_UNAVAILABLE') };
          } else if (err?.error?.error_uri && err?.error?.error_description) {
            void this.router.navigate(
              [
                '/auth/user/update-password',
                {
                  username: err.error.error_description,
                  id: err.error.error_uri
                }
              ],
              { state: { temporaryPassword: password } }
            );
          } else {
            this.errorMessage = err?.error ?? { message: this.translateService.instant('LOGIN.UNEXPECTED_ERROR') };
          }
          return of(null);
        })
      )
      .subscribe({
        next: (response: unknown) => {
          if (!response) {
            return;
          }

          this.loading = false;
          const accessToken = (response as Record<string, unknown>)['access_token'] as string;
          const refreshToken = (response as Record<string, unknown>)['refresh_token'] as string;
          this.tokenService.persistLogin(accessToken, refreshToken, rememberMe, username);
          this.authenticationService.applyAccessToken(accessToken, { reloadPhoto: false });
          this.authenticationService.refreshSession().subscribe({
            next: () => {
              const role = this.authenticationService.currentUserValue?.role;
              if (role === Role.OosmAdmin) {
                void this.router.navigate(['/dashboard/administration']);
              } else {
                void this.router.navigate(['/dashboard']);
              }
            },
            error: () => {
              this.errorMessage = { message: this.translateService.instant('LOGIN.UNEXPECTED_ERROR') };
            }
          });
        },
        error: () => {
          this.errorMessage = this.translateService.instant('LOGIN.UNEXPECTED_ERROR');
          this.loading = false;
        }
      });
  }
}
