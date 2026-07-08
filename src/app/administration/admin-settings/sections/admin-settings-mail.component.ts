import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { ToastService } from 'src/app/shared/services/toast.service';
import { AdminSetting, AdminSettingsStatus, FeatureStatus } from '../models/admin-setting.model';
import { AdminSettingsService } from '../services/admin-settings.service';
import { MailTestDialogComponent } from '../dialogs/mail-test-dialog.component';
import { RotateSecretDialogComponent } from '../dialogs/rotate-secret-dialog.component';
import {Component, DestroyRef, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges} from "@angular/core";

type MailProviderValue = 'RESEND' | 'SMTP';
type MailFieldKey =
  | 'MAIL_FROM_ADDRESS'
  | 'MAIL_FROM_NAME'
  | 'MAIL_SUPPORT_EMAIL'
  | 'SMTP_HOST'
  | 'SMTP_PORT'
  | 'SMTP_USERNAME';

@Component({
  selector: 'app-admin-settings-mail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    TranslateModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule
  ],
  templateUrl: './admin-settings-mail.component.html',
  styleUrls: ['./admin-settings-mail.component.scss']
})
export class AdminSettingsMailComponent implements OnChanges {
  private readonly settingsService = inject(AdminSettingsService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  @Input() settings: AdminSetting[] = [];
  @Input() status: AdminSettingsStatus | null = null;
  @Output() changed = new EventEmitter<void>();

  savingKey: string | null = null;

  readonly providerOptions: MailProviderValue[] = ['RESEND', 'SMTP'];

  readonly mailForm = this.fb.group({
    MAIL_ENABLED: [true],
    MAIL_PROVIDER: ['RESEND' as MailProviderValue],
    MAIL_FROM_ADDRESS: [''],
    MAIL_FROM_NAME: [''],
    MAIL_SUPPORT_EMAIL: [''],
    SMTP_HOST: [''],
    SMTP_PORT: ['587'],
    SMTP_USERNAME: [''],
    SMTP_AUTH: [true],
    SMTP_STARTTLS: [true]
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['settings']) {
      this.patchFormFromSettings();
    }
  }

  setting(key: string): AdminSetting | undefined {
    return this.settings.find((item) => item.key === key);
  }

  mailFeature(): FeatureStatus | null {
    return this.status?.features?.['mail'] ?? null;
  }

  selectedProvider(): MailProviderValue {
    const formValue = this.mailForm.get('MAIL_PROVIDER')?.value;
    if (formValue === 'SMTP' || formValue === 'RESEND') {
      return formValue;
    }
    const saved = this.setting('MAIL_PROVIDER')?.value?.toUpperCase();
    return saved === 'SMTP' ? 'SMTP' : 'RESEND';
  }

  isResend(): boolean {
    return this.selectedProvider() === 'RESEND';
  }

  isSmtp(): boolean {
    return this.selectedProvider() === 'SMTP';
  }

  isConfigured(key: string): boolean {
    return this.setting(key)?.configured === true;
  }

  hasFromAddress(): boolean {
    const value = this.mailForm.get('MAIL_FROM_ADDRESS')?.value?.trim()
      || this.setting('MAIL_FROM_ADDRESS')?.value?.trim();
    return !!value;
  }

  saveProvider(): void {
    const provider = this.mailForm.get('MAIL_PROVIDER')?.value ?? 'RESEND';
    this.saveSetting('MAIL_PROVIDER', String(provider));
  }

  saveAll(): void {
    const commonFields: MailFieldKey[] = ['MAIL_FROM_ADDRESS', 'MAIL_FROM_NAME', 'MAIL_SUPPORT_EMAIL'];
    const smtpFields: MailFieldKey[] = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USERNAME'];
    const fields = this.isSmtp() ? [...commonFields, ...smtpFields] : commonFields;

    const updates = fields
      .map((key) => ({ key, value: String(this.mailForm.get(key)?.value ?? '').trim() }))
      .filter((entry) => entry.value.length > 0);

    if (!updates.length) {
      this.toast.error('ADMIN_SETTINGS.MAIL.NOTHING_TO_SAVE');
      return;
    }

    this.savingKey = 'ALL';
    forkJoin(
      updates.map((entry) =>
        this.settingsService.update(entry.key, { value: entry.value }).pipe(
          catchError(() => of(null))
        )
      )
    )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.savingKey = null;
        })
      )
      .subscribe((results) => {
        const failed = results.filter((r) => r === null).length;
        if (failed === 0) {
          this.toast.success('ADMIN_SETTINGS.MAIL.SAVE_ALL_SUCCESS');
          this.changed.emit();
        } else if (failed < results.length) {
          this.toast.error('ADMIN_SETTINGS.MAIL.SAVE_ALL_PARTIAL');
          this.changed.emit();
        } else {
          this.toast.error('ADMIN_SETTINGS.SAVE_ERROR');
        }
      });
  }

  saveToggle(key: 'MAIL_ENABLED' | 'SMTP_AUTH' | 'SMTP_STARTTLS'): void {
    const enabled = this.mailForm.get(key)?.value ?? false;
    this.saveSetting(key, String(enabled));
  }

  saveField(key: MailFieldKey): void {
    const value = this.mailForm.get(key)?.value ?? '';
    this.saveSetting(key, String(value).trim());
  }

  openRotateSecretDialog(settingKey: 'RESEND_API_KEY' | 'SMTP_PASSWORD'): void {
    const setting = this.setting(settingKey);
    const hintKey = settingKey === 'SMTP_PASSWORD'
      ? 'ADMIN_SETTINGS.MAIL.SMTP_PASSWORD_HINT'
      : 'ADMIN_SETTINGS.MAIL.ROTATE_HINT';

    const dialogRef = this.dialog.open(RotateSecretDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      data: {
        settingKey,
        label: setting?.label ?? settingKey,
        hintKey
      }
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((updated) => {
      if (updated) {
        this.changed.emit();
      }
    });
  }

  openMailTestDialog(): void {
    const dialogRef = this.dialog.open(MailTestDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      data: {}
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((sent) => {
      if (sent) {
        this.changed.emit();
      }
    });
  }

  sourceLabel(source?: string): string {
    switch (source) {
      case 'DATABASE':
        return 'ADMIN_SETTINGS.SOURCE.DATABASE';
      case 'ENV':
        return 'ADMIN_SETTINGS.SOURCE.ENV';
      default:
        return 'ADMIN_SETTINGS.SOURCE.DEFAULT';
    }
  }

  private patchFormFromSettings(): void {
    this.mailForm.patchValue(
      {
        MAIL_ENABLED: this.readBoolean('MAIL_ENABLED', true),
        MAIL_PROVIDER: this.readProvider(),
        MAIL_FROM_ADDRESS: this.setting('MAIL_FROM_ADDRESS')?.value ?? '',
        MAIL_FROM_NAME: this.setting('MAIL_FROM_NAME')?.value ?? '',
        MAIL_SUPPORT_EMAIL: this.setting('MAIL_SUPPORT_EMAIL')?.value ?? '',
        SMTP_HOST: this.setting('SMTP_HOST')?.value ?? '',
        SMTP_PORT: this.setting('SMTP_PORT')?.value ?? '587',
        SMTP_USERNAME: this.setting('SMTP_USERNAME')?.value ?? '',
        SMTP_AUTH: this.readBoolean('SMTP_AUTH', true),
        SMTP_STARTTLS: this.readBoolean('SMTP_STARTTLS', true)
      },
      { emitEvent: false }
    );
  }

  private readProvider(): MailProviderValue {
    const value = this.setting('MAIL_PROVIDER')?.value?.toUpperCase();
    return value === 'SMTP' ? 'SMTP' : 'RESEND';
  }

  private readBoolean(key: string, fallback: boolean): boolean {
    const setting = this.setting(key);
    if (!setting) {
      return fallback;
    }
    if (setting.value != null) {
      return setting.value === 'true';
    }
    return fallback;
  }

  private saveSetting(key: string, value: string): void {
    this.savingKey = key;
    this.settingsService
      .update(key, { value })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.savingKey = null;
          this.toast.success('ADMIN_SETTINGS.SAVE_SUCCESS');
          this.changed.emit();
        },
        error: () => {
          this.savingKey = null;
          this.toast.error('ADMIN_SETTINGS.SAVE_ERROR');
        }
      });
  }
}
