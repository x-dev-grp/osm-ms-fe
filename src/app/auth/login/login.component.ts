// angular import
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// project import
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { TokenService } from '../services/tokenService.service';
import { AuthenticationService } from '../services/authentication.service';
import { first } from 'rxjs';
import { User } from 'src/app/@theme/types/user';

@Component({
  selector: 'app-login',
  imports: [CommonModule, SharedModule, RouterModule],
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
  private _fb = inject(FormBuilder);
  private router = inject(Router);
  private tokenService = inject(TokenService);

  // public method
  getErrorMessage() {
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
    this.form = this._fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  submit() {
    if (this.form.invalid) {
      return;
    }
    this.loading = true;
    this.authenticationService
      .login(this.form.value)
      .pipe(first())
      .subscribe({
        next:(response: any) => {
          this.loading = false;
          this.tokenService.setToken(response?.access_token);
          this.tokenService.setRefreshToken(response?.refresh_token);
          const decodedToken:any=this.tokenService.decodeToken();
          if( decodedToken && decodedToken?.osmUser){
            const roles:any=decodedToken?.roles;
            const permissions=decodedToken?.permissions;
            let user:User=decodedToken?.osmUser;
            user.roles=roles;
            user.permissions=permissions;
            this.authenticationService.setCurrentUserValue=user;
          }
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.loading = false;
          this.authenticationService.setCurrentUserValue=null;
          this.tokenService.deleteToken();
        }
      });
  }
}
