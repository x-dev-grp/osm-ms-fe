import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import { SharedModule } from '../../shared/shared.module';
import { StorageUnitDto } from '../../shared/models/StorageUnitDto';
import { BaseType } from '../../shared/models/base-type';
import { StorageUnitDtoService } from '../../shared/services/storage.service';
import { GenericTypeService } from '../../shared/services/generic-type.service';
import { TypeCategory } from '../../shared/models/type-category.enum';
import { ToastService } from '../../shared/services/toast.service';
import { BaseTypeComponent } from '../../shared/modules/base-type/base-type.component';
import { QualityGrades } from '../../shared/models/quality-grades.enum';
import { TranslateModule } from '@ngx-translate/core';

function toISO(d: any) {
  return d instanceof Date ? d.toISOString() : (d ?? null);
}

/** Keep only stable keys when sending BaseType objects */
function sanitizeBaseType(obj: any | null) {
  if (!obj || typeof obj !== 'object') return null;
  const keys = ['id', 'name', 'code', 'description'];
  const out: any = {};
  keys.forEach((k) => {
    if (obj[k] !== undefined) out[k] = obj[k];
  });
  return out;
}

@Component({
  selector: 'app-storage-add',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    SharedModule,
    BaseTypeComponent,
    TranslateModule
  ],
  templateUrl: './storage-add.component.html',
  styleUrls: ['./storage-add.component.scss']
})
export class StorageAddComponent implements OnInit, OnDestroy {
  loading = false;
  isEditing = false;
  errorMessage: string | null = null;

  storageForm: FormGroup;

  oilVarietys: BaseType[] = [];
  readonly grades = Object.values(QualityGrades);
  private subscriptions = new Subscription();
  private unit: StorageUnitDto | undefined;
  private oilVarietysLoaded = false;
  private unitLoaded = false;

  constructor(
    private fb: FormBuilder,
    private storageService: StorageUnitDtoService,
    private genericTypeService: GenericTypeService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.storageForm = this.fb.group(
      {
        name: ['', Validators.required],
        lotNumber: [''],
        location: [''],
        description: [''],

        maxCapacity: [null, [Validators.required, Validators.min(1)]],
        currentVolume: [0],

        oilVariety: [null], // BaseType full object
        qualityGrade: [null],
        status: ['AVAILABLE', Validators.required],

        // Filtration field
        filteredOil: [false],

        paidStorage: [false],
        monthlyRentalPrice: [0] // OPTIONAL
      },
      { validators: this.capacityNotExceededValidator }
    );
  }

  ngOnInit(): void {
    const storageId = this.route.snapshot.paramMap.get('id');
    this.isEditing = storageId !== null && storageId !== 'new';

    // Toggle monthlyRentalPrice required based on paidStorage
    this.subscriptions.add(
      this.storageForm.get('paidStorage')!.valueChanges.subscribe((isPaid: boolean) => {
        const ctrl = this.storageForm.get('monthlyRentalPrice')!;
        if (isPaid) {
          ctrl.setValidators([Validators.required, Validators.min(0)]);
        } else {
          ctrl.clearValidators();
          ctrl.setValue(null);
        }
        ctrl.updateValueAndValidity({ emitEvent: false });
      })
    );

    // Load independently
    this.loadOilVarieties();

    if (this.isEditing && storageId) {
      this.loadUnit(storageId);
    } else {
      // create mode: loading will end when both catalogs are ready
    }
  }

