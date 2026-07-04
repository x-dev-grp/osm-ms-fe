import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OosmDashboard } from '../../shared/modules/oosm-dashboard/oosm-dashboard';
import { EQUIPMENT_DASHBOARD_CONFIG } from './EQUIPMENT_DASHBOARD';
import { MillEquipment } from '../models/mill-equipment.model';

@Component({
  selector: 'app-equipment-list',
  standalone: true,
  imports: [CommonModule, OosmDashboard],
  templateUrl: './equipment-list.component.html'
})
export class EquipmentListComponent {
  readonly dashboardConfig = EQUIPMENT_DASHBOARD_CONFIG;

  @ViewChild('dashboard') dashboard!: OosmDashboard;

  constructor(private router: Router) {}

  applyAction(event: { row: MillEquipment; action: string }): void {
    const id = event.row?.id;
    if (!id) {
      return;
    }
    switch (event.action) {
      case 'READ':
        this.router.navigate(['/mill-equipment', id, 'view']);
        break;
      case 'UPDATE':
        this.router.navigate(['/mill-equipment', id, 'edit']);
        break;
    }
  }
}
