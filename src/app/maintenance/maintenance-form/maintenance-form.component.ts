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
import { MaintenanceWorkOrderService } from '../services/maintenance-work-order.service';
import {
  MaintenanceAssetOption,
  MaintenanceAssetType,
  MaintenanceWorkOrder
} from '../models/maintenance-work-order.model';
import { MillMachineService } from '../../shared/services/mill-machine.service';
import { StorageUnitDtoService } from '../../shared/services/storage.service';
import { LigneConditionnementService } from '../../stock/services/ligne-conditionnement.service';
import { ToastService } from '../../shared/services/toast.service';
import { PaymentMethod } from '../../finance/models/financial-transaction.model';

@Component({
  selector: 'app-maintenance-form',
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
  templateUrl: './maintenance-form.component.html',
  styleUrl: './maintenance-form.component.scss'
})
export class MaintenanceFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly maintenanceService = inject(MaintenanceWorkOrderService);
  private readonly millMachineService = inject(MillMachineService);
  private readonly storageService = inject(StorageUnitDtoService);
  private readonly ligneService = inject(LigneConditionnementService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  form!: FormGroup;
  loading = false;
  saving = false;
  editing = false;
  readOnly = false;
  workOrderId: string | null = null;
  assetOptions: MaintenanceAssetOption[] = [];
  paymentMethods = Object.values(PaymentMethod);

  assetTypes: MaintenanceAssetType[] = ['MILL_MACHINE', 'STORAGE_UNIT', 'LIGNE_CONDITIONNEMENT'];
  maintenanceTypes = ['PREVENTIVE', 'CORRECTIVE', 'PREDICTIVE'];
  statuses = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  ngOnInit(): void {
    this.initForm();
    this.readOnly = this.route.snapshot.url.some((segment) => segment.path === 'view');
    this.editing = this.route.snapshot.url.some((segment) => segment.path === 'edit');
    this.workOrderId = this.route.snapshot.paramMap.get('id');

    this.form.get('assetType')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((type) => {
      this.loadAssets(type as MaintenanceAssetType);
    });

    this.form.get('partsReplaced')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.syncPartsCostValidator();
    });

    if (this.workOrderId) {
      this.loadWorkOrder(this.workOrderId);
    } else {
      this.applyQueryParams();
      this.loadAssets(this.form.get('assetType')?.value as MaintenanceAssetType);
    }

    if (this.readOnly) {
      this.form.disable();
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      assetType: ['MILL_MACHINE', Validators.required],
      assetId: [null, Validators.required],
      maintenanceType: ['PREVENTIVE', Validators.required],
      status: ['PLANNED', Validators.required],
      scheduledStart: [null, Validators.required],
      scheduledEnd: [null],
      technician: ['', Validators.required],
      vendor: [''],
      description: ['', [Validators.required, Validators.minLength(10)]],
      partsReplaced: [''],
      partsCost: [0, [Validators.min(0)]],
      laborCost: [0, [Validators.min(0)]],
      paymentMethod: [PaymentMethod.CASH],
      notes: ['']
    });
  }

  private applyQueryParams(): void {
    const assetType = this.route.snapshot.queryParamMap.get('assetType') as MaintenanceAssetType | null;
    const assetId = this.route.snapshot.queryParamMap.get('assetId');
    if (assetType) {
      this.form.patchValue({ assetType });
    }
    if (assetId) {
      this.form.patchValue({ assetId });
    }
  }

  private loadWorkOrder(id: string): void {
    this.loading = true;
    this.maintenanceService
      .getById(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.toast.error('MAINTENANCE.LOAD_ERROR');
          return of(null);
        })
      )
      .subscribe((response) => {
        this.loading = false;
        if (!response?.success || !response.data) {
          return;
        }
        const data = response.data;
        this.form.patchValue({
          assetType: data.assetType,
          assetId: data.assetId,
          maintenanceType: data.maintenanceType,
          status: data.status,
          scheduledStart: data.scheduledStart ? new Date(data.scheduledStart as string) : null,
          scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd as string) : null,
          technician: data.technician,
          vendor: data.vendor,
          description: data.description,
          partsReplaced: data.partsReplaced,
          partsCost: data.partsCost ?? 0,
          laborCost: data.laborCost ?? 0,
          paymentMethod: data.paymentMethod ?? PaymentMethod.CASH,
          notes: data.notes
        });
        this.loadAssets(data.assetType);
      });
  }

  private loadAssets(assetType: MaintenanceAssetType): void {
    if (!assetType) {
      this.assetOptions = [];
      return;
    }

    if (assetType === 'MILL_MACHINE') {
      this.millMachineService.getAllMillMachines().subscribe({
        next: (machines) => {
          this.assetOptions = machines
            .filter((m) => !!m.id)
            .map((m) => ({ id: m.id!, label: m.name || m.id! }));
        },
        error: () => (this.assetOptions = [])
      });
      return;
    }

    if (assetType === 'STORAGE_UNIT') {
      this.storageService.getAllStorageUnit().subscribe({
        next: (response) => {
          this.assetOptions = (response.data ?? [])
            .filter((unit) => !!unit.id)
            .map((unit) => ({ id: unit.id!, label: unit.name || unit.id! }));
        },
        error: () => (this.assetOptions = [])
      });
      return;
    }

    this.ligneService.getAllLignes().subscribe({
      next: (lignes) => {
        this.assetOptions = lignes
          .filter((ligne) => !!ligne.id)
          .map((ligne) => ({ id: ligne.id!, label: ligne.nom || ligne.code || ligne.id! }));
      },
      error: () => (this.assetOptions = [])
    });
  }

  private syncPartsCostValidator(): void {
    const partsReplaced = this.form.get('partsReplaced')?.value;
    const partsCostControl = this.form.get('partsCost');
    if (!partsCostControl) {
      return;
    }
    if (partsReplaced && String(partsReplaced).trim()) {
      partsCostControl.setValidators([Validators.required, Validators.min(0.01)]);
    } else {
      partsCostControl.setValidators([Validators.min(0)]);
    }
    partsCostControl.updateValueAndValidity({ emitEvent: false });
  }

  get totalCost(): number {
    const parts = Number(this.form.get('partsCost')?.value ?? 0);
    const labor = Number(this.form.get('laborCost')?.value ?? 0);
    return parts + labor;
  }

  get showExpenseSection(): boolean {
    return this.totalCost > 0;
  }

  save(): void {
    if (this.readOnly || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    if (this.totalCost > 0 && raw.status === 'CANCELLED') {
      this.toast.error('MAINTENANCE.EXPENSE_CANCELLED_ERROR');
      return;
    }

    this.saving = true;
    const payload: MaintenanceWorkOrder = {
      id: this.workOrderId ?? undefined,
      assetType: raw.assetType,
      assetId: raw.assetId,
      maintenanceType: raw.maintenanceType,
      status: raw.status,
      scheduledStart: raw.scheduledStart ? new Date(raw.scheduledStart).toISOString() : undefined,
      scheduledEnd: raw.scheduledEnd ? new Date(raw.scheduledEnd).toISOString() : undefined,
      technician: raw.technician,
      vendor: raw.vendor,
      description: raw.description,
      partsReplaced: raw.partsReplaced,
      partsCost: Number(raw.partsCost ?? 0),
      laborCost: Number(raw.laborCost ?? 0),
      paymentMethod: raw.paymentMethod ?? PaymentMethod.CASH,
      notes: raw.notes
    };

    const request$ = this.editing
      ? this.maintenanceService.update(payload)
      : this.maintenanceService.create(payload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.saving = false;
        if (response?.success) {
          this.toast.success(response.message);
          this.router.navigate(['/maintenance']);
          return;
        }
        this.toast.error(response?.message || 'MAINTENANCE.SAVE_ERROR');
      },
      error: () => {
        this.saving = false;
        this.toast.error('MAINTENANCE.SAVE_ERROR');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/maintenance']);
  }
}
