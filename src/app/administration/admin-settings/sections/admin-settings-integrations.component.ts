import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
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
import { ConfirmationDialogService, ConfirmationType } from 'src/app/shared/services/confirmation-dialog.service';
import { AdminSetting, AdminSettingsStatus, FeatureStatus } from '../models/admin-setting.model';
import { AdminSettingsService } from '../services/admin-settings.service';
import { RotateSecretDialogComponent } from '../dialogs/rotate-secret-dialog.component';
import { Component, DestroyRef, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

type NewRelicRegion = 'EU' | 'US';

type IntegrationsFieldKey =
  | 'NEW_RELIC_APM_ENABLED'
  | 'NEW_RELIC_APP_NAME'
  | 'NEW_RELIC_LOG_FORWARDING_ENABLED'
  | 'NEW_RELIC_REGION'
  | 'NEW_RELIC_BROWSER_ENABLED'
  | 'NEW_RELIC_BROWSER_ACCOUNT_ID'
  | 'NEW_RELIC_BROWSER_APPLICATION_ID'
  | 'NEW_RELIC_BROWSER_LICENSE_KEY';

const APM_FIELDS: IntegrationsFieldKey[] = [
  'NEW_RELIC_APM_ENABLED',
  'NEW_RELIC_APP_NAME',
  'NEW_RELIC_LOG_FORWARDING_ENABLED',
  'NEW_RELIC_REGION'
];

const BROWSER_FIELDS: IntegrationsFieldKey[] = [
  'NEW_RELIC_BROWSER_ENABLED',
  'NEW_RELIC_BROWSER_ACCOUNT_ID',
  'NEW_RELIC_BROWSER_APPLICATION_ID',
  'NEW_RELIC_BROWSER_LICENSE_KEY'
];

const ALL_FORM_FIELDS: IntegrationsFieldKey[] = [...APM_FIELDS, ...BROWSER_FIELDS];

@Component({
  selector: 'app-admin-settings-integrations',
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
  templateUrl: './admin-settings-integrations.component.html',
  styleUrls: ['./admin-settings-integrations.component.scss']
})
export class AdminSettingsIntegrationsComponent implements OnChanges {
  private readonly settingsService = inject(AdminSettingsService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  @Input() settings: AdminSetting[] = [];
  @Input() status: AdminSettingsStatus | null = null;
  @Output() changed = new EventEmitter<void>();

  saving = false;

  readonly regionOptions: NewRelicRegion[] = ['EU', 'US'];

  readonly integrationsForm = this.fb.group({
    NEW_RELIC_APM_ENABLED: [false],
    NEW_RELIC_APP_NAME: [''],
    NEW_RELIC_LOG_FORWARDING_ENABLED: [true],
    NEW_RELIC_REGION: ['EU' as NewRelicRegion],
    NEW_RELIC_BROWSER_ENABLED: [false],
    NEW_RELIC_BROWSER_ACCOUNT_ID: [''],
    NEW_RELIC_BROWSER_APPLICATION_ID: [''],
    NEW_RELIC_BROWSER_LICENSE_KEY: ['']
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['settings']) {
      this.patchFormFromSettings();
    }
  }

  setting(key: string): AdminSetting | undefined {
    return this.settings.find((item) => item.key === key);
  }

  apmFeature(): FeatureStatus | null {
    return this.status?.features?.['newRelicApm'] ?? null;
  }

  browserFeature(): FeatureStatus | null {
    return this.status?.features?.['newRelicBrowser'] ?? null;
  }

  settingRequiresRestart(key: string): boolean {
    return this.setting(key)?.restartRequired === true;
  }

  saveAll(): void {
    const updates = ALL_FORM_FIELDS.map((key) => ({
      key,
      value: this.formValueAsString(key)
    }));

    if (!updates.length) {
      this.toast.error('ADMIN_SETTINGS.INTEGRATIONS.NOTHING_TO_SAVE');
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
          this.saving = true;
          return forkJoin(
            updates.map((entry) =>
              this.persistSetting(entry.key, entry.value, this.settingRequiresRestart(entry.key)).pipe(
                catchError(() => of(null))
              )
            )
          ).pipe(finalize(() => {
            this.saving = false;
          }));
        })
      )
      .subscribe((results) => {
        if (results === null) {
          return;
        }
        const failed = results.filter((r) => r === null).length;
        if (failed === 0) {
          this.toast.success('ADMIN_SETTINGS.INTEGRATIONS.SAVE_ALL_SUCCESS');
          this.changed.emit();
        } else if (failed < results.length) {
          this.toast.error('ADMIN_SETTINGS.INTEGRATIONS.SAVE_ALL_PARTIAL');
          this.changed.emit();
        } else {
          this.toast.error('ADMIN_SETTINGS.SAVE_ERROR');
        }
      });
  }

  openRotateSecretDialog(): void {
    const licenseSetting = this.setting('NEW_RELIC_LICENSE_KEY');
    const dialogRef = this.dialog.open(RotateSecretDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      data: {
        settingKey: 'NEW_RELIC_LICENSE_KEY',
        label: licenseSetting?.label ?? 'NEW_RELIC_LICENSE_KEY',
        hintKey: 'ADMIN_SETTINGS.INTEGRATIONS.LICENSE_KEY_HINT'
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

  featureStatusLabel(feature: FeatureStatus): string {
    if (feature.enabled) {
      return 'ADMIN_SETTINGS.CATEGORY.STATUS_READY';
    }
    if (feature.configured) {
      return 'ADMIN_SETTINGS.CATEGORY.STATUS_PARTIAL';
    }
    return 'ADMIN_SETTINGS.CATEGORY.STATUS_MISSING';
  }

  private patchFormFromSettings(): void {
    this.integrationsForm.patchValue(
      {
        NEW_RELIC_APM_ENABLED: this.readBoolean('NEW_RELIC_APM_ENABLED', false),
        NEW_RELIC_APP_NAME: this.setting('NEW_RELIC_APP_NAME')?.value ?? '',
        NEW_RELIC_LOG_FORWARDING_ENABLED: this.readBoolean('NEW_RELIC_LOG_FORWARDING_ENABLED', true),
        NEW_RELIC_REGION: this.readRegion(),
        NEW_RELIC_BROWSER_ENABLED: this.readBoolean('NEW_RELIC_BROWSER_ENABLED', false),
        NEW_RELIC_BROWSER_ACCOUNT_ID: this.setting('NEW_RELIC_BROWSER_ACCOUNT_ID')?.value ?? '',
        NEW_RELIC_BROWSER_APPLICATION_ID: this.setting('NEW_RELIC_BROWSER_APPLICATION_ID')?.value ?? '',
        NEW_RELIC_BROWSER_LICENSE_KEY: this.setting('NEW_RELIC_BROWSER_LICENSE_KEY')?.value ?? ''
      },
      { emitEvent: false }
    );
  }

  private readRegion(): NewRelicRegion {
    const value = this.setting('NEW_RELIC_REGION')?.value?.toUpperCase();
    return value === 'US' ? 'US' : 'EU';
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

  private formValueAsString(key: IntegrationsFieldKey): string {
    const setting = this.setting(key);
    if (setting?.valueType === 'BOOLEAN') {
      return String(this.integrationsForm.get(key)?.value ?? false);
    }
    return String(this.integrationsForm.get(key)?.value ?? '').trim();
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
}
