import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-password-reset',
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.scss']
})
export class PasswordResetComponent implements OnInit {
  resetPasswordForm: FormGroup = this.fb.group({});  // Initialize as an empty form group
  token: string | undefined;  // Initialize token as undefined

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token']; // Get token from the URL
    });

    // Initialize form group with validators
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required, this.passwordMatchValidator.bind(this)]]
    });
  }

  // Custom validator to check if password and confirmPassword match
  passwordMatchValidator(control: any): { [key: string]: boolean } | null {
    if (this.resetPasswordForm && control.value !== this.resetPasswordForm.get('newPassword')?.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  // Submit handler for password reset
  onSubmit(): void {
    if (this.resetPasswordForm.valid) {
      const { newPassword } = this.resetPasswordForm.value;
      this.authService.resetPassword(this.token!, newPassword).subscribe( // Token is guaranteed to be set at this point
        () => {
          alert('Password has been reset successfully.');
          this.router.navigate(['/login']); // Navigate to the login page after successful reset
        },
        (error) => {
          alert('Error resetting password: ' + error.message);
        }
      );
    }
  }
}
