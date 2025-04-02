// mill-machine.component.ts

import { Component, OnInit } from '@angular/core';
import { MillMachine } from '../models/millMachine';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAccordion, MatExpansionModule, MatExpansionPanel, MatExpansionPanelTitle } from '@angular/material/expansion';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSortModule } from '@angular/material/sort';
import { SharedModule } from '../../demo/shared/shared.module';
import { MillMachineService } from '../services/mill-machine.service';
import { LocalDateTimePipe } from '../pipes/local-date-time.pipe';

@Component({
  selector: 'app-mill-machine',
  templateUrl: './millmachin.component.html',
  imports: [
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatExpansionModule, // Import the expansion module
    MatAccordion,
    ReactiveFormsModule,
    MatSortModule,
    SharedModule,
    ],
  standalone: true,
  styleUrls: ['./millmachin.component.scss']
})
export class MillMachineComponent implements OnInit {
  machines: MillMachine[] = [];
  selectedMachine: MillMachine = {} as MillMachine;
  formOpen = false;
  isEditing = false;
  message = '';

  displayedColumns: string[] = [
    'name',
    'machineType',
    'manufacturer',
    'model',
    'capacity',
    'operatingStatus',
    'hoursOperated',
    'lastMaintenanceDate',
    'nextMaintenanceDate',
    'actions'
  ];

  constructor(private machineService: MillMachineService) {}

  ngOnInit(): void {
    this.loadMachines();
  }

  // In your component (for example: mill-machine.component.ts)
  loadMachines(): void {
    this.machineService.getAllMillMachines().subscribe({
      next: (data) => {
        // `data.data` is presumably an array of machines
        this.machines = data;
      },
      error: (err) => {
        console.error('Error loading machines', err);
      }
    });
  }

  openForm(): void {
    this.selectedMachine = {} as MillMachine;
    this.isEditing = false;
    this.formOpen = true;
  }

  editMachine(mm: MillMachine): void {
    // Make a copy to avoid mutating the table data directly
    this.selectedMachine = { ...mm };
    this.isEditing = true;
    this.formOpen = true;
  }

  deleteMachine(mm: MillMachine): void {
    if (!mm.id) {
      return;
    }
    this.machineService.deleteMillMachine(mm.id.toString()).subscribe({
      next: () => {
        this.message = `Mill Machine [${mm.name}] deleted successfully!`;
        this.loadMachines();
      },
      error: (err) => {
        console.error('Delete error', err);
        this.message = `Failed to delete machine [${mm.name}].`;
      }
    });
  }

  onSubmit(): void {
    if (this.isEditing) {
      this.updateMachine();
    } else {
      this.addMachine();
    }
  }

  addMachine(): void {
    this.machineService.addMillMachine(this.selectedMachine).subscribe({
      next: (newMachine) => {
        this.message = `Mill Machine [${newMachine.data}] added successfully!`;
        this.loadMachines();
        this.formOpen = false;
      },
      error: (err) => {
        console.error('Create error', err);
        this.message = 'Failed to add machine.';
      }
    });
  }

  updateMachine(): void {
    if (!this.selectedMachine.id) {
      this.message = 'Missing machine ID; cannot update.';
      return;
    }
    this.machineService.updateMillMachine(this.selectedMachine).subscribe({
      next: (updated) => {
        this.message = `Mill Machine [${updated.message}] updated successfully!`;
        this.loadMachines();
        this.formOpen = false;
      },
      error: (err) => {
        console.error('Update error', err);
        this.message = `Failed to update machine [${this.selectedMachine.name}].`;
      }
    });
  }

  cancelEdit(): void {
    this.formOpen = false;
  }
}
