import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { ToastService } from 'src/app/shared/services/toast.service';
import { PermissionService } from 'src/app/settings/user-management/services/permission.service';
import {
  PermissionCatalogStatus,
  PermissionCatalogSyncResponse
} from '../models/permission-catalog.model';
import { PermissionCatalogAdminService } from '../services/permission-catalog-admin.service';

@Component({
  selector: 'app-admin-permission-catalog',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    SharedModule,
    TranslateModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './admin-permission-catalog.component.html',
  styleUrls: ['./admin-permission-catalog.component.scss']
})
export class AdminPermissionCatalogComponent implements OnInit {
  private readonly catalogService = inject(PermissionCatalogAdminService);
  private readonly permissionService = inject(PermissionService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  status: PermissionCatalogStatus | null = null;
  lastSyncResult: PermissionCatalogSyncResponse | null = null;
  loading = false;
  syncing = false;
  loadError = false;

  ngOnInit(): void {
    this.loadStatus();
  }

  loadStatus(): void {
    this.loading = true;
    this.loadError = false;
    this.catalogService
      .getCatalogStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (status) => {
          this.status = status;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.loadError = true;
        }
      });
  }

  syncCatalog(): void {
    this.syncing = true;
    this.catalogService
      .syncCatalog()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.syncing = false;
          this.lastSyncResult = response;
          if (response?.success) {
            this.status = response.status ?? this.status;
            this.permissionService.clearCache();
            this.toast.success('ADMIN_PERMISSION_CATALOG.SYNC_SUCCESS');
            if (!response.status) {
              this.loadStatus();
            }
            return;
          }
          this.toast.error(response?.message || 'ADMIN_PERMISSION_CATALOG.SYNC_ERROR');
        },
        error: () => {
          this.syncing = false;
          this.toast.error('ADMIN_PERMISSION_CATALOG.SYNC_ERROR');
        }
      });
  }

  catalogGap(): number {
    if (!this.status) {
      return 0;
    }
    return Math.max(0, this.status.expectedPermissionCount - this.status.dbActivePermissionCount);
  }
}
