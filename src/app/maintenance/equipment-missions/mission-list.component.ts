import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OosmDashboard } from '../../shared/modules/oosm-dashboard/oosm-dashboard';
import { MISSION_DASHBOARD_CONFIG } from './MISSION_DASHBOARD';
import { EquipmentServiceMission } from '../models/equipment-service-mission.model';

@Component({
  selector: 'app-mission-list',
  standalone: true,
  imports: [CommonModule, OosmDashboard],
  templateUrl: './mission-list.component.html'
})
export class MissionListComponent {
  readonly dashboardConfig = MISSION_DASHBOARD_CONFIG;

  @ViewChild('dashboard') dashboard!: OosmDashboard;

  constructor(private router: Router) {}

  applyAction(event: { row: EquipmentServiceMission; action: string }): void {
    const id = event.row?.id;
    if (!id) {
      return;
    }
    switch (event.action) {
      case 'READ':
        this.router.navigate(['/equipment-missions', id, 'view']);
        break;
      case 'UPDATE':
        this.router.navigate(['/equipment-missions', id, 'edit']);
        break;
    }
  }
}
