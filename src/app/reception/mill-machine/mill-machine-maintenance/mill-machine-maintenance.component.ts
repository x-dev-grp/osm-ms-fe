import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
 import { ActivatedRoute, Router } from '@angular/router';

import { SharedModule } from '../../../shared/shared.module';
import { MillMachine } from '../../../shared/models/millMachine';
import { MillMachineService } from '../../../shared/services/mill-machine.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ApiResponse } from '../../../shared/models/api-response';
import { Mill } from '../../../shared/models/planningDTOS';
import { TranslateModule } from '@ngx-translate/core';

interface MaintenanceData {
  maintenanceType: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  status: string;
  technician: string;
  cost: number;
  partsReplaced?: string;
  notes?: string;
  machineId?: string;
}

@Component({
  selector: 'app-mill-machine-maintenance',
  templateUrl: './mill-machine-maintenance.component.html',
  styleUrls: ['./mill-machine-maintenance.component.scss'],
  standalone: true,
  imports: [TranslateModule,
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
export class MillMachineMaintenanceComponent implements OnInit {
  private readonly i18n = inject(TranslateService);
  form: FormGroup;
  machine: MillMachine | null = null;
  loading = false;
  error: string | null = null;

  maintenanceTypes = [
    { value: 'PREVENTIVE', label: 'Maintenance Préventive' },
    { value: 'CORRECTIVE', label: 'Maintenance Corrective' },
    { value: 'PREDICTIVE', label: 'Maintenance Prédictive' }
  ];

  maintenanceStatuses = [
    { value: 'PLANNED', label: 'Planifiée' },
    { value: 'IN_PROGRESS', label: 'En cours' },
    { value: 'COMPLETED', label: 'Terminée' },
    { value: 'CANCELLED', label: 'Annulée' }
  ];

  constructor(
    private fb: FormBuilder,
    private service: MillMachineService,
    private toast: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadMachine(id);
    }
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      maintenanceType: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
      startDate: [null, Validators.required],
      endDate: [null],
      status: ['PLANNED', Validators.required],
      technician: ['', Validators.required],
      cost: [0, [Validators.required, Validators.min(0)]],
      partsReplaced: [''],
      notes: ['']
    });
  }

  private loadMachine(id: string): void {
    this.loading = true;
    this.error = null;

    this.service.getMillMachine(id).subscribe({
      next: (response: any) => {
        if (response && response.success) {
          this.machine = response.data;
          // Pre-fill form with machine's maintenance schedule if available
          if (this.machine?.nextMaintenanceDate) {
            this.form.patchValue({
              startDate: this.machine.nextMaintenanceDate
            });
          }
          this.toast.success(response.message);

        } else {
          this.toast.error(response.message || 'AUTO.FAILED_TO_LOAD_MACHINE');
        }
        this.loading = false;
      },
      error: (err: any) => {
        const errorMessage = this.i18n.instant('AUTO.AN_ERROR_OCCURRED_WHILE_LOADING_THE_MACHINE');
        this.error = errorMessage;
        this.toast.error(errorMessage!);
        this.loading = false;
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

    const maintenanceData: MaintenanceData = {
      ...this.form.value,
      machineId: this.machine?.id,
      externalId: this.machine?.externalId
    };

    // Use the existing updateMillMachine method with the maintenance data
    const updatedMachine: MillMachine = {
      ...this.machine!,
      lastMaintenanceDate: maintenanceData.startDate,
      nextMaintenanceDate: maintenanceData.endDate || new Date(maintenanceData.startDate.getTime() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days from start
      operatingStatus: maintenanceData.status === 'COMPLETED' ? 'OPERATIONAL' : 'MAINTENANCE'
    };

    this.service.updateMillMachine(updatedMachine).subscribe({
      next: (response: any) => {
        if (response && response.success) {
          this.toast.success();
          this.router.navigate(['/reception/mill-machines']);
        } else {
          const errorMessage = response.message || this.i18n.instant('AUTO.FAILED_TO_SCHEDULE_MAINTENANCE');
          this.error = errorMessage;
          this.toast.error(errorMessage!);
        }
        this.loading = false;
      },
      error: (err: any) => {
        const errorMessage = this.i18n.instant('AUTO.AN_ERROR_OCCURRED_WHILE_SCHEDULING_MAINTENANCE');
        this.error = errorMessage;
        this.toast.error(errorMessage!);
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/reception/mill-machines']);
  }


}
