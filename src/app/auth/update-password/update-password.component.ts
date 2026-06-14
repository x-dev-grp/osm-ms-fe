import { Component, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';

import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { catchError, first, of, tap } from 'rxjs';
import { UserService } from '../../settings/user-management/services/user.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { AuthenticationService } from 'src/app/auth/services/authentication.service';
import { MatDialog } from '@angular/material/dialog';
import { User } from 'src/app/theme/types/user';
import { TokenService } from '../services/tokenService.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-update-password',
  templateUrl: './update-password.component.html',
  styleUrls: ['../authentication.scss'],
  standalone: true,
  imports: [CommonModule, SharedModule, RouterModule]
})
export class UpdatePasswordComponent implements OnInit {
  @ViewChild('changePwdTpl') changePwdTpl: TemplateRef<unknown>;
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private authService = inject(AuthenticationService);
  private tokenService = inject(TokenService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private translateService = inject(TranslateService);
  conHide:boolean=false;
  newHide:boolean=false;
  // Form and UI state
  _form: FormGroup;
  errorMessage = '';
  loading = false;

  // Password visibility toggles
  hideNewPassword = true;
  hideConfirmPassword = true;

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
    console.log(this.route.snapshot.paramMap);
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

    return passwordValid ? null : {
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
    if (this._form.invalid) {
      this._form.markAllAsTouched();
      return;
    }

    const userId = this.route.snapshot.paramMap?.get('id');
    if (!userId) {
      this.errorMessage = 'Invalid user';
      return;
    }

    const temporaryPassword = history.state?.temporaryPassword;
    if (!temporaryPassword) {
      this.errorMessage = 'Invalid credentials';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const payload = {
      ...this._form.value,
      oldPassword: temporaryPassword
    };

    this.userService.updateInitialPassword(payload, userId)
      .pipe(
        tap(() => {
          this.loading = false;
          this.openChangePasswordDialog();
        }),
        catchError((err: unknown) => {
          this.loading = false;
          this.handleError(err);
          return of(null);
        })
      )
      .subscribe();
  }

  private openChangePasswordDialog(): void {
    const dialogRef = this.dialog.open(  this.changePwdTpl
    , {
      width: '400px',
      disableClose: true
      // data: {
      //   username: this.route.snapshot.paramMap?.get('username')
      // }
    });

    dialogRef.afterClosed().subscribe((result: unknown) => {
      if (result === 'continue') {
        this.performLogin();
      } else {
        this.authService.logout();
      }
    });
  }

  private performLogin(): void {
    const username = this.route.snapshot.paramMap?.get('username');
    if (!username) {
      this.errorMessage = this.translateService.instant('LOGIN.USERNAME_MISSING');
      return;
    }
    const payload: Record<string, string> = {
      username: username,
      password: this._form.get('newPassword')?.value || ''
    };

    this.loading = true;
    this.authService.login(payload)
      .pipe(
        first(),
        tap(response => {
          if (response) {
            this.handleSuccessfulLogin(response);
          }
        }),
        catchError(err => {
          this.loading = false;
          this.handleError(err);
          return of(null);
        })
      )
      .subscribe();
  }

  private handleSuccessfulLogin(response: unknown): void {
    const resp = response as Record<string, unknown>;
    this.tokenService.setToken(resp['access_token'] as string);
    this.tokenService.setRefreshToken(resp['refresh_token'] as string);
    const decodedToken = this.tokenService.decodeToken() as Record<string, unknown>;
    if (decodedToken && decodedToken['osmUser']) {
      const user: User = {
        ...(decodedToken['osmUser'] as User),
        role: decodedToken['role'] as string,
        permissions: decodedToken['authorities']
      };
      this.authService.setCurrentUserValue = user;
      console.log('[UpdatePassword] User set for navigation:', user);
      console.log('[UpdatePassword] Token:', this.tokenService.getToken());
      this.router.navigate(['welcome'])
        .then(success => {
          console.log('[UpdatePassword] Navigation to /welcome success:', success);
        })
        .catch(err => {
          console.error('[UpdatePassword] Navigation error:', err);
        });
    }
  }

  private handleError(err: unknown): void {
    if (typeof err === 'object' && err !== null && 'status' in err && [504, 503].includes((err as any).status)) {
      this.errorMessage = this.translateService.instant('LOGIN.SERVICE_UNAVAILABLE');
    } else if (typeof err === 'object' && err !== null && 'error' in err) {
      this.errorMessage = (err as any).error || this.translateService.instant('LOGIN.UNEXPECTED_ERROR');
    } else {
      this.errorMessage = this.translateService.instant('LOGIN.UNEXPECTED_ERROR');
    }
    console.error('Error:', err);
  }
}
