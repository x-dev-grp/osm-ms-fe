import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatDialog} from '@angular/material/dialog';
import {SupplierAddComponent} from '../../suppliers/supplier-add/supplier-add.component';
import {AddBasetypeComponent} from '../../../settings/generic-type/add-basetype/add-basetype.component';
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
import {Observable, Subscription} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {UnifiedDelivery} from '../../../shared/models/UnifiedDelivery';
import {BaseType} from '../../../shared/models/base-type';
import {SupplierType} from '../../../shared/models/supplier-type';
import {GenericTypeService} from '../../../shared/services/generic-type.service';
import {UnifiedDeliveryService} from '../../../shared/services/delivery.service';
import {SupplierTypeService} from '../../../shared/services/supplier.service';
import {TypeCategory} from '../../../shared/models/type-category.enum';
import {MatIcon} from '@angular/material/icon';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {map, startWith} from 'rxjs/operators';
import {OperationType} from '../../../shared/models/operation-type.enum';
import {BaseTypeComponent} from '../../../shared/modules/base-type/base-type.component';
import {ToastService} from '../../../shared/services/toast.service';
import {CardComponent} from '../../../theme/components/card/card.component';
import {Olive_Oil_Type} from '../../../shared/models/olive-type.enum';

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
  @ViewChild('regionComponent') regionComponent!: BaseTypeComponent;
  @ViewChild('parcelComponent') parcelComponent!: BaseTypeComponent;

  loading = false;
  isEditing = false;
  errorMessage: string | null = null;
  receptionForm: FormGroup;
  olive_oil_Options = Object.values(Olive_Oil_Type);
   regions: BaseType[] = [];
  parcels: BaseType[] = [];

  suppliers: SupplierType[] = [];
  oliveVarieties: BaseType[] = [];
  private hydrating = false;

  /** Dynamic labels (party = Supplier|Client) */
  partyLabelKey = 'OLIVE_RECEPTION.FORM.FIELDS.SUPPLIER';
  partyRegionSectionKey = 'OLIVE_RECEPTION.FORM.SECTIONS.SUPPLIER_REGION';

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
  /** Map which op types use Supplier vs Client label */
  private readonly partyLabelByOp: Record<OperationType, 'OLIVE_RECEPTION.FORM.FIELDS.SUPPLIER' | 'OLIVE_RECEPTION.FORM.FIELDS.CLIENT'> = {
    OIL_PURCHASE: 'OLIVE_RECEPTION.FORM.FIELDS.SUPPLIER',
    BASE: 'OLIVE_RECEPTION.FORM.FIELDS.SUPPLIER',
    OLIVE_PURCHASE: 'OLIVE_RECEPTION.FORM.FIELDS.SUPPLIER',
    EXCHANGE: 'OLIVE_RECEPTION.FORM.FIELDS.CLIENT',
    SIMPLE_RECEPTION: 'OLIVE_RECEPTION.FORM.FIELDS.CLIENT',
    [OperationType.PAYMENT]: 'OLIVE_RECEPTION.FORM.FIELDS.SUPPLIER',
    [OperationType.DECHET]: 'OLIVE_RECEPTION.FORM.FIELDS.SUPPLIER'
  };

  // Pending data for when regions/parcels are not yet loaded
  private pendingEditReception: UnifiedDelivery | null = null;
  private regionsLoaded = false;
  private parcelsLoaded = false;

  constructor(
    private fb: FormBuilder,
    private deliveryService: UnifiedDeliveryService,
    private genericTypeService: GenericTypeService,
    private supplierService: SupplierTypeService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
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
        poidsNet: [{ value: 0, disabled: true }],
        matriculeCamion: ['', [Validators.required]],
        supplier: [null, Validators.required],
        trtDate: [new Date(), [Validators.required]],
        oliveVariety: [null],
        sackCount: [null, [Validators.required]],
        oliveType: [null, [Validators.required]],
        poidsCamionVide: [0, [Validators.min(0)]],
        operationType: [null, [Validators.required]],
        parcel: [null, Validators.required]
      },
      { validators: netNotGreaterThanGross }
    );
    this.receptionForm.addControl('oliveType', new FormControl<Olive_Oil_Type| null>(null));
    this.receptionForm.addControl('oilType', new FormControl<Olive_Oil_Type | null>(null));
  }
  ngOnInit(): void {
    // --- flags & basics ---
    // NOTE: add `private hydrating = false;` as a class field.
    const deliveryId = this.route.snapshot.paramMap.get('id');
    this.isEditing = deliveryId !== null && deliveryId !== 'new';

    this.recomputeNet();
    this.loading = true;
    this.pendingCalls = 0;

    // // --- sync oliveType -> oilType (and lot number) ---
    // this.typeSubs.push(
    //   this.receptionForm.get('oliveType')!.valueChanges.subscribe((val: OliveType | null) => {
    //     // mirror oilType without firing another chain
    //     this.receptionForm.get('oilType')!.setValue(mapOilFromOlive(val), { emitEvent: false });
    //
    //     // update lot number
    //     const deliveryNumber = this.receptionForm.get('deliveryNumber')?.value || this.deliveries.length + 1;
    //     const lotNumber = this.generateLotNumber(val, deliveryNumber);
    //     this.receptionForm.patchValue({ lotNumber }, { emitEvent: false });
    //   })
    // );

    // --- sync oilType -> oliveType ---
    // this.typeSubs.push(
    //   this.receptionForm.get('oilType')!.valueChanges.subscribe((val: OilType | null) => {
    //     this.receptionForm.get('oliveType')!.setValue(mapOliveFromOil(val), { emitEvent: false });
    //   })
    // );

    // --- load Regions ---
    this.pendingCalls++;
    const regionSub = this.genericTypeService.getAllTypes(TypeCategory.REGION).subscribe({
      next: (res) => {
        this.regions = res.success ? res.data : [];
        this.regionsLoaded = true;

        // Patch only when BOTH datasets are ready
        if (this.pendingEditReception && this.regionsLoaded && this.parcelsLoaded) {
          this.patchForm(this.pendingEditReception);
          this.pendingEditReception = null;
        }
      },
      error: () => this.showToast(this.translate.instant('DELIVERIES.FORM.MESSAGES.LOAD_ERROR'), 'error'),
      complete: () => this.markCallDone()
    });
    this.subscriptions.push(regionSub);

    // --- load Parcels ---
    this.pendingCalls++;
    const parcelsSub = this.genericTypeService.getAllTypes(TypeCategory.PARCEL).subscribe({
      next: (res) => {
        this.parcels = res.success ? res.data : [];
        this.parcelsLoaded = true;

        // Patch only when BOTH datasets are ready
        if (this.pendingEditReception && this.regionsLoaded && this.parcelsLoaded) {
          this.patchForm(this.pendingEditReception);
          this.pendingEditReception = null;
        }
      },
      error: () => this.showToast(this.translate.instant('DELIVERIES.FORM.MESSAGES.LOAD_ERROR'), 'error'),
      complete: () => this.markCallDone()
    });
    this.subscriptions.push(parcelsSub);

    // // --- region change -> default parcel (skip during hydrate) ---
    // this.subscriptions.push(
    //   this.receptionForm.get('region')!.valueChanges.subscribe((region: BaseType | null) => {
    //     if (this.hydrating) return; // prevent overwriting while patching
    //     const currentParcel = this.receptionForm.get('parcel')!.value;
    //     if (region && (!currentParcel || (typeof currentParcel === 'object' && !currentParcel.id))) {
    //       this.receptionForm.patchValue({ parcel: region }, { emitEvent: false });
    //     }
    //   })
    // );

    // --- supplier change -> set region (+ parcel) (skip during hydrate) ---
    // this.subscriptions.push(
    //   this.receptionForm.get('supplier')!.valueChanges.subscribe((supplier: SupplierType | null) => {
    //     if (this.hydrating) return; // prevent overwriting while patching
    //     if (!(supplier && supplier && supplier.region)) return;
    //
    //     if (this.regions?.length) {
    //       const matchingRegion = this.regions.find((r) => r.id === supplier.region.id);
    //       if (matchingRegion) {
    //         this.receptionForm.patchValue({ region: matchingRegion }, { emitEvent: false });
    //         const currentParcel = this.receptionForm.get('parcel')!.value;
    //         if (!currentParcel || (typeof currentParcel === 'object' && !currentParcel.id)) {
    //           this.receptionForm.patchValue({ parcel: matchingRegion }, { emitEvent: false });
    //         }
    //       }
    //     } else {
    //       // regions not loaded yet: use raw object from supplier
    //       this.receptionForm.patchValue({ region: supplier.region }, { emitEvent: false });
    //       const currentParcel = this.receptionForm.get('parcel')!.value;
    //       if (!currentParcel || (typeof currentParcel === 'object' && !currentParcel.id)) {
    //         this.receptionForm.patchValue({ parcel: supplier.region }, { emitEvent: false });
    //       }
    //     }
    //   })
    // );

    // --- recompute net on weight changes ---
    this.subscriptions.push(this.receptionForm.get('poidsBrute')!.valueChanges.subscribe(() => this.recomputeNet()));
    this.subscriptions.push(this.receptionForm.get('poidsCamionVide')!.valueChanges.subscribe(() => this.recomputeNet()));

    // --- load Suppliers ---
    this.pendingCalls++;
    const supplierSub = this.supplierService.getAllSuppliers().subscribe({
      next: (res) => {
        this.suppliers = res.success ? res.data : [];
      },
      error: () => this.showToast(this.translate.instant('DELIVERIES.FORM.MESSAGES.LOAD_ERROR'), 'error'),
      complete: () => this.markCallDone()
    });
    this.subscriptions.push(supplierSub);

    // --- load existing deliveries (for numbering when creating) ---
    this.pendingCalls++;
    const deliveriesSub = this.deliveryService.getAllDeliveriesList().subscribe({
      next: (res) => {
        this.deliveries = res.success ? res.data : [];
        if (!this.isEditing) {
          const deliveryCount = this.deliveries.length;
          const maxLot = this.getMaxLotNumber();
          this.receptionForm.patchValue(
            {
              deliveryNumber: deliveryCount + 1,
              lotNumber: deliveryCount + 1
            },
            { emitEvent: false }
          );
        }
      },
      error: () => this.showToast(this.translate.instant('DELIVERIES.FORM.MESSAGES.LOAD_ERROR'), 'error'),
      complete: () => this.markCallDone()
    });
    this.subscriptions.push(deliveriesSub);

    // --- party label by operationType ---
    this.updatePartyLabel(this.receptionForm.get('operationType')?.value as OperationType);
    this.subscriptions.push(
      this.receptionForm.get('operationType')!.valueChanges.subscribe((op: OperationType) => {
        this.updatePartyLabel(op);
      })
    );

    // --- if editing, load the delivery and patch when both lookups are ready ---
    if (this.isEditing && deliveryId) {
      this.pendingCalls++;
      const editSub = this.deliveryService.getUnifiedDelivery(deliveryId).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const delivery = Array.isArray(res.data) ? res.data[0] : res.data;
            if (!this.regionsLoaded || !this.parcelsLoaded) {
              // wait for both datasets, then patch once
              this.pendingEditReception = delivery;
            } else {
              this.patchForm(delivery); // assumes patchForm uses emitEvent:false and resolves region/parcel by id
            }
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

    // --- other internal subscriptions you already have ---
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
  private recomputeNet(): void {
    const gross = this.num(this.receptionForm.get('poidsBrute')?.value) ?? 0;
    const empty = this.num(this.receptionForm.get('poidsCamionVide')?.value) ?? 0;

    // Clamp to >= 0
    const net = Math.max(gross - empty, 0);

    // Update disabled control without re-triggering valueChanges
    this.receptionForm.get('poidsNet')?.setValue(net, { emitEvent: false });
  }

  private num(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return isNaN(n) ? null : n;
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
       supplier: formValue.supplier || null,
      trtDate: formValue.trtDate ? new Date(formValue.trtDate) : null,
      oliveVariety: formValue.oliveVariety || null,
      sackCount: formValue.sackCount ? Number(formValue.sackCount) : 0,
      oliveType: formValue.oliveType || null,
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
      qualityControlResults: formValue.qualityControlResults || null,
      poidsCamionVide: formValue.poidsCamionVide || null
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

  displayFn<T extends { name: string; lastname: string }>(item: T): string {
    if (!item) return '';

    return item.name + ' ' + item.lastname;
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

  /** Updates both the field label (Supplier|Client) and the section title (Supplier & Region | Client & Region) */
  updatePartyLabel(opType: OperationType | null | undefined): void {
    const defaultField = 'OLIVE_RECEPTION.FORM.FIELDS.SUPPLIER';
    const fieldKey = opType ? (this.partyLabelByOp[opType] ?? defaultField) : defaultField;

    this.partyLabelKey = fieldKey;

    const isClient = fieldKey === 'OLIVE_RECEPTION.FORM.FIELDS.CLIENT';
    this.partyRegionSectionKey = isClient ? 'OLIVE_RECEPTION.FORM.SECTIONS.CLIENT_REGION' : 'OLIVE_RECEPTION.FORM.SECTIONS.SUPPLIER_REGION';
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

  openAddSupplierDialog(): void {
    const dialogRef = this.dialog.open(SupplierAddComponent, {
      width: '600px',
      data: {fromDialog: true}
    });

    dialogRef.afterClosed().subscribe((newSupplier) => {
      if (newSupplier) {
        this.suppliers = [...this.suppliers, newSupplier];
        this.receptionForm.get('supplier')?.setValue(newSupplier);
      }
    });
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

    console.log('patchForm delivery data:', d);
    console.log('Available regions:', this.regions);
    console.log('Available parcels:', this.parcels);
    console.log('Delivery region ID:', d.region?.id);
    console.log('Delivery parcel ID:', d.parcel?.id);

    const matchedRegion = this.regions.find((r) => r.id === d.region?.id) || null;
    const matchedParcel = this.parcels.find((r) => r.id === d.parcel?.id) || null;

    console.log('Matched region:', matchedRegion);
    console.log('Matched parcel:', matchedParcel);

    this.receptionForm.patchValue({
      ...d,
      deliveryDate: parseDate(d.deliveryDate),
      trtDate: parseDate(d.trtDate),
      region: matchedRegion,
      parcel: matchedParcel,
      poidsBrute: d.poidsBrute,
      poidsNet: d.poidsNet,
      matriculeCamion: d.matriculeCamion,
      supplier: matchedSupplier || null,
      oliveVariety: d.oliveVariety || null,
      sackCount: d.sackCount,
      oliveType: d.oliveType || null,
      operationType: d.operationType || null
    });

    // Manually trigger display update for region and parcel
    setTimeout(() => {
      if (matchedRegion && matchedRegion.name) {
        const regionInput = document.querySelector('input[formcontrolname="region"]');
        if (regionInput) {
          (regionInput as HTMLInputElement).value = matchedRegion.name;
        }
      }
      if (matchedParcel && matchedParcel.name) {
        const parcelInput = document.querySelector('input[formcontrolname="parcel"]');
        if (parcelInput) {
          (parcelInput as HTMLInputElement).value = matchedParcel.name;
        }
      }
    }, 100);

    // Log the final form values
    console.log('Final form values:', this.receptionForm.value);
  }

  // Setup form subscriptions
  private setupFormSubscriptions(): void {
    this.subscriptions.push(
      this.receptionForm.get('oliveType')!.valueChanges.subscribe((oliveType: Olive_Oil_Type | null) => {
        const deliveryNumber = this.receptionForm.get('deliveryNumber')?.value || this.deliveries.length + 1;
        const lotNumber = this.generateLotNumber(oliveType, deliveryNumber);
        this.receptionForm.patchValue({ lotNumber }, { emitEvent: false });
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
    // Enforce autocomplete selection for parcel
    this.receptionForm.get('parcel')!.valueChanges.subscribe((value) => {
      if (value && !this.parcels.some((r) => r.id === value.id)) {
        this.receptionForm.get('parcel')!.setValue(null);
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
      map((value) => this._filter(this.suppliers, value, 'name'))
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

  openAddRegionDialog(): void {
    const dialogRef = this.dialog.open(AddBasetypeComponent, {
      width: '500px',
      data: {fromDialog: true}
    });

    dialogRef.afterClosed().subscribe((newRegion: BaseType | undefined) => {
      if (newRegion) {
        this.regions = [...this.regions, newRegion];
        this.receptionForm.get('region')?.setValue(newRegion);

      }
    });
  }

  openAddParcelDialog(): void {
    const dialogRef = this.dialog.open(AddBasetypeComponent, {
      width: '500px',
      data: {type: 'PARCEL', fromDialog: true}
    });

    dialogRef.afterClosed().subscribe((newParcel: BaseType | undefined) => {
      if (newParcel) {
        this.parcels = [...this.parcels, newParcel];
        this.receptionForm.get('parcel')?.setValue(newParcel);

      }
    });
  }

  // Generate lot number based on olive type and delivery number
  private generateLotNumber(oliveType: Olive_Oil_Type | null, deliveryNumber: number): string {
    if (!oliveType) return '';
    const year = new Date().getFullYear().toString().slice(-2);
    const paddedNumber = deliveryNumber.toString().padStart(4, '0');
    return `${paddedNumber}${oliveType}${year}`;
  }

  // // Méthode pour forcer la mise à jour du composant BaseTypeComponent
  // private forceUpdateBaseTypeComponent(type: 'region' | 'parcel'): void {
  //   if (type === 'region' && this.regionComponent) {
  //     this.regionComponent.forceUpdate();
  //   } else if (type === 'parcel' && this.parcelComponent) {
  //     this.parcelComponent.forceUpdate();
  //   }


}
