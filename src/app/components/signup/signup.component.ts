import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  signupForm: FormGroup = this.fb.group({});  // Initialize as an empty form group

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.signupForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
      phone: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.minLength(5), Validators.maxLength(254)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      firstName: ['', [Validators.maxLength(50)]],
      lastName: ['', [Validators.maxLength(50)]],
      langKey: ['', [Validators.minLength(2), Validators.maxLength(10)]],
      activated: [false]
    });
  }

  onSubmit(): void {
    if (this.signupForm.valid) {
      const userDTO = this.signupForm.value;
      this.authService.signup(userDTO).subscribe(
        (response) => {
          alert('Signup successful!');
          this.router.navigate(['/login']); // Navigate to the login page
        },
        (error) => {
          alert('Error during signup: ' + error.message);
        }
      );
    }
  }
}
