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
  errorMessage: any ;
  private _fb = inject(FormBuilder);
  private router = inject(Router);
  private tokenService = inject(TokenService);


  // public method

  getUserNameErrorMessage() {
    if (this.form.controls['username'].hasError('required')) {
      return 'You must enter an email';
    }
    return this.form.controls['username'].hasError('email') ? 'Not a valid email' : '';
  }

  getPasswordErrorMessage() {
    if (this.form.controls['password'].hasError('required')) {
      return 'You must enter a password';
    }
    return this.form.controls['password'].hasError('minLength') ? 'Password length must be greater than 8' : '';
  }

  ngOnInit(): void {
    this.errorMessage = null;
    this.form = this._fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  submit() {
    if (this.form.invalid) {
      return;
    }
    this.loading = true;
    this.authenticationService
      .login(this.form.value)
      .pipe(
        first(),
        catchError((err: any) => {
          this.loading = false;
          console.log(err);
          if ([504, 503].includes(err?.status)) {
            this.errorMessage = { message: 'Service unavailable please try again later' };
          } else if (err?.error?.error_uri && err?.error?.error_description) {
            this.router.navigate([
              '/auth/user/update-password',
              {
                username: err.error.error_description,
                id: err.error.error_uri
              }
            ]);
          } else {
            this.errorMessage = err?.error;
          }
          //this.authenticationService.logout();

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
              // Add logging for debugging
              console.log('[Login] User set for navigation:', user);
              console.log('[Login] Token:', this.tokenService.getToken());
                const tenantId = user.tenantId || decodedToken['tenantId'];
                if (role !== Role.OsmAdmin && tenantId) {
                // Fetch company profile for non-OsmAdmin users
                  this.router.navigate(['/dashboard']);
              } else {
                // For OsmAdmin, skip company profile fetch
                this.router
                  .navigate(['/administration/dashboard'])
                  .then((success) => {
                    console.log('[Login] Navigation to /administration/dashboard success:', success);
                  })
                  .catch((err) => {
                    console.error('[Login] Navigation error:', err);
                  });
              }
            }
          }
        },
        error: (error: unknown) => {
          if (typeof error === 'object' && error !== null && 'error' in error) {
            this.errorMessage = (error as { error?: string }).error ?? null;
          } else {
            this.errorMessage = 'An unexpected error occurred';
          }
          this.loading = false;
        }
      });
  }
}
