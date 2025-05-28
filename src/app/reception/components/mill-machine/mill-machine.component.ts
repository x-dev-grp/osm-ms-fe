import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatSortModule } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { SharedModule } from '../../../demo/shared/shared.module';
import { OsmDashboard } from '../../../shared/modules/osm-dashboard/osm-dashboard';
import { Action, DashboardConfig } from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import { MillMachine } from '../../../shared/models/millMachine';
import { MillMachineService } from '../../../shared/services/mill-machine.service';
import { MILL_MACHINE_DASHBOARD } from './MILL_MACHINE_DASHBOARD';

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
    OsmDashboard
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
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMachines();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadMachines(): void {
    this.loading = true;
    this.error = null;

    this.millMachineService.getAllMillMachines().subscribe({
      next: (response: any) => {
        if (response && response.success) {
          this.machines = response.data;
        } else {
          this.error = response.message || 'Failed to load machines';
          this.showToast(this.error || 'Failed to load machines');
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'An error occurred while loading machines';
        this.showToast(this.error);
        this.loading = false;
      }
    });
  }

  showToast(message: string, duration: number = 3000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['custom-snackbar']
    });
  }

  onRowAction(event: { row: MillMachine; action: Action }): void {
    switch (event.action.value) {
      case 'CONSULTER':
        this.viewMachine(event.row);
        break;
      case 'MODIFIER':
        this.editMachine(event.row);
        break;
      case 'SUPPRIMER':
        this.deleteMachine(event.row);
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

  deleteMachine(machine: MillMachine): void {
    if (!machine.id) return;

    this.millMachineService.deleteMillMachine(machine.id).subscribe({
      next: (response: any) => {
        if (response && response.success) {
          this.showToast('Machine deleted successfully');
          this.loadMachines();
        } else {
          this.showToast(response.message || 'Failed to delete machine');
        }
      },
      error: (err: any) => {
        this.showToast('An error occurred while deleting the machine');
      }
    });
  }
}
