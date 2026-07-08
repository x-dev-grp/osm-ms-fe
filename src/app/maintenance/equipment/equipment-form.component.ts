import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../../shared/shared.module';
import { MillEquipmentService } from '../services/mill-equipment.service';
import { MillEquipment, MillEquipmentStatus, MillEquipmentType } from '../models/mill-equipment.model';
import { ToastService } from '../../shared/services/toast.service';
import { TunisianPlateMaskDirective } from '../../shared/directives/tunisian-plate-mask.directive';
import { tunisianPlateOptionalValidators } from '../../shared/validators/tunisian-plate.validator';
import { normalizeTunisianPlate, TUNISIAN_VEHICLE_PLATE_EXAMPLE } from '../../shared/utils/tunisian-plate.util';

@Component({
  selector: 'app-equipment-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    TranslateModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TunisianPlateMaskDirective
  ],
  templateUrl: './equipment-form.component.html',
  styleUrl: './equipment-form.component.scss'
})
export class EquipmentFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly equipmentService = inject(MillEquipmentService);
  private readonly toast = inject(ToastService);

  form!: FormGroup;
  loading = false;
  saving = false;
  editing = false;
  readOnly = false;
  equipmentId: string | null = null;

  equipmentTypes: MillEquipmentType[] = ['TRACTOR', 'TRAILER', 'PUMP', 'HARVESTER', 'OTHER'];
  statuses: MillEquipmentStatus[] = ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE'];
  protected readonly platePlaceholder = TUNISIAN_VEHICLE_PLATE_EXAMPLE;

  ngOnInit(): void {
    this.form = this.fb.group({
      code: [''],
      name: ['', Validators.required],
      equipmentType: ['TRACTOR', Validators.required],
      registrationNumber: ['', tunisianPlateOptionalValidators],
      defaultHourlyRate: [0, [Validators.required, Validators.min(0)]],
      status: ['AVAILABLE', Validators.required],
      hoursOperated: [{ value: 0, disabled: true }],
      lastMaintenanceDate: [null],
      nextMaintenanceDate: [null],
      notes: ['']
    });

    this.readOnly = this.route.snapshot.url.some((s) => s.path === 'view');
    this.editing = this.route.snapshot.url.some((s) => s.path === 'edit');
    this.equipmentId = this.route.snapshot.paramMap.get('id');

    if (this.equipmentId) {
      this.loadEquipment(this.equipmentId);
    }

    if (this.readOnly) {
      this.form.disable();
    }
  }

  loadEquipment(id: string): void {
    this.loading = true;
    this.equipmentService.getById(id).subscribe({
      next: (res) => {
        const data = res.data;
        this.form.patchValue({
          code: data.code,
          name: data.name,
          equipmentType: data.equipmentType,
          registrationNumber: data.registrationNumber,
          defaultHourlyRate: data.defaultHourlyRate ?? 0,
          status: data.status ?? 'AVAILABLE',
          hoursOperated: data.hoursOperated ?? 0,
          lastMaintenanceDate: data.lastMaintenanceDate ? new Date(data.lastMaintenanceDate) : null,
          nextMaintenanceDate: data.nextMaintenanceDate ? new Date(data.nextMaintenanceDate) : null,
          notes: data.notes
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('MAINTENANCE.EQUIPMENT.LOAD_ERROR');
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: MillEquipment = {
      ...(this.equipmentId ? { id: this.equipmentId } : {}),
      code: raw.code,
      name: raw.name,
      equipmentType: raw.equipmentType,
      registrationNumber: normalizeTunisianPlate(raw.registrationNumber) || undefined,
      defaultHourlyRate: Number(raw.defaultHourlyRate),
      status: raw.status,
      notes: raw.notes,
      lastMaintenanceDate: raw.lastMaintenanceDate,
      nextMaintenanceDate: raw.nextMaintenanceDate
    };

    this.saving = true;
    const req$ = this.equipmentId ? this.equipmentService.update(payload) : this.equipmentService.create(payload);
    req$.subscribe({
      next: () => {
        this.saving = false;
        this.toast.success('MAINTENANCE.EQUIPMENT.SAVE_SUCCESS');
        this.router.navigate(['/mill-equipment']);
      },
      error: () => {
        this.saving = false;
        this.toast.error('MAINTENANCE.EQUIPMENT.SAVE_ERROR');
      }
    });
  }

  createMission(): void {
    if (!this.equipmentId) {
      return;
    }
    this.router.navigate(['/equipment-missions/new'], { queryParams: { equipmentId: this.equipmentId } });
  }

  cancel(): void {
    this.router.navigate(['/mill-equipment']);
  }
}
