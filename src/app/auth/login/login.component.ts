// angular import
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, exhaustMap, first, of, startWith, Subject, switchMap, timer } from 'rxjs';

// project import
import { SharedModule } from 'src/app/shared/shared.module';
import { TokenService } from '../services/tokenService.service';
import { AuthenticationService } from '../services/authentication.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Role } from '../../theme/types/role';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { APP_LOGO_FULL } from '../../shared/config/logo.config';
import { BackendHealthService, BackendHealthState } from '../../shared/services/backend-health.service';

@Component({
  selector: 'app-login',
  imports: [TranslateModule, CommonModule, SharedModule, RouterModule, MatProgressSpinnerModule],
  templateUrl: './login.component.html',
  standalone: true,
  styleUrls: ['../authentication.scss']
})
export class LoginComponent implements OnInit {
  readonly appLogoFull = APP_LOGO_FULL;
  readonly showBackendStatus: boolean;
  backendHealthState: BackendHealthState = 'checking';
  backendHealthDetail: string | null = null;
  backendWaking = false;

  authenticationService = inject(AuthenticationService);
  loading = false;
  form: FormGroup;
  hide = true;
  errorMessage: any;
  private _fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private tokenService = inject(TokenService);
  private translateService = inject(TranslateService);
  private backendHealthService = inject(BackendHealthService);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.showBackendStatus = this.backendHealthService.isEnabled();
  }

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
    this.applyLogoutReason(this.route.snapshot.queryParamMap.get('error'));
    this.startBackendHealthPolling();
  }

  backendStatusLabelKey(): string {
    if (this.backendWaking && this.backendHealthState === 'checking') {
      return 'LOGIN.BACKEND_STATUS.WAKING';
    }
    switch (this.backendHealthState) {
      case 'up':
        return 'LOGIN.BACKEND_STATUS.UP';
      case 'degraded':
        return 'LOGIN.BACKEND_STATUS.DEGRADED';
      case 'down':
        return 'LOGIN.BACKEND_STATUS.DOWN';
      case 'unreachable':
        return 'LOGIN.BACKEND_STATUS.UNREACHABLE';
      default:
        return 'LOGIN.BACKEND_STATUS.CHECKING';
    }
  }

  showWakeBackendButton(): boolean {
    return this.backendHealthState !== 'up' && this.backendHealthState !== 'degraded';
  }

  wakeBackend(): void {
    if (!this.showBackendStatus || this.backendWaking) {
      return;
    }

    this.backendWaking = true;
    this.backendHealthState = 'checking';
    this.backendHealthDetail = null;
    this.backendHealthService.wake().pipe(first()).subscribe(() => this.healthPoll$.next());
  }

  private readonly healthPoll$ = new Subject<void>();

  private startBackendHealthPolling(): void {
    if (!this.showBackendStatus) {
      return;
    }

    const { pollIntervalMs, activePollIntervalMs } = this.backendHealthService.config();

    this.healthPoll$
      .pipe(
        startWith(undefined),
        exhaustMap(() => this.backendHealthService.check()),
        switchMap(({ state, response }) => {
          this.backendHealthState = state;
          this.backendHealthDetail = this.buildHealthDetail(response?.checks);
          this.backendWaking = false;

          const delayMs = state === 'up' || state === 'degraded' ? pollIntervalMs : activePollIntervalMs;
          return timer(delayMs);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.healthPoll$.next());
  }

  private buildHealthDetail(checks?: Record<string, { status?: string; latencyMs?: number }>): string | null {
    if (!checks) {
      return null;
    }
    const database = checks['database'];
    if (database?.status && database.status !== 'UP') {
      return this.translateService.instant('LOGIN.BACKEND_STATUS.DATABASE_DOWN');
    }
    if (typeof database?.latencyMs === 'number') {
      return this.translateService.instant('LOGIN.BACKEND_STATUS.LATENCY', { ms: database.latencyMs });
    }
    return null;
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
            this.authenticationService.applyAccessToken(accessToken, { reloadPhoto: false });
            this.authenticationService.refreshSession().subscribe({
              next: () => {
                const role = this.authenticationService.currentUserValue?.role;
                if (role === Role.OosmAdmin) {
                  this.router.navigate(['/administration/dashboard']);
                } else {
                  this.router.navigate(['/welcome']);
                }
              },
              error: () => {
                this.errorMessage = { message: this.translateService.instant('LOGIN.UNEXPECTED_ERROR') };
              }
            });
          }
        },
        error: () => {
          this.errorMessage = this.translateService.instant('LOGIN.UNEXPECTED_ERROR');
          this.loading = false;
        }
      });
  }
}
