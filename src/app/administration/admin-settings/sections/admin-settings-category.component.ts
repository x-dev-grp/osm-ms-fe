import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
import { ConfirmationDialogService, ConfirmationType } from 'src/app/shared/services/confirmation-dialog.service';
import { AdminSetting, AdminSettingsStatus, FeatureStatus } from '../models/admin-setting.model';
import { AdminSettingsService } from '../services/admin-settings.service';
import { RotateSecretDialogComponent } from '../dialogs/rotate-secret-dialog.component';
import { Component, DestroyRef, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-admin-settings-category',
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
  templateUrl: './admin-settings-category.component.html',
  styleUrls: ['./admin-settings-category.component.scss']
})
export class AdminSettingsCategoryComponent implements OnChanges {
  private static readonly RESTART_REQUIRED_KEYS = new Set([
    'SPRINGDOC_ENABLED',
    'SEARCH_DEBUG_ON_STARTUP',
    'HEALTH_SHOW_DETAILS'
  ]);

  private readonly settingsService = inject(AdminSettingsService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  @Input() settings: AdminSetting[] = [];
  @Input() status: AdminSettingsStatus | null = null;
  @Input() titleKey = '';
  @Input() icon = 'settings';
  @Input() featureKey: string | null = null;
  @Output() changed = new EventEmitter<void>();

  savingKey: string | null = null;
  form: FormGroup = this.fb.group({});

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['settings']) {
      this.buildForm();
    }
  }

  editableSettings(): AdminSetting[] {
    return this.settings.filter((s) => s.editable && !s.sensitive);
  }

  secretSettings(): AdminSetting[] {
    return this.settings.filter((s) => s.sensitive);
  }

  featureStatus(): FeatureStatus | null {
    if (!this.featureKey) {
      return null;
    }
    return this.status?.features?.[this.featureKey] ?? null;
  }

  enumOptions(key: string): string[] | null {
    switch (key) {
      case 'LOG_LEVEL_WEB':
      case 'LOG_LEVEL_REST':
        return ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'OFF'];
      case 'HEALTH_SHOW_DETAILS':
        return ['never', 'when_authorized', 'always'];
      default:
        return null;
    }
  }

  isBoolean(setting: AdminSetting): boolean {
    return setting.valueType === 'BOOLEAN';
  }

  isEnum(setting: AdminSetting): boolean {
    return setting.valueType === 'ENUM' || this.enumOptions(setting.key) !== null;
  }

  saveToggle(key: string): void {
    const enabled = this.form.get(key)?.value ?? false;
    this.saveSetting(key, String(enabled));
  }

  saveField(key: string): void {
    const value = this.form.get(key)?.value ?? '';
    this.saveSetting(key, String(value).trim());
  }

  saveAll(): void {
    const updates = this.editableSettings()
      .map((setting) => ({
        key: setting.key,
        value: String(this.form.get(setting.key)?.value ?? '').trim()
      }))
      .filter((entry) => entry.value.length > 0);

    if (!updates.length) {
      this.toast.error('ADMIN_SETTINGS.CATEGORY.NOTHING_TO_SAVE');
      return;
    }

    const requiresRestart = updates.some((entry) => this.settingRequiresRestart(entry.key));

    this.confirmRestartIfNeeded(requiresRestart)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((confirmed) => {
          if (!confirmed) {
            return of(null);
          }
          this.savingKey = 'ALL';
          return forkJoin(
            updates.map((entry) =>
              this.persistSetting(entry.key, entry.value, this.settingRequiresRestart(entry.key)).pipe(
                catchError(() => of(null))
              )
            )
          ).pipe(finalize(() => {
            this.savingKey = null;
          }));
        })
      )
      .subscribe((results) => {
        if (results === null) {
          return;
        }
        const failed = results.filter((r) => r === null).length;
        if (failed === 0) {
          this.toast.success('ADMIN_SETTINGS.CATEGORY.SAVE_ALL_SUCCESS');
          this.changed.emit();
        } else if (failed < results.length) {
          this.toast.error('ADMIN_SETTINGS.CATEGORY.SAVE_ALL_PARTIAL');
          this.changed.emit();
        } else {
          this.toast.error('ADMIN_SETTINGS.SAVE_ERROR');
        }
      });
  }

  openRotateSecretDialog(setting: AdminSetting): void {
    const dialogRef = this.dialog.open(RotateSecretDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      data: {
        settingKey: setting.key,
        label: setting.label,
        hintKey: 'ADMIN_SETTINGS.MAIL.ROTATE_HINT'
      }
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((updated) => {
      if (updated) {
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

  private buildForm(): void {
    const group: Record<string, unknown> = {};
    for (const setting of this.editableSettings()) {
      group[setting.key] = [this.readInitialValue(setting)];
    }
    this.form = this.fb.group(group);
  }

  private readInitialValue(setting: AdminSetting): string | boolean {
    if (setting.valueType === 'BOOLEAN') {
      return setting.value === 'true';
    }
    if (setting.value != null) {
      return setting.value;
    }
    return '';
  }

  private settingByKey(key: string): AdminSetting | undefined {
    return this.settings.find((setting) => setting.key === key);
  }

  private settingRequiresRestart(key: string): boolean {
    const setting = this.settingByKey(key);
    if (setting?.restartRequired) {
      return true;
    }
    return AdminSettingsCategoryComponent.RESTART_REQUIRED_KEYS.has(key);
  }

  private confirmRestartIfNeeded(required: boolean) {
    if (!required) {
      return of(true);
    }
    return this.confirmationDialog
      .confirm({
        title: 'ADMIN_SETTINGS.CATEGORY.RESTART_CONFIRM_TITLE',
        message: 'ADMIN_SETTINGS.CATEGORY.RESTART_CONFIRM_MESSAGE',
        type: ConfirmationType.WARNING,
        confirmText: 'ADMIN_SETTINGS.CATEGORY.RESTART_CONFIRM_BUTTON',
        cancelText: 'STANDARD.CONFIRMATION.WARNING.CANCEL',
        showIcon: true,
        destructive: false
      })
      .pipe(map((result) => result?.confirmed ?? false));
  }

  private revertFieldValue(key: string): void {
    const setting = this.settingByKey(key);
    if (!setting) {
      return;
    }
    this.form.get(key)?.setValue(this.readInitialValue(setting), { emitEvent: false });
  }

  private persistSetting(key: string, value: string, confirmRestart: boolean): Observable<AdminSetting> {
    return this.settingsService.update(key, { value, confirmRestart }).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 409 && error.error?.restartRequired && !confirmRestart) {
          return this.confirmRestartIfNeeded(true).pipe(
            switchMap((confirmed) => {
              if (!confirmed) {
                return throwError(() => error);
              }
              return this.settingsService.update(key, { value, confirmRestart: true });
            })
          );
        }
        return throwError(() => error);
      })
    );
  }

  private saveSetting(key: string, value: string): void {
    const requiresRestart = this.settingRequiresRestart(key);

    this.confirmRestartIfNeeded(requiresRestart)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((confirmed) => {
          if (!confirmed) {
            this.revertFieldValue(key);
            return of(null);
          }
          this.savingKey = key;
          return this.persistSetting(key, value, requiresRestart).pipe(
            finalize(() => {
              this.savingKey = null;
            })
          );
        })
      )
      .subscribe({
        next: (updated) => {
          if (!updated) {
            return;
          }
          this.toast.success('ADMIN_SETTINGS.SAVE_SUCCESS');
          this.changed.emit();
        },
        error: () => {
          this.revertFieldValue(key);
          this.toast.error('ADMIN_SETTINGS.SAVE_ERROR');
        }
      });
  }
}
