import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, Input, OnDestroy, OnInit, Optional } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom, Observable, of, Subscription } from 'rxjs';

import { UnifiedDeliveryService } from '../../shared/services/delivery.service';
import { UnifiedDelivery } from '../../shared/models/UnifiedDelivery';
import { StorageUnitDtoService } from '../../shared/services/storage.service';
import { StorageUnitDto } from '../../shared/models/StorageUnitDto';
import { ToastService } from '../../shared/services/toast.service';
import { BaseTypeComponent } from '../../shared/modules/base-type/base-type.component';
import { QcEntryStudioComponent } from '../../shared/qc/components/qc-entry-studio/qc-entry-studio.component';
import { QcEntryContext } from '../../shared/qc/models/qc-context.model';
import { OperationType } from '../../shared/models/operation-type.enum';

function requiredEntitySelectionValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value && typeof value === 'object' && 'id' in value && value.id) {
      return null;
    }
    return { required: true };
  };
}

@Component({
  selector: 'app-controlequalite',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatIconModule,
    TranslateModule,
    BaseTypeComponent,
    QcEntryStudioComponent
  ],
  templateUrl: './controleQualite.component.html',
  styleUrls: ['./controleQualite.component.scss'],
  standalone: true
})
export class ControleQualiteComponent implements OnInit, OnDestroy {
  @Input() deliveryId: string | null = null;

  qualityForm!: FormGroup;
  storageunitForm!: FormGroup;

  capacityError = false;
  availableCapacity = 0;
  message = '';
  receptionId: string | null = null;
  deliveryData: UnifiedDelivery | undefined;
  originalOliveReception: UnifiedDelivery | undefined;
  isLoading = false;
  isQualityControlDone = false;
  storageUnits: StorageUnitDto[] = [];
  oilFromOlive = false;
  studioContext: QcEntryContext = 'RECEPTION_OIL';
  oliveIdx: string | null = null;
  private subs: Subscription[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly deliveryService: UnifiedDeliveryService,
    private readonly cdr: ChangeDetectorRef,
    private readonly toast: ToastService,
    private readonly storageUnitService: StorageUnitDtoService,
    private readonly translate: TranslateService,
    @Optional() @Inject(MAT_DIALOG_DATA) public dialogData: Record<string, unknown> | null = null,
    @Optional() private readonly dialogRef: MatDialogRef<ControleQualiteComponent> | null = null
  ) {
    if (dialogData && dialogData['deliveryId']) {
      this.deliveryId = dialogData['deliveryId'] as string;
    }
  }