  // =============== Loads (independent) ===============

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  save(): void {
    if (this.storageForm.invalid) {
      this.storageForm.markAllAsTouched();
      this.toast.warning('Please fill in all required fields.');
      return;
    }
    const v = this.storageForm.value;
    const payload: any = {
      id: this.unit?.id ?? null,
      name: v.name,
      lotNumber: v.lotNumber,
      location: v.location,
      description: v.description,
      maxCapacity: Number(v.maxCapacity),
      currentVolume: Number(v.currentVolume),
      status: v.status,
      qualityGrade: v.qualityGrade, // string
      oilVariety: sanitizeBaseType(v.oilVariety), // full object (sanitized)
      nextMaintenanceDate: toISO(v.nextMaintenanceDate),
      lastInspectionDate: toISO(v.lastInspectionDate),
      paidStorage: !!v.paidStorage,
      monthlyRentalPrice: v.monthlyRentalPrice != null && v.monthlyRentalPrice !== '' ? Number(v.monthlyRentalPrice) : 0.0,
      // Filtration field
      filteredOil: !!v.filteredOil
    };

    this.loading = true;
    const sub = (
      this.isEditing ? this.storageService.updateStorageUnit(payload) : this.storageService.createStorageUnit(payload)
    ).subscribe({
      next: (res) => {
        if (res?.success) {
          this.toast.success(this.isEditing ? 'Storage unit updated successfully' : 'Storage unit created successfully');
          this.router.navigate(['/storage']);
        } else {
          this.toast.error(res?.message || 'Operation failed');
        }
        this.loading = false;
      },
      error: () => {
        this.toast.error('Server error');
        this.loading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  onBack(): void {
    this.router.navigate(['/storage']);
  }

  private loadOilVarieties(): void {
    const sub = this.genericTypeService
      .getAllTypes(TypeCategory.OIL_VARIETY)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          this.oilVarietys = res?.success ? (res.data ?? []) : [];
          this.oilVarietysLoaded = true;
          this.tryPatchWhenReady();
          this.finishLoadingIfCreateMode();
        },
        error: () => {
          this.oilVarietys = [];
          this.oilVarietysLoaded = true;
          this.tryPatchWhenReady();
          this.finishLoadingIfCreateMode();
          this.toast.error('Failed to load oil varieties');
        }
      });
    this.subscriptions.add(sub);
  }

  // =============== Save ===============

  private loadUnit(storageId: string): void {
    const sub = this.storageService
      .getStorageUnit(storageId)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          this.unit = Array.isArray(res?.data) ? res.data[0] : res?.data;
          this.unitLoaded = true;
          this.tryPatchWhenReady();
        },
        error: () => {
          this.errorMessage = 'Error loading storage unit.';
          this.toast.error(this.errorMessage);
          this.router.navigate(['/storage']);
        },
        complete: () => {
          if (this.oilVarietysLoaded) this.loading = false;
        }
      });
    this.subscriptions.add(sub);
  }

  /** For create mode: stop spinner once catalogs are both ready */
  private finishLoadingIfCreateMode(): void {
    if (!this.isEditing && this.oilVarietysLoaded) {
      this.loading = false;
    }
  }

  // =============== Helpers ===============

  /** Patch only when we have unit + both catalogs (for edit mode) */
  private tryPatchWhenReady(): void {
    if (!this.isEditing) return;
    if (this.unitLoaded && this.unit) {
      this.patchForm(this.unit);
      this.loading = false;
    }
  }

  private patchForm(storage: StorageUnitDto): void {
    const findOilVariety =
      this.oilVarietys.find((t) => t.id === storage.oilVariety?.id) ??
      this.oilVarietys.find((t) => t.id === (storage as any).oilVarietyId) ??
      null;

    this.storageForm.patchValue({
      name: storage.name ?? '',
      location: storage.location ?? '',
      description: storage.description ?? '',
      lotNumber: storage.lotNumber ?? '',

      maxCapacity: storage.maxCapacity ?? null,
      currentVolume: storage.currentVolume ?? 0,

      status: storage.status ?? 'AVAILABLE',

      qualityGrade: storage.qualityGrade ?? null,
      oilVariety: findOilVariety,

      nextMaintenanceDate: storage.nextMaintenanceDate ? new Date(storage.nextMaintenanceDate) : null,
      lastInspectionDate: storage.lastInspectionDate ? new Date(storage.lastInspectionDate) : null,

      // Filtration field
      filteredOil: !!storage.filteredOil,

      paidStorage: !!storage.paidStorage,
      monthlyRentalPrice: storage.paidStorage ? (storage.monthlyRentalPrice ?? 0) : null
    });

    // ensure monthlyRentalPrice required when paid
    const rentCtrl = this.storageForm.get('monthlyRentalPrice')!;
    if (storage.paidStorage) {
      rentCtrl.setValidators([Validators.required, Validators.min(0)]);
      rentCtrl.updateValueAndValidity({ emitEvent: false });
    }
  }

  /** form-level validator: currentVolume ≤ maxCapacity */
  private capacityNotExceededValidator(group: AbstractControl): ValidationErrors | null {
    const max = Number(group.get('maxCapacity')?.value);
    const cur = Number(group.get('currentVolume')?.value);
    if (!isFinite(max) || !isFinite(cur)) return null;
    return cur <= max ? null : { capacityExceeded: true };
  }
}
