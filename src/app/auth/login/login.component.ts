// angular import
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// project import
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { TokenService } from '../services/tokenService.service';
import { AuthenticationService } from '../services/authentication.service';
import { catchError, first, of } from 'rxjs';
import { User } from 'src/app/@theme/types/user';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  imports: [CommonModule, SharedModule, RouterModule,MatProgressSpinnerModule],
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
  errorMessage:any;
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
    this.errorMessage=null
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
       catchError((err:any) => {
        this.loading=false;
        console.log(err)
        if([504,503].includes(err?.status)){
          this.errorMessage={message:"Service unavailable please try again later"};
        }else if(err?.error?.error_uri && err?.error?.error_description){
            this.router.navigate(['/auth/user/update-password',{username:err.error.error_description,id:err.error.error_uri}]);
        }
        else{
          this.errorMessage=err?.error;
        }
        //this.authenticationService.logout();
      
        return of(null); 
       })
      )
      .subscribe({
        next:(response: any) => {
          if(response){
          this.errorMessage=null
          this.loading = false;
          this.tokenService.setToken(response?.access_token);
          this.tokenService.setRefreshToken(response?.refresh_token);
          const decodedToken:any=this.tokenService.decodeToken();
          if( decodedToken && decodedToken?.osmUser){
            const role:any=decodedToken?.role;
            const permissions=decodedToken?.permissions;
            let user:User=decodedToken?.osmUser;
            user.role=role;
            user.permissions=permissions;
            this.authenticationService.setCurrentUserValue=user;
          }
          this.router.navigate(['/dashboard']);
        }
        },
        error: (error) => {
          this.errorMessage=error?.error;
          this.loading = false;
        }
      });
  }
}
