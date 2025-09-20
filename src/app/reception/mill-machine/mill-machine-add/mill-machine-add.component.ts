import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatNativeDateModule} from '@angular/material/core';
import {ActivatedRoute, Router} from '@angular/router';

import {SharedModule} from '../../../shared/shared.module';
import {MillMachine} from '../../../shared/models/millMachine';
import {MillMachineService} from '../../../shared/services/mill-machine.service';
import {ToastService} from '../../../shared/services/toast.service';

@Component({
  selector: 'app-mill-machine-add',
  templateUrl: './mill-machine-add.component.html',
  styleUrls: ['./mill-machine-add.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    SharedModule
  ]
})
export class MillMachineAddComponent implements OnInit {
  form: FormGroup;
  isEditing = false;
  loading = false;
  error: string | null = null;
  protected machine: MillMachine;

  constructor(
    private fb: FormBuilder,
    private service: MillMachineService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing = true;
      this.loadMachine(id);
    }
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      machineType: ['', [Validators.required, Validators.minLength(2)]],
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

  private loadMachine(id: string): void {
    this.loading = true;
    this.error = null;

    this.service.getMillMachine(id).subscribe({
      next: (response: any) => {
        if (response && response.success) {
          this.machine = response.data;
          this.form.patchValue({
            id: this.machine.id,
            name: this.machine.name,
            machineType: this.machine.machineType,
            manufacturer: this.machine.manufacturer,
            model: this.machine.model,
            serialNumber: this.machine.serialNumber,
            capacity: this.machine.capacity,
            operatingStatus: this.machine.operatingStatus,
            hoursOperated: this.machine.hoursOperated,
            lastMaintenanceDate: this.machine.lastMaintenanceDate ? new Date(this.machine.lastMaintenanceDate) : null,
            nextMaintenanceDate: this.machine.nextMaintenanceDate ? new Date(this.machine.nextMaintenanceDate) : null,
            description: this.machine.description
          });
        } else {
          const errorMessage = response.message || 'Failed to load machine';
          this.error = errorMessage;
          this.toastService.error(errorMessage);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement de la machine :', err);
        this.error = 'Erreur lors du chargement de la machine';
        this.loading = false;
        this.toastService.error('Erreur lors du chargement de la machine');
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    const payload: MillMachine = {
      ...this.form.value,
      id: this.isEditing ? this.machine?.id : undefined,
    };    const request$ = this.isEditing ? this.service.updateMillMachine(payload) : this.service.addMillMachine(payload);

    request$.subscribe({
      next: () => {
        this.loading = false;
        this.toastService.success(this.isEditing ? 'Machine mise à jour avec succès' : 'Machine ajoutée avec succès');
        this.router.navigate(['/reception/mill-machines']);
      },
      error: (err) => {
        console.error("Erreur lors de l'enregistrement de la machine :", err);
        this.error = "Erreur lors de l'enregistrement de la machine";
        this.loading = false;
        this.toastService.error("Erreur lors de l'enregistrement de la machine");
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/reception/mill-machines']);
  }

  private toast(message: string): void {
    this.toastService.info(message);
  }
}
