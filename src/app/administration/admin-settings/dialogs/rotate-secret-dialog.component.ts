import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { AdminSettingsService } from '../services/admin-settings.service';
import { ToastService } from 'src/app/shared/services/toast.service';
import {Component, DestroyRef, inject} from '@angular/core';

export interface RotateSecretDialogData {
  settingKey: string;
  label: string;
  hintKey?: string;
}

@Component({
  selector: 'app-rotate-secret-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './rotate-secret-dialog.component.html'
})
export class RotateSecretDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<RotateSecretDialogComponent>);
  private readonly settingsService = inject(AdminSettingsService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  readonly data = inject<RotateSecretDialogData>(MAT_DIALOG_DATA);

  submitting = false;

  readonly form = this.fb.group({
    value: ['', [Validators.required, Validators.minLength(8)]],
    reason: ['']
  });

  cancel(): void {
    this.dialogRef.close(false);
  }

  submit(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const { value, reason } = this.form.getRawValue();
    this.settingsService
      .rotateSecret(this.data.settingKey, { value: value ?? '', reason: reason ?? undefined })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.form.patchValue({ value: '' });
          this.submitting = false;
          this.toast.success('ADMIN_SETTINGS.MAIL.ROTATE_SUCCESS');
          this.dialogRef.close(true);
        },
        error: (err: HttpErrorResponse) => {
          this.submitting = false;
          const serverMessage = typeof err.error === 'string'
            ? err.error
            : err.error?.message;
          this.toast.error(serverMessage || 'ADMIN_SETTINGS.MAIL.ROTATE_ERROR');
        }
      });
  }
}
