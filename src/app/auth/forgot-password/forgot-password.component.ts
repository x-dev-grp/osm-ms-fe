// angular import
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// project import
import { SharedModule } from 'src/app/shared/shared.module';
import { AuthService, OOSMUserOUTDTO } from 'src/app/shared/services/auth.service';
import { catchError, first, of } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { APP_LOGO_FULL } from '../../shared/config/logo.config';
import { AuthLangSwitcherComponent } from '../auth-lang-switcher.component';

@Component({
  selector: 'app-forgot-password',
  imports: [TranslateModule, CommonModule, SharedModule, RouterModule, MatProgressSpinnerModule, AuthLangSwitcherComponent],
  templateUrl: './forgot-password.component.html',
  standalone: true,
  styleUrls: ['../authentication.scss']
})
export class ForgotPasswordComponent implements OnInit {
  readonly appLogoFull = APP_LOGO_FULL;
  loading = false;
  form: FormGroup;
  successMessage: string = '';
  errorMessage: string = '';
  private _fb = inject(FormBuilder);
  private router = inject(Router);
  private translateService = inject(TranslateService);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.form = this._fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  getEmailErrorMessage() {
    if (this.form.controls['email'].hasError('required')) {
      return this.translateService.instant('FORGOT_PASSWORD.EMAIL_REQUIRED');
    }
    return this.form.controls['email'].hasError('email') ? this.translateService.instant('FORGOT_PASSWORD.EMAIL_INVALID') : '';
  }

  submit(): void {
    if (this.loading) return;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const identifier = String(this.form.value.email ?? '').trim();

    this.authService
      .requestPasswordReset(identifier)
      .pipe(
        first(),
        catchError((err) => {
          this.loading = false;
          this.errorMessage =
            err?.status === 0 || err?.status >= 500
              ? this.translateService.instant('FORGOT_PASSWORD.SERVICE_UNAVAILABLE')
              : this.translateService.instant('FORGOT_PASSWORD.ERROR_MESSAGE');
          return of(null);
        })
      )
      .subscribe((res: OOSMUserOUTDTO | null) => {
        if (!res) return;

        this.loading = false;

        const userId = res.id;
        if (userId) {
          this.router.navigate(['/auth/reset', userId], { queryParams: { identifier } });
        } else {
          this.successMessage = this.translateService.instant('FORGOT_PASSWORD.SUCCESS_MESSAGE');
        }
      });
  }

  navigateToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
