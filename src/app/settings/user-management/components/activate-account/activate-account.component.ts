import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { SharedModule } from 'src/app/shared/shared.module';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'activate-account',
  templateUrl: './activate-account.component.html',
  styleUrls: ['./activate-account.component.scss'],
  standalone: true,
  imports: [CommonModule, SharedModule]
})
export class ActivateAccountComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  form!: FormGroup;
  email = '';
  loading = false;
  mode: 'activation' | 'reset' = 'activation'; // par défaut activation

  private readonly passwordMatchValidator: ValidatorFn = (group): ValidationErrors | null => {
    const password = group.get('newPassword')?.value;
    const confirm = group.get('confirmPassword')?.value;
    if (!password || !confirm) return null;
    return password === confirm ? null : { passwordMismatch: true };
  };

  ngOnInit(): void {
    this.form = this.fb.group(
      {
        code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: this.passwordMatchValidator }
    );

    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.email = params['email'] || '';
        this.mode = params['mode'] === 'reset' ? 'reset' : 'activation';

        if (!this.email) {
          this.snackBar.open('Lien invalide', 'Fermer', { duration: 4000 });
        }
      });
  }

  submit(): void {
    if (!this.email) {
      this.snackBar.open('Email introuvable dans le lien', 'Fermer', { duration: 4000 });
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { code, newPassword, confirmPassword } = this.form.getRawValue();


  }

  resendCode(): void {
    if (!this.email) {
      this.snackBar.open('Email introuvable dans le lien', 'Fermer', { duration: 4000 });
      return;
    }

    this.loading = true;
}
}

