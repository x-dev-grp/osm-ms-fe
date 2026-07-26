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
import { Component, DestroyRef, inject } from '@angular/core';

export interface NotificationTestDialogData {
  defaultPlayerId?: string;
}

@Component({
  selector: 'app-notification-test-dialog',
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
  templateUrl: './notification-test-dialog.component.html'
})
export class NotificationTestDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<NotificationTestDialogComponent>);
  private readonly settingsService = inject(AdminSettingsService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  readonly data = inject<NotificationTestDialogData>(MAT_DIALOG_DATA, { optional: true });

  submitting = false;

  readonly form = this.fb.group({
    playerId: [this.data?.defaultPlayerId ?? '', [Validators.required, Validators.minLength(8)]],
    title: ['ZitFlow notification test'],
    message: ['This is a test push notification from ZitFlow administration settings.']
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
    const raw = this.form.getRawValue();
    this.settingsService
      .sendNotificationTest({
        playerId: (raw.playerId ?? '').trim(),
        title: (raw.title ?? '').trim() || undefined,
        message: (raw.message ?? '').trim() || undefined
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.submitting = false;
          if (response?.success) {
            this.toast.success('ADMIN_SETTINGS.NOTIFICATIONS.TEST_SUCCESS');
            this.dialogRef.close(true);
            return;
          }
          this.toast.error(response?.error || 'ADMIN_SETTINGS.NOTIFICATIONS.TEST_ERROR');
        },
        error: (err: HttpErrorResponse) => {
          this.submitting = false;
          const body = err.error;
          const message =
            typeof body === 'string' ? body : body?.error ?? body?.message;
          this.toast.error(message || 'ADMIN_SETTINGS.NOTIFICATIONS.TEST_ERROR');
        }
      });
  }
}
