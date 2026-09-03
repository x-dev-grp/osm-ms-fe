import { AfterViewInit, Component, DestroyRef, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, filter, of, switchMap } from 'rxjs';
import { SharedModule } from 'src/app/shared/shared.module';
import { CompanyProfileService } from 'src/app/shared/services/company-profile.service';
import { ToastService } from 'src/app/shared/services/toast.service';
import {
  ConfirmationDialogService,
  ConfirmationType
} from 'src/app/shared/services/confirmation-dialog.service';
import { TENANT_MODULE_OPTIONS } from 'src/app/shared/constants/tenant-modules.constants';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { CompanyProfile } from 'src/app/shared/models/CompanyProfile';

@Component({
  selector: 'app-admin-company-view',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    SharedModule,
    TranslateModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './admin-company-view.component.html',
  styleUrls: ['./admin-company-view.component.scss']
})
export class AdminCompanyViewComponent implements OnInit, AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly companyProfileService = inject(CompanyProfileService);
  private readonly toast = inject(ToastService);
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  @ViewChild('modulesSection') modulesSection?: ElementRef<HTMLElement>;

  readonly moduleOptions = TENANT_MODULE_OPTIONS;
  modulesForm: FormGroup = this.fb.group({});
  profile: CompanyProfile | null = null;
  loading = false;
  saving = false;
  lifecycleBusy = false;
  tenantId = '';
  focusModules = false;

  ngOnInit(): void {
    this.tenantId = this.route.snapshot.paramMap.get('tenantId') ?? '';
    this.focusModules = this.route.snapshot.queryParamMap.get('focus') === 'modules';
    if (!this.tenantId) {
      void this.router.navigate(['/administration/companies']);
      return;
    }
    this.buildModulesForm();
    this.loadProfile();
  }

  ngAfterViewInit(): void {
    if (this.focusModules) {
      setTimeout(() => this.scrollToModules(), 150);
    }
  }

  get isDeactivated(): boolean {
    if (!this.profile) {
      return false;
    }
    return this.profile.deleted === true || this.profile.isDeleted === true || this.profile.active === false;
  }

  private buildModulesForm(): void {
    const group: Record<string, unknown> = {};
    for (const option of this.moduleOptions) {
      group[option.value] = [false];
    }
    this.modulesForm = this.fb.group(group);
  }

  private loadProfile(): void {
    this.loading = true;
    this.http
      .get<CompanyProfile>(`${environment.apiUrl}/api/security/company-profile/by-tenant/${this.tenantId}`)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of(null))
      )
      .subscribe((profile) => {
        this.loading = false;
        if (!profile) {
          this.toast.error('Unable to load company profile');
          return;
        }
        this.applyProfile(profile);
        if (this.focusModules) {
          setTimeout(() => this.scrollToModules(), 150);
        }
      });
  }

  private applyProfile(profile: CompanyProfile): void {
    this.profile = profile;
    const enabled = new Set((profile.enabledModules ?? []).map((module) => module.toUpperCase()));
    for (const option of this.moduleOptions) {
      this.modulesForm.get(option.value)?.setValue(enabled.has(option.value));
    }
    if (this.isDeactivated) {
      this.modulesForm.disable({ emitEvent: false });
    } else {
      this.modulesForm.enable({ emitEvent: false });
    }
  }

  activateModules(): void {
    if (this.isDeactivated) {
      return;
    }
    const enabledModules = this.moduleOptions
      .filter((option) => this.modulesForm.get(option.value)?.value)
      .map((option) => option.value);

    if (!enabledModules.length) {
      this.toast.error('Select at least one module');
      return;
    }

    this.saving = true;
    this.companyProfileService
      .updateTenantModules(this.tenantId, enabledModules)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.saving = false;
          this.applyProfile(updated);
          this.toast.success('Tenant modules updated');
        },
        error: () => {
          this.saving = false;
          this.toast.error('Unable to update tenant modules');
        }
      });
  }

  deactivateCompany(): void {
    if (!this.profile || this.isDeactivated || this.lifecycleBusy) {
      return;
    }
    this.confirmationDialog
      .confirm({
        title: 'TENANT_MODULES.DANGER.DEACTIVATE_TITLE',
        message: 'TENANT_MODULES.DANGER.DEACTIVATE_MESSAGE',
        type: ConfirmationType.WARNING,
        confirmText: 'TENANT_MODULES.DANGER.DEACTIVATE_CONFIRM',
        cancelText: 'STANDARD.CONFIRMATION.WARNING.CANCEL',
        showIcon: true,
        itemName: this.profile.legalName,
        destructive: true
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((result) => !!result?.confirmed),
        switchMap(() => {
          this.lifecycleBusy = true;
          return this.companyProfileService.deactivateTenant(this.tenantId);
        })
      )
      .subscribe({
        next: (updated) => {
          this.lifecycleBusy = false;
          this.applyProfile(updated);
          this.toast.success('TENANT_MODULES.DANGER.DEACTIVATE_SUCCESS');
        },
        error: () => {
          this.lifecycleBusy = false;
          this.toast.error('TENANT_MODULES.DANGER.DEACTIVATE_ERROR');
        }
      });
  }

  reactivateCompany(): void {
    if (!this.profile || !this.isDeactivated || this.lifecycleBusy) {
      return;
    }
    this.confirmationDialog
      .confirm({
        title: 'TENANT_MODULES.DANGER.REACTIVATE_TITLE',
        message: 'TENANT_MODULES.DANGER.REACTIVATE_MESSAGE',
        type: ConfirmationType.INFO,
        confirmText: 'TENANT_MODULES.DANGER.REACTIVATE_CONFIRM',
        cancelText: 'STANDARD.CONFIRMATION.WARNING.CANCEL',
        showIcon: true,
        itemName: this.profile.legalName,
        destructive: false
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((result) => !!result?.confirmed),
        switchMap(() => {
          this.lifecycleBusy = true;
          return this.companyProfileService.reactivateTenant(this.tenantId);
        })
      )
      .subscribe({
        next: (updated) => {
          this.lifecycleBusy = false;
          this.applyProfile(updated);
          this.toast.success('TENANT_MODULES.DANGER.REACTIVATE_SUCCESS');
        },
        error: () => {
          this.lifecycleBusy = false;
          this.toast.error('TENANT_MODULES.DANGER.REACTIVATE_ERROR');
        }
      });
  }

  purgeCompany(): void {
    if (!this.profile || this.lifecycleBusy) {
      return;
    }
    const legalName = this.profile.legalName ?? '';
    this.confirmationDialog
      .confirm({
        title: 'TENANT_MODULES.DANGER.PURGE_TITLE',
        message: 'TENANT_MODULES.DANGER.PURGE_MESSAGE',
        type: ConfirmationType.DANGER,
        confirmText: 'TENANT_MODULES.DANGER.PURGE_CONFIRM',
        cancelText: 'STANDARD.CONFIRMATION.WARNING.CANCEL',
        showIcon: true,
        itemName: legalName,
        destructive: true,
        requiredText: legalName,
        requiredTextPlaceholder: legalName,
        requiredTextHint: `Type "${legalName}" to confirm permanent deletion.`,
        requiredTextCaseSensitive: true
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((result) => !!result?.confirmed),
        switchMap(() => {
          this.lifecycleBusy = true;
          return this.companyProfileService.purgeTenant(this.tenantId, legalName);
        })
      )
      .subscribe({
        next: () => {
          this.lifecycleBusy = false;
          this.toast.success('TENANT_MODULES.DANGER.PURGE_SUCCESS');
          void this.router.navigate(['/administration/companies']);
        },
        error: () => {
          this.lifecycleBusy = false;
          this.toast.error('TENANT_MODULES.DANGER.PURGE_ERROR');
        }
      });
  }

  scrollToModules(): void {
    this.modulesSection?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  enabledModulesLabel(): string {
    const modules = this.profile?.enabledModules ?? [];
    return modules.length ? modules.join(', ') : '—';
  }
}
