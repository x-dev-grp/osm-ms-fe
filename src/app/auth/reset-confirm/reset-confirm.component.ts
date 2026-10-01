import { Component, inject, OnInit } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { SharedModule } from 'src/app/shared/shared.module';
import { APP_LOGO_FULL } from '../../shared/config/logo.config';
import { AuthLangSwitcherComponent } from '../auth-lang-switcher.component';
import { AuthenticationService } from '../services/authentication.service';

@Component({
  selector: 'app-reset-confirm',
  standalone: true,
  imports: [TranslateModule, CommonModule, SharedModule, AuthLangSwitcherComponent, RouterModule],
  templateUrl: './reset-confirm.component.html',
  styleUrls: ['../authentication.scss']
})
export class ResetConfirmComponent implements OnInit {
  readonly appLogoFull = APP_LOGO_FULL;
  private readonly i18n = inject(TranslateService);
  phase: 'code' | 'password' = 'code';
  loading = false;

  errorKey: string | null = null;

  userId!: string;
  identifier!: string;

  codeForm: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
  });

  pwForm: FormGroup = this.fb.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(8)]]
    },
    { validators: (group) => this.matchPasswords(group as FormGroup) }
  );

  private readonly API = environment.apiUrl + '/api/security';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private http: HttpClient,
    private authService: AuthenticationService
  ) {}

  ngOnInit(): void {
    // Accept userId via route param OR query string (both supported)
    this.userId = this.route.snapshot.paramMap.get('userId') || this.route.snapshot.queryParamMap.get('userId') || '';
    this.identifier = this.route.snapshot.queryParamMap.get('identifier') || ''; // optional (for “Resend code”)
    if (!this.userId) {
      this.errorKey = 'RESET_PASSWORD.MISSING_USER_ID';
    }
  }

  /** Phase 1: validate confirmation code */
  onValidateCode(): void {
    this.errorKey = null;
    if (this.codeForm.invalid || !this.userId) {
      this.codeForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const url = `${this.API}/user/auth/validateResetCode/${this.userId}`;
    const params = new HttpParams().set('code', this.codeForm.value.code);

    this.http.post<void>(url, null, { params }).subscribe({
      next: () => {
        this.loading = false;
        this.phase = 'password';
      },
      error: (err) => {
        this.loading = false;
        this.errorKey =
          err?.status === 400
            ? 'RESET_PASSWORD.CODE_INVALID'
            : err?.status === 0 || err?.status >= 500
              ? 'LOGIN.SERVICE_UNAVAILABLE'
              : 'RESET_PASSWORD.ERROR_VALIDATE';
      }
    });
  }

  /** Phase 2: submit new password */
  onUpdatePassword(): void {
    this.errorKey = null;
    if (this.pwForm.invalid || !this.userId) {
      this.pwForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const url = `${this.API}/user/auth/updatePassword/${this.userId}`;
    const dto = {
      resetCode: this.codeForm.value.code,
      newPassword: this.pwForm.value.newPassword,
      newPasswordConfirmation: this.pwForm.value.confirmPassword
    };

    this.http.post<void>(url, dto).subscribe({
      next: () => {
        this.loading = false;
        this.pwForm.reset();
        this.codeForm.reset();
        this.authService.logout(undefined, 'password-changed');
      },
      error: (err) => {
        this.loading = false;
        this.errorKey = err?.status === 0 || err?.status >= 500 ? 'LOGIN.SERVICE_UNAVAILABLE' : 'RESET_PASSWORD.ERROR_UPDATE';
      }
    });
  }

  /** Helpers */

  getCodeErrorMessage(): string {
    const ctrl = this.codeForm.controls['code'];
    if (ctrl.hasError('required')) return this.i18n.instant('RESET_PASSWORD.CODE_REQUIRED');
    return this.i18n.instant('RESET_PASSWORD.CODE_FORMAT');
  }

  getNewPasswordError(): string {
    const ctrl = this.pwForm.controls['newPassword'];
    if (ctrl.hasError('required')) return this.i18n.instant('RESET_PASSWORD.PASSWORD_REQUIRED');
    if (ctrl.hasError('minlength')) return this.i18n.instant('LOGIN.PASSWORD_MIN_LENGTH_ERROR');
    return this.i18n.instant('RESET_PASSWORD.PASSWORD_INVALID');
  }

  getConfirmPasswordError(): string {
    const ctrl = this.pwForm.controls['confirmPassword'];
    if (this.pwForm.hasError('mismatch')) return this.i18n.instant('RESET_PASSWORD.MISMATCH');
    if (ctrl.hasError('required')) return this.i18n.instant('RESET_PASSWORD.CONFIRM_REQUIRED');
    if (ctrl.hasError('minlength')) return this.i18n.instant('LOGIN.PASSWORD_MIN_LENGTH_ERROR');
    return this.i18n.instant('RESET_PASSWORD.CONFIRM_INVALID');
  }

  private matchPasswords(group: FormGroup) {
    const a = group.get('newPassword')?.value;
    const b = group.get('confirmPassword')?.value;
    return a && b && a === b ? null : { mismatch: true };
  }
}
