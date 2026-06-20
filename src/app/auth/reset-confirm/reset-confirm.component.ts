import { Component, inject, OnInit } from '@angular/core';
import { TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatError, MatFormField } from '@angular/material/form-field';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatCard } from '@angular/material/card';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-reset-confirm',
  standalone: true,
  imports: [
    TranslateModule,
    CommonModule,
    ReactiveFormsModule,
    MatError,
    MatFormField,
    MatProgressSpinner,
    MatCard,
    TranslatePipe,
    MatInput,
    MatButton,
    NgOptimizedImage
  ],
  templateUrl: './reset-confirm.component.html',
  styleUrls: ['../authentication.scss']
})
export class ResetConfirmComponent implements OnInit {
  private readonly i18n = inject(TranslateService);
  phase: 'code' | 'password' | 'done' = 'code';
  loading = false;

  successMessage: string | null = null;
  errorMessage: string | null = null;

  userId!: string;
  identifier!: string;

  codeForm: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(8)]]
  });

  pwForm: FormGroup = this.fb.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(8)]]
    },
    { validators: this.matchPasswords }
  );

  private readonly API = environment.apiUrl + '/api/security';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Accept userId via route param OR query string (both supported)
    this.userId = this.route.snapshot.paramMap.get('userId') || this.route.snapshot.queryParamMap.get('userId') || '';
    this.identifier = this.route.snapshot.queryParamMap.get('identifier') || ''; // optional (for “Resend code”)
    if (!this.userId) {
      this.errorMessage = 'RESET_PASSWORD.MISSING_USER_ID';
    }
  }

  /** Phase 1: validate confirmation code */
  onValidateCode(): void {
    this.errorMessage = null;
    if (this.codeForm.invalid || !this.userId) return;

    this.loading = true;
    const url = `${this.API}/user/auth/validateResetCode/${this.userId}`;
    const params = new HttpParams().set('code', this.codeForm.value.code);

    this.http.post<void>(url, null, { params }).subscribe({
      next: () => {
        this.loading = false;
        this.phase = 'password';
      },
      error: (err) => {
        this.loading = false;
        // Backend uses 400 for invalid/expired code with plain text body
        this.errorMessage =
          typeof err?.error === this.i18n.instant('AUTO.STRING') ? err.error : this.i18n.instant('AUTO.INVALID_OR_EXPIRED_CODE');
      }
    });
  }

  /** Phase 2: submit new password */
  onUpdatePassword(): void {
    this.errorMessage = null;
    if (this.pwForm.invalid || !this.userId) return;

    this.loading = true;
    const url = `${this.API}/user/auth/updatePassword/${this.userId}`;
    const dto = {
      resetCode: this.codeForm.value.code,
      newPassword: this.pwForm.value.newPassword,
      newPasswordConfirmation: this.pwForm.value.confirmPassword
    };

    this.http.post<void>(url, dto).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = this.i18n.instant('AUTO.YOUR_PASSWORD_HAS_BEEN_UPDATED_SUCCESSFULLY');
        this.phase = 'done';
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          typeof err?.error === this.i18n.instant('AUTO.STRING') ? err.error : this.i18n.instant('AUTO.COULD_NOT_UPDATE_PASSWORD');
      }
    });
  }

  /** Helpers */

  navigateToLogin(): void {
    this.router.navigateByUrl('/auth/login');
  }

  getCodeErrorMessage(): string {
    const ctrl = this.codeForm.controls['code'];
    if (ctrl.hasError('required')) return 'Code is required';
    if (ctrl.hasError('minlength')) return 'Code is too short';
    if (ctrl.hasError('maxlength')) return 'Code is too long';
    return 'Invalid code';
  }

  getNewPasswordError(): string {
    const ctrl = this.pwForm.controls['newPassword'];
    if (ctrl.hasError('required')) return 'Password is required';
    if (ctrl.hasError('minlength')) return 'Minimum 8 characters';
    return 'Invalid password';
  }

  getConfirmPasswordError(): string {
    const ctrl = this.pwForm.controls['confirmPassword'];
    if (this.pwForm.hasError('mismatch')) return 'Passwords do not match';
    if (ctrl.hasError('required')) return 'Please confirm your password';
    if (ctrl.hasError('minlength')) return 'Minimum 8 characters';
    return 'Invalid confirmation';
  }

  private matchPasswords(group: FormGroup) {
    const a = group.get('newPassword')?.value;
    const b = group.get('confirmPassword')?.value;
    return a && b && a === b ? null : { mismatch: true };
  }
}
