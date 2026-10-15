import { Component, inject, OnInit } from '@angular/core';

import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { first } from 'rxjs';
import { UserService } from '../../settings/user-management/services/user.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { HttpErrorResponse } from '@angular/common/http';
import { AuthenticationService } from '../services/authentication.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthLangSwitcherComponent } from '../auth-lang-switcher.component';

@Component({
  selector: 'app-update-password',
  templateUrl: './update-password.component.html',
  styleUrls: ['../authentication.scss'],
  standalone: true,
  imports: [TranslateModule, CommonModule, SharedModule, RouterModule, AuthLangSwitcherComponent]
})
export class UpdatePasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private authService = inject(AuthenticationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translateService = inject(TranslateService);
  conHide = true;
  newHide = true;
  // Form and UI state
  _form: FormGroup;
  errorMessage = '';
  loading = false;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this._form = this.fb.group(
      {
        newPassword: [null, [Validators.required, Validators.minLength(8), this.passwordStrengthValidator]],
        newPasswordConfirmation: [null, [Validators.required]]
      },
      {
        validators: [this.invalidConfirmPassword()]
      }
    );
  }

  // Custom validator for password strength
  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(value);

    const passwordValid = hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

    return passwordValid
      ? null
      : {
          passwordStrength: {
            hasUpperCase,
            hasLowerCase,
            hasNumber,
            hasSpecialChar
          }
        };
  }

  private invalidConfirmPassword() {
    return (group: AbstractControl): ValidationErrors | null => {
      const password = group.get('newPassword')!;
      const confirmPassword = group.get('newPasswordConfirmation');

      const valuePass = password.value;
      const valueConPassword = confirmPassword?.value;
      if (valueConPassword && valuePass !== valueConPassword) {
        confirmPassword?.setErrors({ ...confirmPassword.errors, mismatch: true });
      } else {
        if (confirmPassword?.hasError('mismatch')) {
          if (confirmPassword.hasError('required')) confirmPassword.setErrors({ required: true });
          else confirmPassword.setErrors(null);
        }
      }
      return null;
    };
  }

  onSubmit(): void {
    if (this.loading) return;
    if (this._form.invalid) {
      this._form.markAllAsTouched();
      return;
    }

    const userId = this.route.snapshot.paramMap?.get('id');
    if (!userId) {
      this.errorMessage = this.translateService.instant('LOGIN.PASSWORD_UPDATE_CONTEXT_EXPIRED');
      return;
    }

    const temporaryPassword = history.state?.temporaryPassword;
    if (!temporaryPassword) {
      this.errorMessage = this.translateService.instant('LOGIN.PASSWORD_UPDATE_CONTEXT_EXPIRED');
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const payload = {
      ...this._form.value,
      oldPassword: temporaryPassword
    };

    this.userService
      .updateInitialPassword(payload, userId)
      .pipe(first())
      .subscribe({
        next: () => {
          this._form.reset();
          this.loading = false;
          this.authService.logout(undefined, 'password-changed');
        },
        error: (err: unknown) => {
          this.loading = false;
          this.handleError(err);
        }
      });
  }

  private handleError(err: unknown): void {
    if (err instanceof HttpErrorResponse && (err.status === 0 || err.status >= 500)) {
      this.errorMessage = this.translateService.instant('LOGIN.SERVICE_UNAVAILABLE');
    } else {
      this.errorMessage = this.translateService.instant('LOGIN.PASSWORD_UPDATE_FAILED');
    }
  }
}
