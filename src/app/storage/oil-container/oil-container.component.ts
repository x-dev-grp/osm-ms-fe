import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { SharedModule } from '../../demo/shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';
import { StorageUnitDto } from '../../shared/models/StorageUnitDto';
import { BaseType } from '../../shared/models/base-type';
import { DashboardConfig } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { dashboardConfig } from './Oil-container-dashboard.config';
import { Router } from '@angular/router';

@Component({
  selector: 'app-oil-container',
  imports: [CommonModule, MatTableModule, MatIconModule, SharedModule, TranslateModule, OsmDashboard],
  templateUrl: './oil-container.component.html',
  standalone: true,
  styleUrl: './oil-container.component.scss'
})
export class OilContainerComponent {
  @ViewChild('dashboard') dashboard!: OsmDashboard;
  storageUnits: StorageUnitDto[] = [];
  oilTypes: BaseType[] = [];
  loading = false;
  dashboardConfig: DashboardConfig = dashboardConfig;

  constructor(private router: Router) {}

  ngOnInit(): void {}

  handleAction(event: { row: StorageUnitDto; action: string }): void {
    switch (event.action) {
      case 'READ':
        this.router.navigate(['/storage/oil-container', event.row.id, 'view']);
        break;

      case 'UPDATE':
        this.router.navigate(['/storage/oil-container', event.row.id, 'edit']);
        break;
    }
  }
}
