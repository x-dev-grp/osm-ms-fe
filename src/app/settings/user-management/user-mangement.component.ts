import { Component, inject, OnInit, ViewChild } from '@angular/core';

import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';

import { OsmDashboard } from 'src/app/shared/modules/osm-dashboard/osm-dashboard';
import { DashboardConfig } from 'src/app/shared/modules/osm-dashboard/models/dashboard-config';
import { Router } from '@angular/router';
import { userDashboardConfig } from './userDashboardConfig';

@Component({
  selector: 'app-application-config',
  standalone: true,
  imports: [CommonModule, SharedModule, OsmDashboard],
  templateUrl: './user-mangement.component.html',
  styleUrls: ['./user-mangement.component.scss']
})
export class UserManagementComponent implements OnInit {
  @ViewChild('dashboard') dashboard!: OsmDashboard;
  _router = inject(Router);
  dashboardConfig: DashboardConfig = userDashboardConfig;
  ngOnInit(): void {}

  applyAction(event: { row: any; action: string }) {
    switch (event?.action?.toUpperCase()) {
      case 'READ':
        this._router.navigate(['/settings/users/view', event.row?.id]);
        break;
      case 'UPDATE':
        this._router.navigate(['/settings/users/update', event.row?.id]);

        break;
      default:
        break;
    }
  }
}
