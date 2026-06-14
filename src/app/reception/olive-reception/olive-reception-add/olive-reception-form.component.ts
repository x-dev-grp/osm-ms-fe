import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { SupplierAddComponent } from '../../suppliers/supplier-add/supplier-add.component';
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
import { ActivatedRoute, Data, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UnifiedDelivery } from '../../../shared/models/UnifiedDelivery';
import { BaseType } from '../../../shared/models/base-type';
import { SupplierType } from '../../../shared/models/supplier-type';
import { GenericTypeService } from '../../../shared/services/generic-type.service';
import { UnifiedDeliveryService } from '../../../shared/services/delivery.service';
import { SupplierTypeService } from '../../../shared/services/supplier.service';
import { TypeCategory } from '../../../shared/models/type-category.enum';
import { MatIcon } from '@angular/material/icon';
import { MatAutocomplete, MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { map, startWith } from 'rxjs/operators';
import { OperationType } from '../../../shared/models/operation-type.enum';
import { BaseTypeComponent } from '../../../shared/modules/base-type/base-type.component';
import { ToastService } from '../../../shared/services/toast.service';
import { CardComponent } from '../../../theme/components/card/card.component';
import { Olive_Oil_Type } from '../../../shared/models/olive-type.enum';
import { GenericTypeDialogComponent } from '../../../settings/generic-type/generic-type-dialog/generic-type-dialog.component';
import { MatDivider } from '@angular/material/divider';

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

// FIX: Type guard used in valueChanges to avoid touching typed strings
function isObjectWithId(value: unknown): value is { id: string | number } {
  return !!value && typeof value === 'object' && 'id' in (value as any) && (value as any).id != null;
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
    BaseTypeComponent,
    MatDivider
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

  /** Dynamic labels (party = Supplier|Client) */
  partyLabelKey = 'OLIVE_RECEPTION.FORM.FIELDS.SUPPLIER';
  partyRegionSectionKey = 'OLIVE_RECEPTION.FORM.SECTIONS.SUPPLIER_REGION';

  /** Operation types in the selector (will be filtered to single value when forced) */
  operationTypes: { name: string; value: OperationType }[] = [
    { name: 'EXCHANGE', value: OperationType.EXCHANGE },
    { name: 'SIMPLE_RECEPTION', value: OperationType.SIMPLE_RECEPTION },
    { name: 'BASE', value: OperationType.BASE },
    { name: 'OLIVE_PURCHASE', value: OperationType.OLIVE_PURCHASE }
  ];

  /** When true, the OPERATION_TYPE select is replaced with read-only display */
  opLocked = false;
  deliveries: UnifiedDelivery[] = [];
  // Autocomplete filtered options
  filteredRegions!: Observable<BaseType[]>;
  filteredSuppliers$!: Observable<SupplierType[]>;
  filteredOliveVarieties!: Observable<BaseType[]>;
  filteredOperationTypes!: Observable<BaseType[]>;
  protected readonly TypeCategory = TypeCategory;
  /** Operation type forced by router (data.op or :op) */
  private forcedOp?: OperationType;
  private hydrating = false;
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
    this.receptionForm.addControl('oliveType', new FormControl<Olive_Oil_Type | null>(null));
    this.receptionForm.addControl('oilType', new FormControl<Olive_Oil_Type | null>(null));
  }

  ngOnInit(): void {
    this.getRoutingData();
     const deliveryId = this.route.snapshot.paramMap.get('id');
    this.isEditing = deliveryId !== null && deliveryId !== 'new';
    const supplierCtrl = this.receptionForm.get('supplier')!;
    this.recomputeNet();
    this.loading = true;
    this.pendingCalls = 0;
    supplierCtrl.addValidators(this.requireSupplierSelection());

    this.filteredSuppliers$ = supplierCtrl.valueChanges.pipe(
      startWith(''),
      map((val) => (typeof val === 'string' ? val : this.displayFn(val))),
      map((text) => {
        const q = (text ?? '').trim().toLowerCase();
        if (!q) return this.suppliers ?? [];
        return (this.suppliers ?? []).filter((s) => this.containsSupplier(s, q));
      })
    );
    // --- load Regions ---
    this.pendingCalls++;
    const regionSub = this.genericTypeService.getAllTypes(TypeCategory.REGION).subscribe({
      next: (res) => {
        this.regions = res.success ? res.data : [];
        this.regionsLoaded = true;
        if (this.pendingEditReception && this.regionsLoaded && this.parcelsLoaded) {
          this.patchForm(this.pendingEditReception);
          this.pendingEditReception = null;
        }
      },
      error: () => this.showToast(this.translate.instant('xDELIVERIES.FORM.MESSAGES.LOAD_ERROR'), 'error'),
      complete: () => this.markCallDone()
    });
    this.subscriptions.push(regionSub);

    // --- load Parcels ---
    this.pendingCalls++;
    const parcelsSub = this.genericTypeService.getAllTypes(TypeCategory.PARCEL).subscribe({
      next: (res) => {
        this.parcels = res.success ? res.data : [];
        this.parcelsLoaded = true;
        if (this.pendingEditReception && this.regionsLoaded && this.parcelsLoaded) {
          this.patchForm(this.pendingEditReception);
          this.pendingEditReception = null;
        }
      },
      error: () => this.showToast(this.translate.instant('DELIVERIES.FORM.MESSAGES.LOAD_ERROR'), 'error'),
      complete: () => this.markCallDone()
    });
    this.subscriptions.push(parcelsSub);

    // recompute net on weight changes
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
        this.deliveries = res?.success ? (res.data ?? []) : [];
        if (!this.isEditing) {
          const nextNumber = this.nextFreeNumber(this.deliveries.map((d) => d.deliveryNumber));
          this.receptionForm.patchValue({ deliveryNumber: nextNumber, lotNumber: nextNumber }, { emitEvent: false });
        }
      },
      error: () => this.showToast(this.translate.instant('DELIVERIES.FORM.MESSAGES.LOAD_ERROR'), 'error'),
      complete: () => this.markCallDone()
    });
    this.subscriptions.push(deliveriesSub);

    // party label by operationType (watch form control)
    this.updatePartyLabel(this.receptionForm.get('operationType')?.value as OperationType);
    this.subscriptions.push(
      this.receptionForm.get('operationType')!.valueChanges.subscribe((op: OperationType) => {
        this.updatePartyLabel(op);
      })
    );

    // If editing, load entity then patch (after lookups loaded)
    if (this.isEditing && deliveryId) {
      this.pendingCalls++;
      const editSub = this.deliveryService.getUnifiedDelivery(deliveryId).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const delivery = Array.isArray(res.data) ? res.data[0] : res.data;
            if (!this.regionsLoaded || !this.parcelsLoaded) {
              this.pendingEditReception = delivery;
            } else {
              this.patchForm(delivery);
            }
          } else {
            this.errorMessage = this.translate.instant('DELIVERIES.FORM.MESSAGES.RECEPTION_LOAD_ERROR');
            this.router.navigate([`/reception/reception-olive/${this.forcedOp?.toLowerCase()}`]);
          }
        },
        error: () => {
          this.errorMessage = this.translate.instant('DELIVERIES.FORM.MESSAGES.RECEPTION_LOAD_ERROR');
          this.router.navigate([`/reception/reception-olive/${this.forcedOp?.toLowerCase()}`]);
        },
        complete: () => this.markCallDone()
      });
      this.subscriptions.push(editSub);
    }

    // other internal subscriptions
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  /// Only change the value when the user selects
  onSupplierSelected(ev: MatAutocompleteSelectedEvent) {
    const selected: SupplierType = ev.option.value;
    const ctrl = this.receptionForm.get('supplier')!;
    ctrl.setValue(selected);
    ctrl.updateValueAndValidity();
  }

  // Enter commits the highlighted option (if any); otherwise do nothing
  selectActiveOption(auto: MatAutocomplete, trig: any) {
    const active = auto.options?.find((o) => o.active);
    if (active) {
      active.select(); // triggers onSupplierSelected
      trig.closePanel();
    }
  }

  // Blur does NOT auto-select or clear. We just mark touched so validation can show.
  markSupplierTouched() {
    const ctrl = this.receptionForm.get('supplier')!;
    ctrl.markAsTouched();
    ctrl.updateValueAndValidity({ onlySelf: true });
  }

  // Save or update the reception
  async saveReception(): Promise<void> {
    if (this.receptionForm.invalid) {
      this.showToast(this.translate.instant('DELIVERIES.FORM.VALIDATION.FILL_REQUIRED'), 'warning');
      return;
    }

    const formValue = this.receptionForm.getRawValue();

    if (!formValue.region?.id) {
      this.showToast(this.translate.instant('DELIVERIES.FORM.VALIDATION.INVALID_REGION'), 'warning');
      return;
    }
    if (!formValue.supplier?.id) {
      this.showToast(this.translate.instant('DELIVERIES.FORM.VALIDATION.INVALID_SUPPLIER'), 'warning');
      return;
    }

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
      operationType: (this.forcedOp ?? formValue.operationType) || null,
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
        // Navigate back to the op-specific list if available
         if (this.forcedOp) {
          this.router.navigate([`/reception/reception-olive/${this.forcedOp?.toLowerCase()}`]);
        } else {
          this.router.navigate(['/reception/reception-olive']);
        }
      } else {
        const errorMessage = response?.message || this.translate.instant('DELIVERIES.FORM.MESSAGES.OPERATION_FAILED');
        this.showToast(errorMessage, 'error');
      }
    } catch (error: unknown) {
      let errorMessage = this.translate.instant(
        this.isEditing ? 'DELIVERIES.FORM.MESSAGES.UPDATE_ERROR' : 'DELIVERIES.FORM.MESSAGES.SAVE_ERROR'
      );

      if (error && typeof error === 'object' && 'status' in error && (error as any).status === 400) {
        const errorObj = error as { error?: { message?: string } };
        errorMessage = errorObj.error?.message || this.translate.instant('DELIVERIES.FORM.MESSAGES.VALIDATION_ERROR');
      }

      this.showToast(errorMessage, 'error');
      console.error('Save error:', error);
    } finally {
      this.loading = false;
    }
  }

  // Navigate back to the op-specific list (if forced), else general route
  resetForm(): void {
       this.router.navigate([`/reception/reception-olive/${this.forcedOp?.toLowerCase()}`]);

  }

  // FIX: accept string | object to play nice while typing
  displayFn = (val: SupplierType | string | null): string =>
    !val ? '' : typeof val === 'string' ? val : `${val.name ?? ''} ${val.lastname ?? ''}`.trim();

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

  openAddSupplierDialog(): void {
    const dialogRef = this.dialog.open(SupplierAddComponent, SupplierAddComponent.dialogConfig);

    dialogRef.afterClosed().subscribe((newSupplier) => {
      if (newSupplier) {
        this.suppliers = [...this.suppliers, newSupplier];
        const supplierCtrl = this.receptionForm.get('supplier');
        supplierCtrl?.setValue(newSupplier);
        supplierCtrl?.updateValueAndValidity();
      }
    });
  }

  openAddRegionDialog(): void {
    const dialogRef = this.dialog.open(GenericTypeDialogComponent, {
      width: '500px',
      data: { initialType: TypeCategory.REGION, fromDialog: true }
    });

    dialogRef.afterClosed().subscribe((newRegion: BaseType | undefined) => {
      if (newRegion) {
        this.regions = [...this.regions, newRegion];
        this.receptionForm.get('region')?.setValue(newRegion);
      }
    });
  }

  openAddParcelDialog(): void {
    const dialogRef = this.dialog.open(GenericTypeDialogComponent, {
      width: '500px',
      data: { initialType: TypeCategory.PARCEL, fromDialog: true }
    });

    dialogRef.afterClosed().subscribe((newParcel: BaseType | undefined) => {
      if (newParcel) {
        this.parcels = [...this.parcels, newParcel];
        this.receptionForm.get('parcel')?.setValue(newParcel);
      }
    });
  }

  private getRoutingData(): void {
    this.route.data.subscribe((d: Data) => {
      this.forcedOp=d?.['op'];
       this.receptionForm.get('operationType')?.setValue(this.forcedOp);
    });
  }


  private nextFreeNumber(nums: Array<number | string>): number {
    const used = new Set(nums.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n > 0));
    let i = 1;
    while (used.has(i)) i++;
    return i;
  }

  // Validator that enforces: control must contain a SupplierType object (not a string)
  private requireSupplierSelection() {
    return (ctrl: import('@angular/forms').AbstractControl) => {
      const v = ctrl.value;
      const isObjectSelected = v && typeof v === 'object';
      return isObjectSelected ? null : { selectionRequired: true };
    };
  }

  // Case-insensitive "contains" check on name or lastname
  private containsSupplier(s: SupplierType, q: string): boolean {
    const n = (s.name ?? '').toLowerCase();
    const l = (s.lastname ?? '').toLowerCase();
    return n.includes(q) || l.includes(q);
  }

  private recomputeNet(): void {
    const gross = this.num(this.receptionForm.get('poidsBrute')?.value) ?? 0;
    const empty = this.num(this.receptionForm.get('poidsCamionVide')?.value) ?? 0;
    const net = Math.max(gross - empty, 0);
    this.receptionForm.get('poidsNet')?.setValue(net, { emitEvent: false });
  }

  private num(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return isNaN(n) ? null : n;
  }

  /** Décrémente le compteur et cache le spinner quand tout est terminé */
  private markCallDone(): void {
    this.pendingCalls--;
    if (this.pendingCalls === 0) {
      this.loading = false;
      // Les filtres autocomplete dépendent des listes chargées :
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
    const matchedRegion = this.regions.find((r) => r.id === d.region?.id) || null;
    const matchedParcel = this.parcels.find((r) => r.id === d.parcel?.id) || null;

    // If route forces op, prefer that; else use the entity's operationType
    const opToApply = this.forcedOp ?? d.operationType ?? null;

    this.receptionForm.patchValue(
      {
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
        operationType: opToApply,
        status: d.status || null
      },
      { emitEvent: false }
    );

    // If op is forced, keep control disabled & selector filtered
    if (this.forcedOp) {
      const found = this.operationTypes.find((t) => t.value === this.forcedOp);
      if (found) this.operationTypes = [found];
      this.receptionForm.get('operationType')?.disable({ emitEvent: false });
      this.opLocked = true;
      this.updatePartyLabel(this.forcedOp);
    }
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

    // FIX: DO NOT null-out on each keystroke. Only react when supplier is an object (selected).
    this.subscriptions.push(
      this.receptionForm.get('supplier')!.valueChanges.subscribe((supplier: SupplierType | string | null) => {
        if (supplier && typeof supplier === 'object' && (supplier as SupplierType).region) {
          const reg = (supplier as SupplierType).region!;
          const match = this.regions.find((r) => r.id === reg.id) || reg;
          this.receptionForm.patchValue({ region: match }, { emitEvent: false });
        }
      })
    );

    // Guard region/parcel handlers to avoid touching typed strings
    this.subscriptions.push(
      this.receptionForm.get('region')!.valueChanges.subscribe((value) => {
        if (isObjectWithId(value)) {
          if (!this.regions.some((r) => r.id === (value as any).id)) {
            this.receptionForm.get('region')!.setValue(null);
          }
        }
      })
    );

    this.subscriptions.push(
      this.receptionForm.get('parcel')!.valueChanges.subscribe((value) => {
        if (isObjectWithId(value)) {
          if (!this.parcels.some((r) => r.id === (value as any).id)) {
            this.receptionForm.get('parcel')!.setValue(null);
          }
        }
      })
    );
  }

  private setupAutocompleteFilters(): void {
    // Region filter
    this.filteredRegions = this.receptionForm.get('region')!.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(this.regions, value, 'name'))
    );

    // Supplier filter with object/string safety
    this.filteredSuppliers$ = this.receptionForm.get('supplier')!.valueChanges.pipe(
      startWith(''),
      map((val) => (typeof val === 'string' ? val : this.displayFn(val))),
      map((text) => {
        const q = (text ?? '').toLowerCase();
        return this.suppliers.filter((s) => `${s.name ?? ''} ${s.lastname ?? ''}`.toLowerCase().includes(q));
      })
    );

    // Operation type filter (mostly moot when locked)
    this.filteredOperationTypes = this.receptionForm.get('operationType')!.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(this.operationTypes as any, value as any, 'name'))
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
      const fieldValue = this._getNestedValue(item as any, displayField);
      return fieldValue?.toLowerCase().includes(filterValue);
    });
  }

  // Generate lot number based on olive type and delivery number
  private generateLotNumber(oliveType: Olive_Oil_Type | null, deliveryNumber: number): string {
    if (!oliveType) return '';
    const year = new Date().getFullYear().toString().slice(-2);
    const paddedNumber = deliveryNumber.toString().padStart(4, '0');
    return `${paddedNumber}${oliveType}${year}`;
  }
}
