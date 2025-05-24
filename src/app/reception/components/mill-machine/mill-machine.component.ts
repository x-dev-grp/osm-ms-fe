import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { SharedModule } from '../../../demo/shared/shared.module';

import { MillMachine } from '../../../shared/models/millMachine';
import { MillMachineService } from '../../../shared/services/mill-machine.service';

@Component({
  selector: 'app-mill-machine',
  templateUrl: './mill-machine.component.html',
  styleUrls: ['./mill-machine.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatExpansionModule,
    MatSortModule,
    MatDatepickerModule,
    MatNativeDateModule,
    SharedModule
  ]
})
export class MillMachineComponent implements OnInit {
  form: FormGroup;
  machines: MillMachine[] = [];
  dataSource = new MatTableDataSource<MillMachine>([]);
  formOpen = false;
  isEditing = false;

  displayedColumns = [
    'id',
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

  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private service: MillMachineService
  ) {
    this.form = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      machineType: ['', Validators.required],
      manufacturer: [''],
      model: [''],
      serialNumber: [''],
      capacity: [0, [Validators.required, Validators.min(0.1)]],
      operatingStatus: ['', Validators.required],
      hoursOperated: [0, [Validators.required, Validators.min(0)]],
      lastMaintenanceDate: [null],
      nextMaintenanceDate: [null],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadAll();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  loadAll(): void {
    this.service.getAllMillMachines().subscribe({
      next: (data) => {
        this.machines = data;
        this.dataSource.data = data;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des machines :', err);
      }
    });
  }

  openForm(edit: boolean = false, machine?: MillMachine): void {
    this.isEditing = edit;
    this.formOpen = true;

    if (edit && machine) {
      this.form.patchValue(machine);
    } else {
      this.form.reset({
        id: null,
        name: '',
        machineType: '',
        manufacturer: '',
        model: '',
        serialNumber: '',
        capacity: 0,
        operatingStatus: '',
        hoursOperated: 0,
        lastMaintenanceDate: null,
        nextMaintenanceDate: null,
        description: ''
      });
    }
  }

  cancel(): void {
    this.formOpen = false;
    this.isEditing = false;
    this.form.reset();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: MillMachine = this.form.value;
    const request$ = this.isEditing
      ? this.service.updateMillMachine(payload)
      : this.service.addMillMachine(payload);

    request$.subscribe({
      next: () => {
        this.loadAll();
        this.cancel();
      },
      error: (err) => {
        console.error('Erreur lors de l’enregistrement de la machine :', err);
      }
    });
  }

  editMachine(machine: MillMachine): void {
    this.openForm(true, machine);
  }

  deleteMachine(machine: MillMachine): void {
    if (!machine.id) return;

    if (confirm('Voulez-vous vraiment supprimer cette machine ?')) {
      this.service.deleteMillMachine(machine.id).subscribe({
        next: () => this.loadAll(),
        error: (err) => {
          console.error('Erreur lors de la suppression de la machine :', err);
        }
      });
    }
  }
}
