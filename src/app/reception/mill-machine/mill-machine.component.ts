import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatSortModule } from '@angular/material/sort';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { SharedModule } from '../../shared/shared.module';
import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';
import { Action, DashboardConfig } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { MillMachine } from '../../shared/models/millMachine';
import { MillMachineService } from '../../shared/services/mill-machine.service';
import { ToastService } from '../../shared/services/toast.service';
import { MILL_MACHINE_DASHBOARD } from './MILL_MACHINE_DASHBOARD';
import { TranslateModule } from '@ngx-translate/core';
import { event } from '@ngrx/signals/events';

@Component({
  selector: 'app-mill-machine',
  templateUrl: './mill-machine.component.html',
  styleUrls: ['./mill-machine.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatCardModule,
    MatSortModule,
    SharedModule,
    OsmDashboard,
    TranslateModule
  ]
})
export class MillMachineComponent implements OnInit, OnDestroy {
  machines: MillMachine[] = [];
  loading = false;
  error: string | null = null;
  dashboardConfig: DashboardConfig = MILL_MACHINE_DASHBOARD;
  private subs = new Subscription();

  constructor(
    private millMachineService: MillMachineService,
    private toastService: ToastService,
    private router: Router
  ) {}


  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  onRowAction(event: { row: MillMachine; action: string }): void {
    switch (event.action) {
      case 'READ':
        this.viewMachine(event.row);
        break;
      case 'UPDATE':
        this.editMachine(event.row);
        break;
      case 'MAINTENANCE':
        this.maintenanceMachine(event.row);
        break;
    }
  }

  viewMachine(machine: MillMachine): void {
    if (machine.id) {
      this.router.navigate(['/reception/mill-machines/view', machine.id]);
    }
  }

  editMachine(machine: MillMachine): void {
    if (machine.id) {
      this.router.navigate(['/reception/mill-machines', machine.id]);
    }
  }

  maintenanceMachine(machine: MillMachine): void {
    if (machine.id) {
      this.router.navigate(['/reception/mill-machines/maintenance', machine.id]);
    }
  }

  ngOnInit(): void {
  }
}
