import { Component, DestroyRef, inject, OnInit } from '@angular/core';
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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { SharedModule } from '../../shared/shared.module';
import { EquipmentServiceMissionService } from '../services/equipment-service-mission.service';
import { MillEquipmentService } from '../services/mill-equipment.service';
import {
  EquipmentServiceMission,
  EquipmentServiceMissionStatus
} from '../models/equipment-service-mission.model';
import { MillEquipment } from '../models/mill-equipment.model';
import { ToastService } from '../../shared/services/toast.service';
import { PaymentMethod } from '../../finance/models/financial-transaction.model';
import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';

@Component({
  selector: 'app-mission-form',
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
    MatProgressSpinnerModule
  ],
  templateUrl: './mission-form.component.html',
  styleUrl: './mission-form.component.scss'
})
export class MissionFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly missionService = inject(EquipmentServiceMissionService);
  private readonly equipmentService = inject(MillEquipmentService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  form!: FormGroup;
  loading = false;
  saving = false;
  editing = false;
  readOnly = false;
  missionId: string | null = null;
  equipmentOptions: MillEquipment[] = [];
  paymentMethods = Object.values(PaymentMethod);
  statuses: EquipmentServiceMissionStatus[] = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  computedTotal = 0;
  invoiceReference: string | null = null;

  ngOnInit(): void {
    this.initForm();
    this.readOnly = this.route.snapshot.url.some((s) => s.path === 'view');
    this.editing = this.route.snapshot.url.some((s) => s.path === 'edit');
    this.missionId = this.route.snapshot.paramMap.get('id');

    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.updateTotal());

    this.form
      .get('equipmentId')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((equipmentId) => {
        if (equipmentId) {
          this.onEquipmentChange(equipmentId);
        }
      });

    this.loadEquipmentOptions();

    if (this.missionId) {
      this.loadMission(this.missionId);
    } else {
      this.applyQueryParams();
    }

    if (this.readOnly) {
      this.form.disable();
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      equipmentId: ['', Validators.required],
      clientName: ['', Validators.required],
      clientPhone: [''],
      workLocation: [''],
      description: [''],
      operatorName: [''],
      status: ['PLANNED', Validators.required],
      scheduledStart: [null],
      scheduledEnd: [null],
      billableHours: [0, [Validators.min(0)]],
      hourlyRate: [0, [Validators.min(0)]],
      paymentMethod: [PaymentMethod.CASH],
      paidAmount: [0, [Validators.min(0)]],
      notes: ['']
    });
  }

  private loadEquipmentOptions(): void {
    this.equipmentService
      .searchAll()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of([]))
      )
      .subscribe((items) => {
        this.equipmentOptions = items;
        this.applyQueryParams();
      });
  }

  private applyQueryParams(): void {
    const equipmentId = this.route.snapshot.queryParamMap.get('equipmentId');
    if (!equipmentId || this.form.get('equipmentId')?.value) {
      return;
    }
    const existing = this.equipmentOptions.find((e) => e.id === equipmentId);
    if (existing) {
      this.form.patchValue({
        equipmentId: existing.id,
        hourlyRate: existing.defaultHourlyRate ?? 0
      });
      this.updateTotal();
      return;
    }
    this.equipmentService.getById(equipmentId).subscribe({
      next: (res) => {
        if (res.data) {
          this.equipmentOptions = [...this.equipmentOptions, res.data];
          this.form.patchValue({
            equipmentId: res.data.id,
            hourlyRate: res.data.defaultHourlyRate ?? 0
          });
          this.updateTotal();
        }
      }
    });
  }

  onEquipmentChange(equipmentId: string): void {
    const equipment = this.equipmentOptions.find((e) => e.id === equipmentId);
    if (equipment?.defaultHourlyRate != null && !this.missionId) {
      this.form.patchValue({ hourlyRate: equipment.defaultHourlyRate }, { emitEvent: false });
      this.updateTotal();
    }
  }

  loadMission(id: string): void {
    this.loading = true;
    this.missionService.getById(id).subscribe({
      next: (res) => {
        const data = res.data;
        this.invoiceReference = data.invoiceReference ?? null;
        if (data.equipment?.id) {
          const eq = data.equipment as MillEquipment;
          if (!this.equipmentOptions.some((e) => e.id === eq.id)) {
            this.equipmentOptions = [...this.equipmentOptions, eq];
          }
        }
        this.form.patchValue({
          equipmentId: data.equipment?.id,
          clientName: data.clientName,
          clientPhone: data.clientPhone,
          workLocation: data.workLocation,
          description: data.description,
          operatorName: data.operatorName,
          status: data.status,
          scheduledStart: data.scheduledStart ? new Date(data.scheduledStart) : null,
          scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd) : null,
          billableHours: data.billableHours ?? 0,
          hourlyRate: data.hourlyRate ?? 0,
          paymentMethod: data.paymentMethod ?? PaymentMethod.CASH,
          paidAmount: data.paidAmount ?? 0,
          notes: data.notes
        });
        this.updateTotal();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('MAINTENANCE.MISSIONS.LOAD_ERROR');
      }
    });
  }

  updateTotal(): void {
    const hours = Number(this.form.get('billableHours')?.value) || 0;
    const rate = Number(this.form.get('hourlyRate')?.value) || 0;
    this.computedTotal = Math.round(hours * rate * 100) / 100;
  }

  get showPaymentSection(): boolean {
    const status = this.form.get('status')?.value;
    return status === 'COMPLETED' || this.computedTotal > 0;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: EquipmentServiceMission = {
      ...(this.missionId ? { id: this.missionId } : {}),
      equipment: { id: raw.equipmentId },
      clientName: raw.clientName,
      clientPhone: raw.clientPhone,
      workLocation: raw.workLocation,
      description: raw.description,
      operatorName: raw.operatorName,
      status: raw.status,
      scheduledStart: raw.scheduledStart ? new Date(raw.scheduledStart).toISOString() : undefined,
      scheduledEnd: raw.scheduledEnd ? new Date(raw.scheduledEnd).toISOString() : undefined,
      billableHours: Number(raw.billableHours) || 0,
      hourlyRate: Number(raw.hourlyRate) || 0,
      paymentMethod: raw.paymentMethod,
      paidAmount: Number(raw.paidAmount) || 0,
      notes: raw.notes
    };

    this.saving = true;
    const req$ = this.missionId ? this.missionService.update(payload) : this.missionService.create(payload);
    req$.subscribe({
      next: (res) => {
        this.saving = false;
        this.toast.success(res.message || 'MAINTENANCE.MISSIONS.SAVE_SUCCESS');
        this.router.navigate(['/equipment-missions']);
      },
      error: () => {
        this.saving = false;
        this.toast.error('MAINTENANCE.MISSIONS.SAVE_ERROR');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/equipment-missions']);
  }
}
