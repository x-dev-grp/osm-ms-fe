import { Component, DestroyRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TypeCategory } from '../../shared/models/type-category.enum';
import { BaseType } from '../../shared/models/base-type';
import { DashboardConfig } from 'src/app/shared/modules/oosm-dashboard/models/dashboard-config';
import { BASE_TYPE } from './BASE_TYPE_DASHBOARD';
import { OosmDashboard } from '../../shared/modules/oosm-dashboard/oosm-dashboard';
import { GenericTypeDialogComponent } from './generic-type-dialog/generic-type-dialog.component';
import { GenericTypeService } from '../../shared/services/generic-type.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-generic-type',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, OosmDashboard],
  templateUrl: './generic-type.component.html',
  styleUrls: ['./generic-type.component.scss']
})
export class GenericTypeComponent {
  readonly dashboardConfig: DashboardConfig = BASE_TYPE;
  provisioning = false;

  @ViewChild('dashboard') dashboard!: OosmDashboard;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private genericTypeService: GenericTypeService,
    private toastService: ToastService
  ) {}

  openAddDialog(): void {
    const dialogRef = this.dialog.open(GenericTypeDialogComponent, {
      width: '500px',
      data: {
        initialType: this.getActiveTypeFilter(),
        typeCategories: Object.values(TypeCategory)
      }
    });

    dialogRef.afterClosed().subscribe((created: BaseType | null) => {
      if (created) {
        this.dashboard.refrechData();
      }
    });
  }

  applyAction(event: { row: BaseType; action: string }): void {
    const id = event.row?.id;
    if (!id) {
      return;
    }

    switch (event.action) {
      case 'READ':
        this.router.navigate(['/settings/generic', id, 'view']);
        break;
      case 'UPDATE':
        this.router.navigate(['/settings/generic', id, 'edit']);
        break;
    }
  }

  provisionDefaults(): void {
    this.provisioning = true;
    this.genericTypeService
      .provisionDefaults()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.provisioning = false))
      )
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.toastService.success(res.message || 'Default Tunisia base types provisioned');
            this.dashboard?.refrechData();
          } else {
            this.toastService.warning('Provisioning was not applied');
          }
        },
        error: () => this.toastService.error('Failed to provision default base types')
      });
  }

  private getActiveTypeFilter(): TypeCategory | undefined {
    const searchs = this.dashboard?._store.searchData()?.searchData?.searchs;
    const typeSearch = searchs?.[0]?.search?.['type'];
    return typeSearch?.equalValue as TypeCategory | undefined;
  }
}
