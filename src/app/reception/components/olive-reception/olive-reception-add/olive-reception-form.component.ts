import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastService } from '../../../../shared/services/toast.service';
import { UnifiedDelivery } from '../../../../shared/models/UnifiedDelivery';
import { BaseType } from '../../../../shared/models/base-type';
import { SupplierType } from '../../../../shared/models/supplier-type';
import { GenericTypeService } from '../../../../shared/services/generic-type.service';
import { UnifiedDeliveryService } from '../../../../shared/services/delivery.service';
import { SupplierTypeService } from '../../../../shared/services/supplier.service';
import { TypeCategory } from '../../../../shared/models/type-category.enum';
import { CardComponent } from '../../../../theme/components/card/card.component';
import { MatIcon } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { map, startWith } from 'rxjs/operators';
import { OperationType } from '../../../../shared/models/operation-type.enum';
import { BaseTypeComponent } from '../../../../shared/modules/base-type/base-type.component';
import { OilType } from '../../../../shared/models/oil-type.enum';
import { OliveType } from '../../../../shared/models/olive-type.enum';
import { mapOilFromOlive, mapOliveFromOil } from '../../../../shared/models/olive-oil-type.util';

// Validator to ensure net weight does not exceed gross weight
const netNotGreaterThanGross = (control: AbstractControl): ValidationErrors | null => {
  const gross = control.get('poidsBrute')?.value;
  const net = control.get('poidsNet')?.value;
  return gross != null && net != null && net > gross ? { netGreater: true } : null;
};

// Helper to check if value is a valid object from the list
function isValidSelection<T extends { id?: string }>(value: unknown, list: T[]): boolean {
  return !!value && typeof value === 'object' && 'id' in value && list.some((item) => item.id && item.id === (value as T).id);
}

