import { Component, DestroyRef, inject, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { FiltrationApiService } from '../../shared/services/filtration-api.service';
import { FiltrationOperation } from '../../shared/models/filtration-operation';
import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';
import { DashboardConfig } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { FILTRATION_DASHBOARD_CONFIG } from './filtration-dashboard.config';
import { FiltrationStatusDialogComponent } from './filtration-status-dialog/filtration-status-dialog.component';
import { FiltrationDeleteDialogComponent } from './filtration-delete-dialog/filtration-delete-dialog.component';

@Component({
  selector: 'app-filtration-list',
  standalone: true,
  imports: [TranslateModule, MatDialogModule, OsmDashboard],
  templateUrl: './filtration-list.component.html',
  styleUrls: ['./filtration-list.component.scss']
})
export class FiltrationListComponent {
  dashboardConfig: DashboardConfig = FILTRATION_DASHBOARD_CONFIG;

  @ViewChild('dashboard') dashboard!: OsmDashboard;

  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(FiltrationApiService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  handleAction(event: { row: FiltrationOperation & { id?: string }; action: string }): void {
    const row = this.normalizeRow(event.row);
    const operationId = row.operationId;
    const action = event.action?.toUpperCase();

    if (!operationId) {
      return;
    }

    switch (action) {
      case 'READ':
        void this.router.navigate(['storage', 'oil-filtering', operationId, 'view']);
        break;
      case 'UPDATE':
        this.onEdit(row, operationId);
        break;
      case 'START':
        this.onStart(operationId);
        break;
      case 'STATUS':
        this.onChangeStatus(row);
        break;
      case 'TRACEABILITY':
        void this.router.navigate(['storage', 'oil-filtering', operationId, 'traceability']);
        break;
      case 'QUALITY':
      case 'OIL_QUALITY':
      case 'UPDATE_OIL_QUALITY':
        if (String(row.status) === 'COMPLETED') {
          void this.router.navigate(['storage', 'oil-filtering', operationId, 'quality']);
        }
        break;
      case 'PREPARE_LABEL':
        this.onPrepareLabel(row);
        break;
      case 'REMOVE':
        this.onDelete(row);
        break;
    }
  }

  private onEdit(row: FiltrationOperation, operationId: string): void {
    const status = String(row.status);
    if (status !== 'CREATED' && status !== 'COMPLETED') {
      return;
    }
    void this.router.navigate(['storage', 'oil-filtering', operationId, 'edit']);
  }

  private onStart(operationId: string): void {
    this.api
      .start(operationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.refreshDashboard()
      });
  }

  private onChangeStatus(row: FiltrationOperation): void {
    const dialogRef = this.dialog.open(FiltrationStatusDialogComponent, {
      width: '520px',
      data: { row: this.normalizeRow(row) }
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((changed: boolean) => {
        if (changed) {
          this.refreshDashboard();
        }
      });
  }

  private onDelete(row: FiltrationOperation): void {
    const dialogRef = this.dialog.open(FiltrationDeleteDialogComponent, {
      width: '420px',
      data: { row: this.normalizeRow(row) }
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed: boolean) => {
        if (!confirmed) {
          return;
        }

        this.api
          .delete(row.operationId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => this.refreshDashboard()
          });
      });
  }

  private onPrepareLabel(row: FiltrationOperation & { targetStorageUnit?: { id?: string }; target?: { id?: string } }): void {
    const targetId = row.target?.id ?? row.targetStorageUnit?.id;
    if (!targetId) {
      return;
    }

    void this.router.navigate(['/labels', 'new'], {
      queryParams: { lotId: targetId }
    });
  }

  private refreshDashboard(): void {
    this.dashboard?.refrechData();
  }

  private normalizeRow(row: FiltrationOperation & { id?: string }): FiltrationOperation {
    return {
      ...row,
      operationId: row.operationId ?? row.id ?? '',
      source: row.source ?? (row as { sourceStorageUnit?: FiltrationOperation['source'] }).sourceStorageUnit,
      target: row.target ?? (row as { targetStorageUnit?: FiltrationOperation['target'] }).targetStorageUnit,
      volumeFiltered: row.volumeFiltered ?? (row as { volumeToFilter?: number }).volumeToFilter ?? 0
    };
  }
}
