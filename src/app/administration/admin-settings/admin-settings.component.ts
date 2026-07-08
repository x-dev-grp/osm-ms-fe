import { Component, DestroyRef, inject, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { RouterLink } from '@angular/router';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatButtonModule } from '@angular/material/button';

import { MatIconModule } from '@angular/material/icon';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatTabsModule } from '@angular/material/tabs';

import { MatTooltipModule } from '@angular/material/tooltip';

import { TranslateModule } from '@ngx-translate/core';

import { SharedModule } from 'src/app/shared/shared.module';

import { AdminSetting, AdminSettingAuditEntry, AdminSettingsStatus } from './models/admin-setting.model';

import { AdminSettingsService } from './services/admin-settings.service';

import { AdminSettingsMailComponent } from './sections/admin-settings-mail.component';

import { AdminSettingsCategoryComponent } from './sections/admin-settings-category.component';



@Component({

  selector: 'app-admin-settings',

  standalone: true,

  imports: [

    CommonModule,

    RouterLink,

    SharedModule,

    TranslateModule,

    MatButtonModule,

    MatIconModule,

    MatProgressSpinnerModule,

    MatTabsModule,

    MatTooltipModule,

    AdminSettingsMailComponent,

    AdminSettingsCategoryComponent

  ],

  templateUrl: './admin-settings.component.html',

  styleUrls: ['./admin-settings.component.scss']

})

export class AdminSettingsComponent implements OnInit {

  private readonly settingsService = inject(AdminSettingsService);

  private readonly destroyRef = inject(DestroyRef);



  loading = false;

  loadError = false;

  reloading = false;

  categorySettings: Record<string, AdminSetting[]> = {};

  status: AdminSettingsStatus | null = null;

  auditEntries: AdminSettingAuditEntry[] = [];



  ngOnInit(): void {

    this.loadAll();

  }



  refresh(): void {

    this.loadAll();

  }



  settingsFor(category: string): AdminSetting[] {

    return this.categorySettings[category] ?? [];

  }



  reloadCache(): void {

    this.reloading = true;

    this.settingsService

      .reload()

      .pipe(takeUntilDestroyed(this.destroyRef))

      .subscribe({

        next: (status) => {

          this.status = status;

          this.reloading = false;

        },

        error: () => {

          this.reloading = false;

        }

      });

  }



  private loadAll(): void {

    this.loading = true;

    this.loadError = false;



    this.settingsService

      .list()

      .pipe(takeUntilDestroyed(this.destroyRef))

      .subscribe({

        next: (response) => {

          const grouped: Record<string, AdminSetting[]> = {};

          for (const category of response.categories ?? []) {

            grouped[category.key] = category.settings ?? [];

          }

          this.categorySettings = grouped;

          this.loading = false;

        },

        error: () => {

          this.categorySettings = {};

          this.loading = false;

          this.loadError = true;

        }

      });



    this.settingsService

      .getStatus()

      .pipe(takeUntilDestroyed(this.destroyRef))

      .subscribe({

        next: (status) => {

          this.status = status;

        },

        error: () => {

          this.status = null;

        }

      });



    this.settingsService

      .listAudit(undefined, 0, 10)

      .pipe(takeUntilDestroyed(this.destroyRef))

      .subscribe({

        next: (page) => {

          this.auditEntries = page.content ?? [];

        },

        error: () => {

          this.auditEntries = [];

        }

      });

  }

}


