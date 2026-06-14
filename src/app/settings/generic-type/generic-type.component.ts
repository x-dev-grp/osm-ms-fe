import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TypeCategory } from '../../shared/models/type-category.enum';
import { BaseType } from '../../shared/models/base-type';
import { DashboardConfig } from 'src/app/shared/modules/osm-dashboard/models/dashboard-config';
import { BASE_TYPE } from './BASE_TYPE_DASHBOARD';
import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';
import { GenericTypeDialogComponent } from './generic-type-dialog/generic-type-dialog.component';

@Component({
  selector: 'app-generic-type',
  standalone: true,
  imports: [CommonModule, OsmDashboard],
  templateUrl: './generic-type.component.html',
  styleUrls: ['./generic-type.component.scss']
})
export class GenericTypeComponent {
  readonly dashboardConfig: DashboardConfig = BASE_TYPE;

  @ViewChild('dashboard') dashboard!: OsmDashboard;

  constructor(
    private router: Router,
    private dialog: MatDialog
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

  private getActiveTypeFilter(): TypeCategory | undefined {
    const searchs = this.dashboard?._store.searchData()?.searchData?.searchs;
    const typeSearch = searchs?.[0]?.search?.['type'];
    return typeSearch?.equalValue as TypeCategory | undefined;
  }
}
