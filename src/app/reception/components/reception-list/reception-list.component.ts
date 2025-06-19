import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OsmDashboard } from '../../../shared/modules/osm-dashboard/osm-dashboard';
import { Action } from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import { LIST_RECEPTION_DASHBOARD } from './LIST_RECEPTION_DASHBOARD';

@Component({
  selector: 'app-reception-list',
  standalone: true,
  imports: [CommonModule, OsmDashboard],
  templateUrl: './reception-list.component.html',
  styleUrls: ['./reception-list.component.scss']
})
export class ReceptionListComponent {
  dashboardConfig = LIST_RECEPTION_DASHBOARD;

  constructor() {}

  handleDashboardAction(event: Action): void {
    // Handle dashboard actions (view, edit, etc.)
    console.log('Dashboard action:', event);
  }
}