@Component({
  selector: 'app-olive-reception-form',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    CardComponent,
    MatIcon,
    MatAutocompleteModule,
    FormsModule,
    TranslateModule,
    BaseTypeComponent
  ],
  templateUrl: './olive-reception-form.component.html',
  styleUrls: ['./olive-reception-form.component.scss']
})
export class OliveReceptionFormComponent implements OnInit, OnDestroy {
  loading = false;
  isEditing = false;
  errorMessage: string | null = null;
  receptionForm: FormGroup;
  oliveOptions = Object.values(OliveType);
  oilOptions = Object.values(OilType);
  regions: BaseType[] = [];
  suppliers: SupplierType[] = [];
  oliveVarieties: BaseType[] = [];
  operationTypes: { name: string; value: OperationType }[] = [
    {
      name: 'EXCHANGE',
      value: OperationType.EXCHANGE
    },
    { name: 'SIMPLE_RECEPTION', value: OperationType.SIMPLE_RECEPTION },
    {
      name: 'BASE',
      value: OperationType.BASE
    },
    { name: 'OLIVE_PURCHASE', value: OperationType.OLIVE_PURCHASE }
  ];
  deliveries: UnifiedDelivery[] = [];
  // Autocomplete filtered options
  filteredRegions: Observable<BaseType[]>;
  filteredSuppliers: Observable<SupplierType[]>;
  filteredOliveVarieties: Observable<BaseType[]>;
  filteredOperationTypes: Observable<BaseType[]>;
  private typeSubs: Subscription[] = [];
  private pendingCalls = 0;
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private deliveryService: UnifiedDeliveryService,
    private genericTypeService: GenericTypeService,
    private supplierService: SupplierTypeService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router,
    protected translate: TranslateService
  ) {
    this.receptionForm = this.fb.group(
      {
        deliveryType: [{ value: 'OLIVE', disabled: true }, Validators.required],
        deliveryNumber: [{ value: '', disabled: true }, Validators.required],
        lotNumber: [{ value: '', disabled: true }, Validators.required],
        deliveryDate: [new Date(), Validators.required],
        region: [null, Validators.required],
        poidsBrute: [0, [Validators.min(1)]],
        poidsNet: [0, [Validators.min(1)]],
        matriculeCamion: ['', [Validators.required]],
        etatCamion: ['', Validators.required],
        supplier: [null, Validators.required],
        trtDate: [new Date(), [Validators.required]],
        oliveVariety: [null, [Validators.required]],
        sackCount: [null, [Validators.required]],
        oliveType: [null, [Validators.required]],
        operationType: [null, [Validators.required]],
        parcel: ['']
      },
      { validators: netNotGreaterThanGross }
    );
    this.receptionForm.addControl('oliveType', new FormControl<OliveType | null>(null));
    this.receptionForm.addControl('oilType', new FormControl<OilType | null>(null));
  }

  oliveTypeSelected(value: any) {
    console.log(value);
  }

  ngOnInit(): void {
    /** 1. Init mode édition / création */
    const deliveryId = this.route.snapshot.paramMap.get('id');
    this.isEditing = deliveryId !== null && deliveryId !== 'new';
    // Sync olive -> oil
    this.typeSubs.push(
      this.receptionForm.get('oliveType')!.valueChanges.subscribe((val: OliveType | null) => {
        // 1) mirror oilType
        this.receptionForm.get('oilType')!.setValue(mapOilFromOlive(val), { emitEvent: false });

        // 2) keep your lot number logic (adapted to enum)
        const deliveryNumber = this.receptionForm.get('deliveryNumber')?.value || this.deliveries.length + 1;
        const lotNumber = this.generateLotNumber(val, deliveryNumber);
        this.receptionForm.patchValue({ lotNumber }, { emitEvent: false });
      })
    );

    // Sync oil -> olive (in case user chooses oil first)
    this.typeSubs.push(
      this.receptionForm.get('oilType')!.valueChanges.subscribe((val: OilType | null) => {
        this.receptionForm.get('oliveType')!.setValue(mapOliveFromOil(val), { emitEvent: false });
      })
    );

    this.loading = true; // Affiche le spinner
    this.pendingCalls = 0; // Réinitialise le compteur

    /** 2. Charger les régions */
    this.pendingCalls++;
    const regionSub = this.genericTypeService.getAllTypes(TypeCategory.REGION).subscribe({
      next: (res) => {
        this.regions = res.success ? res.data : [];
      },
      error: () => this.showToast(this.translate.instant('DELIVERIES.FORM.MESSAGES.LOAD_ERROR'), 'error'),
      complete: () => this.markCallDone()
    });
    this.subscriptions.push(regionSub);

    /** 3. Charger les fournisseurs */
    this.pendingCalls++;
    const supplierSub = this.supplierService.getAllSuppliers().subscribe({
      next: (res) => {
        this.suppliers = res.success ? res.data : [];
      },
      error: () => this.showToast(this.translate.instant('DELIVERIES.FORM.MESSAGES.LOAD_ERROR'), 'error'),
      complete: () => this.markCallDone()
    });
    this.subscriptions.push(supplierSub);

    /** 4. Charger les réceptions existantes (pour générer les n°) */
    this.pendingCalls++;
    const deliveriesSub = this.deliveryService.getAllDeliveriesList().subscribe({
      next: (res) => {
        this.deliveries = res.success ? res.data : [];
        if (!this.isEditing) {
          const deliveryCount = this.deliveries.length;
          const maxLot = this.getMaxLotNumber();
          this.receptionForm.patchValue({
            deliveryNumber: deliveryCount + 1,
            lotNumber: maxLot + 1
          });
        }
      },
      error: () => this.showToast(this.translate.instant('DELIVERIES.FORM.MESSAGES.LOAD_ERROR'), 'error'),
      complete: () => this.markCallDone()
    });
    this.subscriptions.push(deliveriesSub);

    /** 5. Si édition, charger la réception à modifier */
    if (this.isEditing && deliveryId) {
      this.pendingCalls++;
      const editSub = this.deliveryService.getUnifiedDelivery(deliveryId).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const delivery = Array.isArray(res.data) ? res.data[0] : res.data;
            this.patchForm(delivery);
          } else {
            this.errorMessage = this.translate.instant('DELIVERIES.FORM.MESSAGES.RECEPTION_LOAD_ERROR');
            this.router.navigate(['/reception-olive']);
          }
        },
        error: () => {
          this.errorMessage = this.translate.instant('DELIVERIES.FORM.MESSAGES.RECEPTION_LOAD_ERROR');
          this.router.navigate(['/reception-olive']);
        },
        complete: () => this.markCallDone()
      });
      this.subscriptions.push(editSub);
    }

    /** 6. Souscriptions internes (lotNumber auto, etc.) */
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  // Save or update the reception
  async saveReception(): Promise<void> {
    if (this.receptionForm.invalid) {
      this.showToast(this.translate.instant('DELIVERIES.FORM.VALIDATION.FILL_REQUIRED'), 'warning');
      return;
    }

    const formValue = this.receptionForm.getRawValue();

    // Validate required references
    if (!formValue.region?.id) {
      this.showToast(this.translate.instant('DELIVERIES.FORM.VALIDATION.INVALID_REGION'), 'warning');
      return;
    }
    if (!formValue.supplier?.id) {
      this.showToast(this.translate.instant('DELIVERIES.FORM.VALIDATION.INVALID_SUPPLIER'), 'warning');
      return;
    }

    // Validate numeric values
    if (formValue.poidsBrute < 0 || formValue.poidsNet < 0) {
      this.showToast(this.translate.instant('DELIVERIES.FORM.VALIDATION.POSITIVE_VALUE'), 'warning');
      return;
    }

    // Validate dates
    if (!formValue.deliveryDate) {
      this.showToast(this.translate.instant('DELIVERIES.FORM.VALIDATION.REQUIRED_DATE'), 'warning');
      return;
    }

    const deliveryId = this.route.snapshot.paramMap.get('id');
    const payload: Partial<UnifiedDelivery> = {
      id: this.isEditing && deliveryId ? deliveryId : undefined,
      deliveryType: 'OLIVE',
      deliveryNumber: formValue.deliveryNumber || '',
      lotNumber: formValue.lotNumber || '',
      deliveryDate: formValue.deliveryDate ? new Date(formValue.deliveryDate) : new Date(),
      region: formValue.region || null,
      poidsBrute: Number(formValue.poidsBrute) || 0,
      poidsNet: Number(formValue.poidsNet) || 0,
      matriculeCamion: formValue.matriculeCamion || '',
      etatCamion: formValue.etatCamion || '',
      supplier: formValue.supplier || null,
      trtDate: formValue.trtDate ? new Date(formValue.trtDate) : null,
      oliveVariety: formValue.oliveVariety || null,
      sackCount: formValue.sackCount ? Number(formValue.sackCount) : 0,
      oliveType: formValue.oliveType || null,
      oilType: formValue.oilType || null,
      operationType: formValue.operationType || null,
      parcel: formValue.parcel || '',
      price: Number(formValue.price) || 0,
      globalLotNumber: formValue.globalLotNumber || null,
      unitPrice: Number(formValue.unitPrice) || 0,
      paidAmount: Number(formValue.paidAmount) || 0,
      unpaidAmount: Number(formValue.unpaidAmount) || 0,
      rendement: Number(formValue.rendement) || 0,
      oliveQuantity: Number(formValue.oliveQuantity) || 0,
      storageUnit: formValue.storageUnit || null,
      qualityControlResults: formValue.qualityControlResults || null
    };

    this.loading = true;
    try {
      const response = await (this.isEditing
        ? this.deliveryService.updateUnifiedDelivery(payload as UnifiedDelivery).toPromise()
        : this.deliveryService.createUnifiedDelivery(payload as UnifiedDelivery).toPromise());

      if (response?.success && response.data) {
        this.showToast(
          this.translate.instant(this.isEditing ? 'DELIVERIES.FORM.MESSAGES.UPDATE_SUCCESS' : 'DELIVERIES.FORM.MESSAGES.SAVE_SUCCESS'),
          'success'
        );
        this.router.navigate(['reception/reception-olive']);
      } else {
        const errorMessage = response?.message || this.translate.instant('DELIVERIES.FORM.MESSAGES.OPERATION_FAILED');
        this.showToast(errorMessage, 'error');
      }
    } catch (error: unknown) {
      let errorMessage = this.translate.instant(
        this.isEditing ? 'DELIVERIES.FORM.MESSAGES.UPDATE_ERROR' : 'DELIVERIES.FORM.MESSAGES.SAVE_ERROR'
      );

      if (error && typeof error === 'object' && 'status' in error && error.status === 400) {
        const errorObj = error as { error?: { message?: string } };
        errorMessage = errorObj.error?.message || this.translate.instant('DELIVERIES.FORM.MESSAGES.VALIDATION_ERROR');
      }

      this.showToast(errorMessage, 'error');
      console.error('Save error:', error);
    } finally {
      this.loading = false;
    }
  }

  // Navigate back to dashboard
  resetForm(): void {
    this.router.navigate(['/reception/reception-olive']);
  }

  displayFn<T extends { name?: string; supplierInfo?: { name: string; lastname: string } }>(item: T): string {
    if (!item) return '';
    if (item.supplierInfo) {
      return item.supplierInfo.name + ' ' + item.supplierInfo.lastname;
    }
    return item.name || '';
  }

  validateSupplier() {
    const value = this.receptionForm.get('supplier')!.value;
    if (!isValidSelection(value, this.suppliers)) {
      this.receptionForm.get('supplier')!.setValue(null);
    }
  }

  onBack(): void {
    window.history.back();
  }

  /** Décrémente le compteur et cache le spinner quand tout est terminé */
  private markCallDone(): void {
    this.pendingCalls--;
    if (this.pendingCalls === 0) {
      this.loading = false;
      // Les filtres autocomplete dépendent des listes chargées :
      this.setupAutocompleteFilters();
    }
  }

  // Display toast notification
  private showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    switch (type) {
      case 'success':
        this.toastService.success(message);
        break;
      case 'error':
        this.toastService.error(message);
        break;
      case 'warning':
        this.toastService.warning(message);
        break;
      case 'info':
      default:
        this.toastService.info(message);
        break;
    }
  }

  // Calculate maximum lot number from deliveries
  private getMaxLotNumber(): number {
    const lotNumbers = this.deliveries.map((d) => parseInt(d.lotNumber?.replace(/^\D+/, '') ?? '0', 10)).filter((n) => !isNaN(n));
    return lotNumbers.length ? Math.max(...lotNumbers) : 0;
  }

  // Convert date to ISO string
  private toISOString(date: Date | string | null): string | null {
    return date ? new Date(date).toISOString() : null;
  }

  // Generate lot number based on olive type and delivery number
  private generateLotNumber(oliveType: OliveType | null, deliveryNumber: number): string {
    if (!oliveType) return '';
    const year = new Date().getFullYear().toString().slice(-2);
    const paddedNumber = deliveryNumber.toString().padStart(4, '0');
    return `${paddedNumber}${oliveType}${year}`;
  }

  private _getNestedValue<T extends Record<string, unknown>>(obj: T, path: string): string {
    return path.split('.').reduce((acc, part) => {
      if (acc && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[part];
      }
      return '';
    }, obj as unknown) as string;
  }

  // Patch form with delivery data
  private patchForm(d: UnifiedDelivery): void {
    const matchedSupplier = this.suppliers.find((s) => s.id?.toString() === d.supplier?.id?.toString());

    const parseDate = (value: string | Date | null | undefined): Date | null => {
      if (!value) return null;
      return value instanceof Date ? value : new Date(value);
    };

    this.receptionForm.patchValue({
      ...d,
      deliveryDate: parseDate(d.deliveryDate),
      trtDate: parseDate(d.trtDate),
      region: this.regions.find((r) => r.id === d.region?.id) || null,
      poidsBrute: d.poidsBrute,
      poidsNet: d.poidsNet,
      matriculeCamion: d.matriculeCamion,
      etatCamion: d.etatCamion,
      supplier: matchedSupplier || null,
      oliveVariety: d.oliveVariety || null,
      sackCount: d.sackCount,
      oliveType: d.oliveType || null,
      operationType: d.operationType || null,
      parcel: d.parcel || ''
    });
  }

  // Setup form subscriptions
  private setupFormSubscriptions(): void {
    this.subscriptions.push(
      this.receptionForm.get('oliveType')!.valueChanges.subscribe((oliveType: OliveType | null) => {
        const deliveryNumber = this.receptionForm.get('deliveryNumber')?.value || this.deliveries.length + 1;
        const lotNumber = this.generateLotNumber(oliveType, deliveryNumber);
        this.receptionForm.patchValue({ lotNumber }, { emitEvent: false });
      })
    );

    this.subscriptions.push(
      this.receptionForm.get('region')!.valueChanges.subscribe((region: BaseType | null) => {
        if (region?.name) {
          this.receptionForm.patchValue({ parcel: region.name }, { emitEvent: false });
        }
      })
    );

    // Enforce autocomplete selection for supplier
    this.receptionForm.get('supplier')!.valueChanges.subscribe((value) => {
      if (value && !this.suppliers.some((s) => s.id === value.id)) {
        this.receptionForm.get('supplier')!.setValue(null);
      }
    });
    // Enforce autocomplete selection for region
    this.receptionForm.get('region')!.valueChanges.subscribe((value) => {
      if (value && !this.regions.some((r) => r.id === value.id)) {
        this.receptionForm.get('region')!.setValue(null);
      }
    });
  }

  private setupAutocompleteFilters(): void {
    // Region filter
    this.filteredRegions = this.receptionForm.get('region')!.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(this.regions, value, 'name'))
    );

    // Supplier filter
    this.filteredSuppliers = this.receptionForm.get('supplier')!.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(this.suppliers, value, 'supplierInfo.name'))
    );

    // Operation type filter
    this.filteredOperationTypes = this.receptionForm.get('operationType')!.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(this.operationTypes, value, 'name'))
    );
  }

  private _filter<
    T extends {
      name?: string;
      supplierInfo?: { name: string };
    }
  >(items: T[], value: string | T, displayField: string): T[] {
    if (!value || typeof value === 'object') {
      return items;
    }
    const filterValue = value.toLowerCase();
    return items.filter((item) => {
      const fieldValue = this._getNestedValue(item, displayField);
      return fieldValue.toLowerCase().includes(filterValue);
    });
  }
}
