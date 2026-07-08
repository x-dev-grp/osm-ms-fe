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
import {Component, DestroyRef, inject} from "@angular/core";

export interface MailTestDialogData {
  defaultRecipient?: string;
}

@Component({
  selector: 'app-mail-test-dialog',
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
  templateUrl: './mail-test-dialog.component.html'
})
export class MailTestDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<MailTestDialogComponent>);
  private readonly settingsService = inject(AdminSettingsService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  readonly data = inject<MailTestDialogData>(MAT_DIALOG_DATA, { optional: true });

  submitting = false;

  readonly form = this.fb.group({
    to: [this.data?.defaultRecipient ?? '', [Validators.required, Validators.email]]
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
    const to = this.form.getRawValue().to ?? '';
    this.settingsService
      .sendMailTest({ to })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.submitting = false;
          if (response?.success) {
            this.toast.success('ADMIN_SETTINGS.MAIL.TEST_SUCCESS');
            this.dialogRef.close(true);
            return;
          }
          this.toast.error(response?.error || 'ADMIN_SETTINGS.MAIL.TEST_ERROR');
        },
        error: (err: HttpErrorResponse) => {
          this.submitting = false;
          const body = err.error;
          const message = typeof body === 'string'
            ? body
            : body?.error ?? body?.message;
          this.toast.error(message || 'ADMIN_SETTINGS.MAIL.TEST_ERROR');
        }
      });
  }
}
