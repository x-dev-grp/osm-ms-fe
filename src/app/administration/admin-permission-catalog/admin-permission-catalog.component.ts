import { Component, DestroyRef, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { ToastService } from 'src/app/shared/services/toast.service';
import { PermissionService } from 'src/app/settings/user-management/services/permission.service';
import {
  PermissionCatalogStatus,
  PermissionCatalogSyncResponse,
  PermissionSpecViewModel,
  ResolvedPermissionEntity
} from '../models/permission-catalog.model';
import { PermissionCatalogAdminService } from '../services/permission-catalog-admin.service';
import { parsePermissionSpecDocument } from '../utils/permission-spec-resolver.util';

type SpecTab = 'entities' | 'profiles' | 'mirrors' | 'presets';

@Component({
  selector: 'app-admin-permission-catalog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    SharedModule,
    TranslateModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  templateUrl: './admin-permission-catalog.component.html',
  styleUrls: ['./admin-permission-catalog.component.scss']
})
export class AdminPermissionCatalogComponent implements OnInit {
  private readonly catalogService = inject(PermissionCatalogAdminService);
  private readonly permissionService = inject(PermissionService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('specFileInput') specFileInput?: ElementRef<HTMLInputElement>;

  status: PermissionCatalogStatus | null = null;
  lastSyncResult: PermissionCatalogSyncResponse | null = null;
  loading = false;
  syncing = false;
  loadError = false;

  specView: PermissionSpecViewModel | null = null;
  selectedEntity: ResolvedPermissionEntity | null = null;
  activeTab: SpecTab = 'entities';
  entitySearch = '';
  moduleFilter = 'ALL';
  parsingSpec = false;
  loadingLiveSpec = false;
  downloadingSpec = false;
  /** True when the visualized JSON came from the live backend classpath. */
  liveSpecLoaded = false;
  private rawSpecJson: unknown | null = null;

  ngOnInit(): void {
    this.loadStatus();
    this.loadLiveSpec(true);
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
            this.loadLiveSpec(true);
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

  loadLiveSpec(silent = false): void {
    this.loadingLiveSpec = true;
    this.parsingSpec = true;
    this.catalogService
      .getCatalogSpec()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (json) => {
          try {
            this.applySpecJson(json, 'permissions-spec.json (server)', true);
            if (!silent) {
              this.toast.success('ADMIN_PERMISSION_CATALOG.SPEC.LOADED_LIVE');
            }
          } catch (error) {
            console.error(error);
            if (!silent) {
              this.toast.error('ADMIN_PERMISSION_CATALOG.SPEC.PARSE_ERROR');
            }
          } finally {
            this.loadingLiveSpec = false;
            this.parsingSpec = false;
          }
        },
        error: () => {
          this.loadingLiveSpec = false;
          this.parsingSpec = false;
          if (!silent) {
            this.toast.error('ADMIN_PERMISSION_CATALOG.SPEC.LOAD_LIVE_ERROR');
          }
        }
      });
  }

  downloadLiveSpec(): void {
    this.downloadingSpec = true;
    this.catalogService
      .downloadCatalogSpec()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          this.downloadingSpec = false;
          this.triggerBrowserDownload(blob, 'permissions-spec.json');
          this.toast.success('ADMIN_PERMISSION_CATALOG.SPEC.DOWNLOAD_SUCCESS');
        },
        error: () => {
          this.downloadingSpec = false;
          if (this.rawSpecJson) {
            const blob = new Blob([JSON.stringify(this.rawSpecJson, null, 2)], {
              type: 'application/json'
            });
            this.triggerBrowserDownload(blob, 'permissions-spec.json');
            this.toast.success('ADMIN_PERMISSION_CATALOG.SPEC.DOWNLOAD_SUCCESS');
            return;
          }
          this.toast.error('ADMIN_PERMISSION_CATALOG.SPEC.DOWNLOAD_ERROR');
        }
      });
  }

  openSpecPicker(): void {
    this.specFileInput?.nativeElement.click();
  }

  onSpecFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.loadSpecFile(file);
    input.value = '';
  }

  onSpecFileDropped(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file) {
      return;
    }
    this.loadSpecFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  clearSpecView(): void {
    this.specView = null;
    this.selectedEntity = null;
    this.entitySearch = '';
    this.moduleFilter = 'ALL';
    this.activeTab = 'entities';
    this.liveSpecLoaded = false;
    this.rawSpecJson = null;
  }

  selectEntity(entity: ResolvedPermissionEntity): void {
    this.selectedEntity = entity;
  }

  setTab(tab: SpecTab): void {
    this.activeTab = tab;
  }

  filteredEntities(): ResolvedPermissionEntity[] {
    if (!this.specView) {
      return [];
    }
    const query = this.entitySearch.trim().toLowerCase();
    return this.specView.entities.filter((entity) => {
      if (this.moduleFilter !== 'ALL' && entity.module !== this.moduleFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        entity.entity.toLowerCase().includes(query) ||
        entity.module.toLowerCase().includes(query) ||
        (entity.profile ?? '').toLowerCase().includes(query) ||
        (entity.description ?? '').toLowerCase().includes(query) ||
        entity.resolvedActions.some((action) => action.toLowerCase().includes(query))
      );
    });
  }

  private loadSpecFile(file: File): void {
    if (!file.name.toLowerCase().endsWith('.json')) {
      this.toast.error('ADMIN_PERMISSION_CATALOG.SPEC.INVALID_TYPE');
      return;
    }

    this.parsingSpec = true;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? '');
        const json = JSON.parse(text) as unknown;
        this.applySpecJson(json, file.name, false);
        this.toast.success('ADMIN_PERMISSION_CATALOG.SPEC.LOADED');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'ADMIN_PERMISSION_CATALOG.SPEC.PARSE_ERROR';
        this.toast.error(message.includes(' ') ? 'ADMIN_PERMISSION_CATALOG.SPEC.PARSE_ERROR' : message);
        console.error(error);
      } finally {
        this.parsingSpec = false;
      }
    };
    reader.onerror = () => {
      this.parsingSpec = false;
      this.toast.error('ADMIN_PERMISSION_CATALOG.SPEC.PARSE_ERROR');
    };
    reader.readAsText(file);
  }

  private applySpecJson(json: unknown, fileName: string, fromServer: boolean): void {
    const view = parsePermissionSpecDocument(json, fileName);
    this.rawSpecJson = json;
    this.specView = view;
    this.selectedEntity = view.entities[0] ?? null;
    this.moduleFilter = 'ALL';
    this.entitySearch = '';
    this.activeTab = 'entities';
    this.liveSpecLoaded = fromServer;
    if (view.parseWarnings?.length) {
      console.warn('Permission spec parse warnings:', view.parseWarnings);
    }
  }

  private triggerBrowserDownload(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
