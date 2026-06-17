import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, Input, OnDestroy, OnInit, Optional } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, firstValueFrom, of } from 'rxjs';

import { UnifiedDeliveryService } from '../../shared/services/delivery.service';
import { UnifiedDelivery } from '../../shared/models/UnifiedDelivery';
import { StorageUnitDtoService } from '../../shared/services/storage.service';
import { StorageUnitDto } from '../../shared/models/StorageUnitDto';
import { ToastService } from '../../shared/services/toast.service';
import { BaseTypeComponent } from '../../shared/modules/base-type/base-type.component';
import { QcEntryStudioComponent } from '../../shared/qc/components/qc-entry-studio/qc-entry-studio.component';
import { QcEntryContext } from '../../shared/qc/models/qc-context.model';

@Component({
  selector: 'app-controlequalite',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatChipsModule,
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
    private readonly deliveryService: UnifiedDeliveryService,
    private readonly cdr: ChangeDetectorRef,
    private readonly toast: ToastService,
    private readonly storageUnitService: StorageUnitDtoService,
    private readonly translate: TranslateService,
    @Optional() @Inject(MAT_DIALOG_DATA) public dialogData: Record<string, unknown> | null = null
  ) {
    if (dialogData && dialogData['deliveryId']) {
      this.deliveryId = dialogData['deliveryId'] as string;
    }
  }

  ngOnInit(): void {
    this.receptionId = this.deliveryId || this.route.snapshot.paramMap.get('id');
    this.oliveIdx = this.route.snapshot.paramMap.get('idx');

    this.qualityForm = this.fb.group({
      oliveVariety: new FormControl(null)
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
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  isOliveDelivery(): boolean {
    return this.deliveryData?.deliveryType === 'OLIVE';
  }

  isStorageValid(): boolean {
    if (this.isOliveDelivery() && !this.oilFromOlive) {
      return true;
    }
    return this.storageunitForm.valid && !this.capacityError;
  }

  selectedStorageUnitId(): string | null {
    const unit = this.storageunitForm.get('storageUnitDestinationId')?.value as StorageUnitDto | null;
    return unit?.id || null;
  }

  preSave = (): Observable<boolean> => {
    if (this.oilFromOlive) {
      return of(true);
    }

    if (this.isOliveDelivery() && this.qualityForm.get('oliveVariety')?.value) {
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

    if (!this.isOliveDelivery() || this.oilFromOlive) {
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
    }

    return of(true);
  };

  onQcSaved(): void {
    this.isQualityControlDone = true;
    this.toast.success('AUTO.RESULTATS_CREES_AVEC_SUCCES');
    this.cdr.detectChanges();
  }

  onOliveVarietySelected(value: unknown): void {
    this.qualityForm.get('oliveVariety')?.setValue(value);
    this.qualityForm.get('oliveVariety')?.markAsDirty();
    this.qualityForm.get('oliveVariety')?.markAsTouched();
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
        this.studioContext =
          this.deliveryData?.deliveryType === 'OLIVE' ? 'RECEPTION_OLIVE' : 'RECEPTION_OIL';
        this.isQualityControlDone =
          !!this.deliveryData?.hasQualityControl ||
          (this.deliveryData?.qualityControlResults?.length ?? 0) > 0;
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
    const incoming = Number(
      this.oilFromOlive
        ? (this.originalOliveReception?.oilQuantity ?? 0)
        : (this.deliveryData?.poidsNet ?? 0)
    );
    this.capacityError = !!unit && this.availableCapacity < incoming;
  }

  private async updateDeliveryWithOliveVariety(): Promise<boolean> {
    if (!this.deliveryData?.id) {
      return false;
    }

    const oliveVariety = this.qualityForm.get('oliveVariety')?.value;
    const updatedDelivery: Partial<UnifiedDelivery> = {
      ...this.deliveryData,
      oliveVariety
    };

    try {
      const response = await firstValueFrom(
        this.deliveryService.updateUnifiedDelivery(updatedDelivery as UnifiedDelivery)
      );
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
