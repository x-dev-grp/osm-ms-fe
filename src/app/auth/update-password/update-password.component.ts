import { AfterViewInit, Component, DestroyRef, inject, OnInit, TemplateRef, viewChild, ViewChild } from '@angular/core';

import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { catchError, EMPTY, filter, first, Observable, of, switchMap, tap } from 'rxjs';
import { UserService } from '../../settings/user-management/services/user.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { AuthenticationService } from 'src/app/auth/services/authentication.service';
import { MatDialog } from '@angular/material/dialog';
import { User } from 'src/app/@theme/types/user';
import { TokenService } from '../services/tokenService.service';

@Component({
  selector: 'update-password',
  templateUrl: './update-password.component.html',
  styleUrls: ['../authentication.scss'],
  standalone: true,
  imports: [CommonModule, SharedModule, RouterModule]
})
export class UpdatePasswordComponent implements OnInit {
  @ViewChild('changePwdTpl') changePwdTpl: TemplateRef<any>;
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private authService = inject(AuthenticationService);
  private tokenService = inject(TokenService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
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
        newPassword: [null, [Validators.required]],
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
        confirmPassword.setErrors({ ...confirmPassword.errors, mismatch: true });
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

    this.loading = true;
    this.errorMessage = '';

    this.userService.updatePassword(this._form.value, userId)
      .pipe(
        tap(() => {
          this.loading = false;
          this.openChangePasswordDialog();
        }),
        catchError((err: any) => {
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

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'continue') {
        this.performLogin();
      } else {
        this.authService.logout();
      }
    });
  }

  private performLogin(): void {
    const payload = {
      username: this.route.snapshot.paramMap?.get('username'),
      password: this._form.get('newPassword')?.value
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

  private handleSuccessfulLogin(response: any): void {
    this.tokenService.setToken(response?.access_token);
    this.tokenService.setRefreshToken(response?.refresh_token);
    
    const decodedToken: any = this.tokenService.decodeToken();
    if (decodedToken?.osmUser) {
      const user: User = {
        ...decodedToken.osmUser,
        role: decodedToken.role,
        permissions: decodedToken.permissions
      };
      
      this.authService.setCurrentUserValue = user;
      this.router.navigate(['/dashboard']);
    }
  }

  private handleError(err: any): void {
    if ([504, 503].includes(err?.status)) {
      this.errorMessage = 'Service temporarily unavailable. Please try again later.';
    } else {
      this.errorMessage = err?.error || 'An unexpected error occurred';
    }
    console.error('Error:', err);
  }
}
