import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSelect } from '@angular/material/select';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { NgIf } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, tap } from 'rxjs';
import { AdminUserService } from '../services/admin-user.service';

@Component({
  selector: 'app-add-oosm-admin-user',
  standalone: true,
  imports: [
    TranslateModule,
    MatButton,
    MatError,
    MatFormField,
    MatInput,
    MatProgressSpinner,
    MatSelect,
    MatSlideToggle,
    NgIf,
    ReactiveFormsModule,
    SharedModule
  ],
  templateUrl: './add-oosm-admin-user.component.html',
  styleUrls: ['./add-oosm-admin-user.component.scss']
})
export class AddOosmAdminUserComponent implements OnInit {
  private readonly i18n = inject(TranslateService);
  readonly destroyRef = inject(DestroyRef);
  userForm!: FormGroup;
  private readonly fb = inject(FormBuilder);
  private readonly adminUserService = inject(AdminUserService);
  private readonly router = inject(Router);
  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.userForm = this.fb.group(
      {
        firstName: [null],
        lastName: [null],
        username: [null, Validators.required],
        email: [null, [Validators.email]],
        phoneNumber: [null, [Validators.pattern(/^ ?\d{8,12}$/)]],
        confirmationMethod: ['EMAIL', Validators.required],
        locked: [false]
      },
      {
        validators: [this.emailOrPhoneRequired()]
      }
    );
  }

  onSubmit(): void {
    if (!this.userForm.valid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.adminUserService
      .createOosmAdminUser(this.userForm.value)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => {
          this.errorMessage = '';
          this.loading = false;
          this.router.navigate(['/administration/users']);
        }),
        catchError((err: { status?: number; error?: string }) => {
          if ([504, 503].includes(err?.status ?? 0)) {
            this.errorMessage = this.i18n.instant('LOGIN.SERVICE_UNAVAILABLE');
          } else {
            this.errorMessage = err?.error ?? this.i18n.instant('OSM_DASHBOARD.ACTIONS.ERROR');
          }
          this.loading = false;
          return of(null);
        })
      )
      .subscribe();
  }

  cancel(): void {
    this.router.navigate(['/administration/users']);
  }

  private emailOrPhoneRequired() {
    return (group: AbstractControl): ValidationErrors | null => {
      const methodCtrl = group.get('confirmationMethod')!;
      const emailCtrl = group.get('email')!;
      const phoneCtrl = group.get('phoneNumber')!;

      const method = methodCtrl.value;
      const email = emailCtrl.value;
      const phone = phoneCtrl.value;

      [emailCtrl, phoneCtrl].forEach((ctrl) => {
        if (ctrl.errors?.['emailRequired']) {
          delete ctrl.errors!['emailRequired'];
        }
        if (ctrl.errors?.['phoneRequired']) {
          delete ctrl.errors!['phoneRequired'];
        }
        if (Object.keys(ctrl.errors || {}).length === 0) {
          ctrl.setErrors(null);
        }
      });

      if (!method) {
        return null;
      }

      if (method === 'EMAIL') {
        if (!email) {
          emailCtrl.setErrors({ ...emailCtrl.errors, emailRequired: true });
        }
      } else if (!phone) {
        phoneCtrl.setErrors({ ...phoneCtrl.errors, phoneRequired: true });
      }

      return null;
    };
  }
}