  ngOnInit(): void {
    this.receptionId = this.deliveryId || this.route.snapshot.paramMap.get('id');
    this.oliveIdx = this.route.snapshot.paramMap.get('idx');

    this.qualityForm = this.fb.group({
      oliveVariety: new FormControl(null, [Validators.required, requiredEntitySelectionValidator()])
    });
    this.storageunitForm = this.fb.group({
      storageUnitDestinationId: [null, Validators.required]
    });

    if (this.oliveIdx) {
      this.oilFromOlive = true;
      this.studioContext = 'OIL_FROM_OLIVE';
      this.loadOliveReceptionData(this.oliveIdx);
    } else {
      this.loadReception();
    }

    this.loadStorageUnits();
    this.subs.push(
      this.storageunitForm.get('storageUnitDestinationId')!.valueChanges.subscribe((unit) => {
        this.updateCapacityState(unit);
      })
    );
    this.subs.push(
      this.qualityForm.valueChanges.subscribe(() => {
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  isOliveDelivery(): boolean {
    return this.deliveryData?.deliveryType === 'OLIVE';
  }

  isStorageValid(): boolean {
    if (this.isOliveDelivery() && !this.oilFromOlive) {
      return this.qualityForm.valid;
    }
    return this.storageunitForm.valid && !this.capacityError;
  }

  oliveVarietyInvalid(): boolean {
    const control = this.qualityForm.get('oliveVariety');
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  submitBlockedHint(): string | null {
    if (this.isOliveDelivery() && !this.oilFromOlive && this.qualityForm.invalid) {
      return 'CONTROLE_QUALITE.MESSAGES.OLIVE_VARIETY_REQUIRED';
    }
    if ((!this.isOliveDelivery() || this.oilFromOlive) && !this.isStorageValid()) {
      if (this.capacityError) {
        return 'OIL_TRANSACTIONS.FORM.VALIDATION.CAPACITY';
      }
      return 'CONTROLE_QUALITE.STORAGE_UNIT.ERRORS.REQUIRED';
    }
    return null;
  }

  selectedStorageUnitId(): string | null {
    const unit = this.storageunitForm.get('storageUnitDestinationId')?.value as StorageUnitDto | null;
    return unit?.id || null;
  }

  preSave = (): Observable<boolean> => {
    if (this.isQualityControlDone) {
      return of(true);
    }

    if (this.oilFromOlive) {
      return of(true);
    }

    if (this.isOliveDelivery()) {
      if (this.qualityForm.invalid) {
        this.qualityForm.markAllAsTouched();
        this.toast.warning('CONTROLE_QUALITE.MESSAGES.OLIVE_VARIETY_REQUIRED');
        return of(false);
      }
      return new Observable<boolean>((observer) => {
        this.updateDeliveryWithOliveVariety()
          .then((ok) => {
            observer.next(ok);
            observer.complete();
          })
          .catch(() => {
            observer.next(false);
            observer.complete();
          });
      });
    }

    return new Observable<boolean>((observer) => {
      this.persistStorageSelection()
        .then((ok) => {
          observer.next(ok);
          observer.complete();
        })
        .catch(() => {
          observer.next(false);
          observer.complete();
        });
    });
  };

  onQcSaved(): void {
    this.isQualityControlDone = true;
    this.applyReadOnlyState();
    this.cdr.detectChanges();

    if (this.dialogRef) {
      this.dialogRef.close({ saved: true });
      return;
    }

    this.navigateToReceptionList();
  }

  private navigateToReceptionList(): void {
    if (this.oilFromOlive) {
      const opSeg = this.opToPath(this.originalOliveReception?.operationType);
      void this.router.navigate(opSeg ? ['/reception/reception-olive', opSeg] : ['/reception/reception-olive']);
      return;
    }

    if (this.isOliveDelivery()) {
      const opSeg = this.opToPath(this.deliveryData?.operationType);
      void this.router.navigate(opSeg ? ['/reception/reception-olive', opSeg] : ['/reception/reception-olive']);
      return;
    }

    void this.router.navigate(['/reception/reception-huile']);
  }

  private opToPath(op?: OperationType | string | null): string | undefined {
    const normalized = typeof op === 'string' ? op.toUpperCase().trim() : op;
    switch (normalized) {
      case OperationType.EXCHANGE:
        return 'exchange';
      case OperationType.SIMPLE_RECEPTION:
        return 'simple_reception';
      case OperationType.BASE:
        return 'base';
      case OperationType.OLIVE_PURCHASE:
        return 'olive_purchase';
      default:
        return undefined;
    }
  }

  onOliveVarietySelected(value: unknown): void {
    if (this.isQualityControlDone) {
      return;
    }
    this.qualityForm.get('oliveVariety')?.setValue(value);
    this.qualityForm.get('oliveVariety')?.markAsDirty();
    this.qualityForm.get('oliveVariety')?.markAsTouched();
  }

  private applyReadOnlyState(): void {
    if (!this.isQualityControlDone) {
      return;
    }
    this.qualityForm.disable({ emitEvent: false });
    this.storageunitForm.disable({ emitEvent: false });
  }

  private loadReception(): void {
    if (!this.receptionId) {
      this.message = 'ID de réception manquant';
      return;
    }

    this.isLoading = true;
    this.deliveryService.getUnifiedDelivery(this.receptionId).subscribe({
      next: (response) => {
        this.deliveryData = Array.isArray(response.data) ? response.data[0] : response.data;
        this.studioContext = this.deliveryData?.deliveryType === 'OLIVE' ? 'RECEPTION_OLIVE' : 'RECEPTION_OIL';
        this.isQualityControlDone = !!this.deliveryData?.hasQualityControl || (this.deliveryData?.qualityControlResults?.length ?? 0) > 0;
        if (this.deliveryData?.oliveVariety) {
          this.qualityForm.patchValue({ oliveVariety: this.deliveryData.oliveVariety }, { emitEvent: false });
        }
        this.applyReadOnlyState();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.message = 'Erreur lors du chargement des données de réception';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadOliveReceptionData(receptionId: string): void {
    this.isLoading = true;
    this.deliveryService.getUnifiedDelivery(receptionId).subscribe({
      next: (response) => {
        this.originalOliveReception = Array.isArray(response.data) ? response.data[0] : response.data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.message = 'Erreur lors du chargement des données de réception';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadStorageUnits(): void {
    this.storageUnitService.getAllStorageUnit().subscribe({
      next: (res) => {
        this.storageUnits = (res?.data ?? res ?? []).filter((unit: StorageUnitDto) => unit.filteredOil === false);
      },
      error: () => {
        this.message = this.translate.instant('COMMON.ERROR_LOADING');
      }
    });
  }

  private updateCapacityState(unit: StorageUnitDto | null): void {
    this.availableCapacity = unit ? Number(unit.maxCapacity) - Number(unit.currentVolume ?? 0) : 0;
    const incoming = Number(this.oilFromOlive ? (this.originalOliveReception?.oilQuantity ?? 0) : (this.deliveryData?.poidsNet ?? 0));
    this.capacityError = !!unit && this.availableCapacity < incoming;
  }

  private async updateDeliveryWithOliveVariety(): Promise<boolean> {
    if (this.isQualityControlDone) {
      return true;
    }
    if (!this.deliveryData?.id) {
      return false;
    }

    const oliveVariety = this.qualityForm.get('oliveVariety')?.value;
    const updatedDelivery: Partial<UnifiedDelivery> = {
      ...this.deliveryData,
      oliveVariety
    };

    try {
      const response = await firstValueFrom(this.deliveryService.updateUnifiedDelivery(updatedDelivery as UnifiedDelivery));
      if (response?.success) {
        this.deliveryData = Array.isArray(response.data) ? response.data[0] : response.data;
        return true;
      }
      this.toast.error('AUTO.ERREUR_LORS_DE_LA_MISE_A_JOUR_DE_LA_VARIETE_D_OLIVE');
      return false;
    } catch {
      this.toast.error('AUTO.ERREUR_LORS_DE_LA_MISE_A_JOUR_DE_LA_VARIETE_D_OLIVE');
      return false;
    }
  }

  private async persistStorageSelection(): Promise<boolean> {
    if (this.isQualityControlDone) {
      return true;
    }

    if (!this.deliveryData?.id) {
      return this.oilFromOlive;
    }

    const selectedUnit = this.storageunitForm.get('storageUnitDestinationId')?.value as StorageUnitDto | null;
    this.deliveryData.storageUnit = selectedUnit || null;

    try {
      const response = await firstValueFrom(this.deliveryService.updateDelivery(this.deliveryData));
      if (response?.success) {
        this.deliveryData = Array.isArray(response.data) ? response.data[0] : response.data;
        return true;
      }
      this.toast.error('AUTO.ERREUR_LORS_DE_L_ENREGISTREMENT_DES_DONNEES_DE_RECEPTION');
      return false;
    } catch {
      this.toast.error('AUTO.ERREUR_LORS_DE_L_ENREGISTREMENT_DES_DONNEES_DE_RECEPTION');
      return false;
    }
  }
}
