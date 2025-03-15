import { Component } from '@angular/core';
import { LoginService } from 'src/app/services/login.service';
import { Router } from '@angular/router';
import {HttpClient} from "@angular/common/http";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(
    private loginService: LoginService,
    private router: Router,
    private http: HttpClient
  ) {}

  onSubmit(loginForm: any): void {
    if (loginForm.invalid) return;

    this.loginService.loginUsier(this.username, this.password).subscribe({
      next: (response) => {
        // e.g., response.token can be stored in localStorage
        if (response && response.token) {
          localStorage.setItem('jwt_token', response.token);
        }
        // On success, redirect to your main dashboard or home
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Login error:', err);
        this.errorMessage = 'Invalid credentials, please try again.';
      }
    });
  }
}
