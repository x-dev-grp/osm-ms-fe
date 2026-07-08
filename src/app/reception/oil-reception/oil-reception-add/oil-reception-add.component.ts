import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, startWith, Subscription } from 'rxjs';
import { BaseType } from '../../../shared/models/base-type';
import { SupplierType } from '../../../shared/models/supplier-type';
import { deliveryType } from '../../../shared/models/deleveryType';
import { UnifiedDelivery } from '../../../shared/models/UnifiedDelivery';
import { GenericTypeService } from '../../../shared/services/generic-type.service';
import { SupplierTypeService } from '../../../shared/services/supplier.service';
import { UnifiedDeliveryService } from '../../../shared/services/delivery.service';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIcon } from '@angular/material/icon';
import { StorageUnitDtoService } from '../../../shared/services/storage.service';
import { OliveLotStatus } from '../../../shared/models/OliveLotStatus';
import { MatAutocomplete, MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OperationType } from '../../../shared/models/operation-type.enum';
import { BaseTypeComponent } from '../../../shared/modules/base-type/base-type.component';
import { ToastService } from '../../../shared/services/toast.service';
import { Olive_Oil_Type } from '../../../shared/models/olive-type.enum';
import { TypeCategory } from '../../../shared/models/type-category.enum';
import { SupplierAddComponent } from '../../suppliers/supplier-add/supplier-add.component';
import { MatDialog } from '@angular/material/dialog';
import { GenericTypeDialogComponent } from '../../../settings/generic-type/generic-type-dialog/generic-type-dialog.component';
import { map } from 'rxjs/operators';
import { TunisianPlateMaskDirective } from '../../../shared/directives/tunisian-plate-mask.directive';
import { tunisianPlateRequiredValidators } from '../../../shared/validators/tunisian-plate.validator';
import { normalizeTunisianPlate, TUNISIAN_VEHICLE_PLATE_EXAMPLE } from '../../../shared/utils/tunisian-plate.util';

// Validator for net weight not exceeding gross weight
const netNotGreaterThanGross = (control: AbstractControl): ValidationErrors | null => {
  const brut = control.get('poidsBrute')?.value;
  const net = control.get('poidsNet')?.value; // Changed from poidsNet to oilQuantity
  return brut != null && net != null && net > brut ? { netGreater: true } : null;
};

// Helper to check if value is a valid object from the list
function isValidSelection<T extends { id?: string }>(value: unknown, list: T[]): boolean {
  return !!value && typeof value === 'object' && 'id' in value && list.some((item) => item.id && item.id === (value as T).id);
}

@Component({
  selector: 'app-oil-reception-form',
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
    MatIcon,
    MatAutocompleteModule,
    TranslateModule,
    BaseTypeComponent,
    TunisianPlateMaskDirective
  ],
  templateUrl: './oil-reception-add.component.html',
  styleUrls: ['./oil-reception-add.component.scss']
})
export class OilReceptionFormComponent implements OnInit, OnDestroy {
  loading = false;
  isEditing = false;
  errorMessage: string | null = null;
  receptionForm: FormGroup;
  suppliers: SupplierType[] = [];
  oilVariety: BaseType[] = [];
  operationTypes: { value: OperationType; label: string }[] = [];
  olive_oil_Options = Object.values(Olive_Oil_Type);
  regions: BaseType[] = [];
  parcels: BaseType[] = [];
  partyLabelKey = 'OLIVE_RECEPTION.FORM.FIELDS.SUPPLIER';
  partyRegionSectionKey = 'OLIVE_RECEPTION.FORM.SECTIONS.SUPPLIER_REGION';
  filteredSuppliers$: Observable<SupplierType[]>;
  protected readonly TypeCategory = TypeCategory;
  protected readonly platePlaceholder = TUNISIAN_VEHICLE_PLATE_EXAMPLE;
  private pendingCalls = 0; // Compteur de requêtes HTTP en cours
  private subscriptions: Subscription[] = [];
  private deliveryId: string | null;
  private pendingEditReception: UnifiedDelivery | null = null;
  private _typeSubs: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private genericSrv: GenericTypeService,
    private supplierSrv: SupplierTypeService,
    private deliverySrv: UnifiedDeliveryService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private storageService: StorageUnitDtoService,
    private router: Router,
    public translate: TranslateService,
    private dialog: MatDialog
  ) {
    this.receptionForm = this.fb.group(
      {
        id: [null],
        deliveryType: [{ value: 'OIL', disabled: true }, Validators.required],
        deliveryNumber: [{ value: '', disabled: true }, Validators.required],
        lotNumber: [{ value: '', disabled: true }, Validators.required],
        deliveryDate: [new Date(), Validators.required],
        region: [null, Validators.required],
        supplier: [null, Validators.required],
        matriculeCamion: ['', tunisianPlateRequiredValidators],
        poidsBrute: [null],
        poidsNet: [0, [Validators.min(0)]],
        oilQuantity: [0, [Validators.min(0)]],
        oilVariety: [null],
        oilType: [null, Validators.required],
        sackCount: this.fb.control(0, { validators: [Validators.min(0)] }),
        parcel: [null],
        globalLotNumber: [''],
        operationType: [OperationType.OIL_PURCHASE, Validators.required]
      },
      { validators: [netNotGreaterThanGross] }
    );
  }

  ngOnInit(): void {
    this.loading = true;
    this.deliveryId = this.route.snapshot.paramMap.get('id');
    this.isEditing = this.deliveryId !== null && this.deliveryId !== 'new';
    // 1) S'assurer que les contrôles existent

    if (!this.receptionForm.get('oilType')) {
      this.receptionForm.addControl('oilType', new FormControl<Olive_Oil_Type | null>(null, Validators.required));
    }
    const supplierCtrl = this.receptionForm.get('supplier')!;

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
    // Load regions for the BaseTypeComponent
    this.pendingCalls++;
    const regionSub = this.genericSrv.getAllTypes(TypeCategory.REGION).subscribe({
      next: (res) => {
        this.regions = res.success ? res.data : [];
      },
      error: () => {
        this.toast.error('AUTO.ERREUR_CHARGEMENT_REGIONS');
      },
      complete: () => this.markCallDone()
    });
    this.subscriptions.push(regionSub);

    // Load parcels for the BaseTypeComponent
    this.pendingCalls++;
    const parcelSub = this.genericSrv.getAllTypes(TypeCategory.PARCEL).subscribe({
      next: (res) => {
        this.parcels = res.success ? res.data : [];
      },
      error: () => {
        this.toast.error('AUTO.ERREUR_CHARGEMENT_PARCELS');
      },
      complete: () => this.markCallDone()
    });
    this.subscriptions.push(parcelSub);
    // Automatically set region when supplier is selected
    this.subscriptions.push(
      this.receptionForm.get('supplier')!.valueChanges.subscribe((supplier: SupplierType | null) => {
        if (supplier && supplier.region) {
          this.receptionForm.patchValue({ region: supplier.region });
        }
      })
    );

    // ===== 1️⃣  Charger les fournisseurs =====
    this.pendingCalls++;
    const suppliersSub = this.supplierSrv.getAllSuppliers().subscribe({
      next: (res) => {
        this.suppliers = res.success ? res.data : [];
        // Si on a une édition en attente, patcher le formulaire maintenant
        if (this.pendingEditReception) {
          this.patchForm(this.pendingEditReception);
          this.pendingEditReception = null;
        }
      },
      error: () => {
        this.toast.error('AUTO.ERREUR_CHARGEMENT_FOURNISSEURS');
      },
      complete: () => this.markCallDone()
    });
    this.subscriptions.push(suppliersSub);
    const c = this.receptionForm.get('sackCount');
    c?.valueChanges.subscribe((v: any) => {
      if (v === '' || v === null || Number.isNaN(Number(v))) {
        c.setValue(0, { emitEvent: false });
      }
    });
    // ===== 2️⃣  Next delivery/lot numbers (create mode) =====
    if (!this.isEditing) {
      this.pendingCalls++;
      const numbersSub = this.deliverySrv.getNextDeliveryNumbers(deliveryType.OIL).subscribe({
        next: (res) => this.applyNextNumbers(res),
        error: () => this.toast.error('AUTO.ERREUR_CHARGEMENT_RECEPTIONS'),
        complete: () => this.markCallDone()
      });
      this.subscriptions.push(numbersSub);
    }

    // ===== 3️⃣  Si édition, charger la réception à modifier =====
    if (this.isEditing && this.deliveryId) {
      this.pendingCalls++;
      const editSub = this.deliverySrv.getUnifiedDelivery(this.deliveryId).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const deliveryObj = Array.isArray(res.data) ? res.data[0] : res.data;
            // Si les suppliers ne sont pas encore chargés, stocke temporairement
            if (!this.suppliers.length) {
              this.pendingEditReception = deliveryObj;
            } else {
              this.patchForm(deliveryObj);
            }
          } else {
            this.errorMessage = this.translate.instant('AUTO.ERREUR_LORS_DU_CHARGEMENT_DE_LA_RECEPTION');
            this.router.navigate(['/reception-huile']);
          }
        },
        error: () => {
          this.errorMessage = this.translate.instant('AUTO.ERREUR_LORS_DU_CHARGEMENT_DE_LA_RECEPTION');
          this.router.navigate(['/reception-huile']);
        },
        complete: () => this.markCallDone()
      });
      this.subscriptions.push(editSub);
    }

    // ===== 4️⃣  Initialiser les types d'opération & abonnements =====
    this.operationTypes = [
      {
        value: OperationType.OIL_PURCHASE,
        label: 'OIL_RECEPTION.ADD.FIELDS.OPERATION_TYPE_PURCHASE'
      },
      { value: OperationType.SIMPLE_RECEPTION, label: 'OIL_RECEPTION.ADD.FIELDS.OPERATION_TYPE_RECEPTION' }
    ];
    this.setupFormSubscriptions();

    // Par défaut (création) on pré‑sélectionne l'opération OIL_PURCHASE
    if (!this.isEditing) {
      this.receptionForm.patchValue({ operationType: OperationType.OIL_PURCHASE });
    }

    // Si aucune requête n'était nécessaire (cas création sans édition)
    if (this.pendingCalls === 0) {
      this.loading = false;
    }
  }

  displayFn(item: SupplierType | string | null): string {
    if (!item || typeof item === 'string') return item ?? '';
    return `${item.name ?? ''} ${item.lastname ?? ''}`.trim();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  save(): void {
    if (this.receptionForm.invalid) {
      if (this.receptionForm.hasError('exceedsCapacity')) {
        this.translate.get('OIL_RECEPTION.ADD.ERRORS.EXCEEDS_CAPACITY').subscribe((message) => {
          this.toast.warning(message);
        });
      } else {
        this.translate.get('OIL_RECEPTION.ADD.MESSAGES.ERROR.INCOMPLETE_FORM').subscribe((message) => {
          this.toast.warning(message);
        });
      }
      return;
    }

    const formValue = this.receptionForm.getRawValue();

    // Validate required references
    if (!formValue.region?.id) {
      this.toast.warning(this.translate.instant('DELIVERIES.FORM.VALIDATION.INVALID_REGION'));
      return;
    }
    if (!formValue.supplier?.id) {
      this.toast.warning(this.translate.instant('DELIVERIES.FORM.VALIDATION.INVALID_SUPPLIER'));
      return;
    }

    const v = this.receptionForm.get('sackCount')?.value as any;
    if (v === '' || v === null || Number.isNaN(Number(v))) {
      this.receptionForm.get('sackCount')?.setValue(0, { emitEvent: false });
    }

    const payload = {
      id: this.isEditing && this.deliveryId ? this.deliveryId : '',
      deliveryNumber: formValue.deliveryNumber || '',
      deliveryType: 'OIL',
      lotNumber: formValue.lotNumber || '',
      deliveryDate: formValue.deliveryDate ? new Date(formValue.deliveryDate) : new Date(),
      region: formValue.region || null,
      poidsBrute: Number(formValue.poidsBrute) || 0,
      poidsNet: Number(formValue.poidsNet) || 0,
      matriculeCamion: normalizeTunisianPlate(formValue.matriculeCamion) || '',
      supplier: formValue.supplier || null,
      globalLotNumber: formValue.globalLotNumber || null,
      oilVariety: formValue.oilVariety || null,
      oilQuantity: Number(formValue.poidsNet) || 0,
      unitPrice: Number(formValue.unitPrice) || 0,
      price: Number(formValue.price) || 0,
      paidAmount: Number(formValue.paidAmount) || 0,
      unpaidAmount: Number(formValue.unpaidAmount) || 0,
      oilType: this.receptionForm.value.oilType, // 'HB' | 'HC'
      oliveType: this.receptionForm.value.oilType, // 'HB' | 'HC'
      trtDate: formValue.trtDate ? new Date(formValue.trtDate) : null,
      operationType: formValue.operationType || OperationType.OIL_PURCHASE,
      oliveVariety: formValue.oliveVariety || null,
      sackCount: Number(formValue.sackCount) || 0,
      status: OliveLotStatus.NEW,
      rendement: Number(formValue.rendement) || 0,
      oliveQuantity: Number(formValue.oliveQuantity) || 0,
      parcel: formValue.parcel || null,
      storageUnit: formValue.storageUnit || null,
      qualityControlResults: formValue.qualityControlResults || null
    } as UnifiedDelivery;

    const op = this.isEditing
      ? this.deliverySrv.updateUnifiedDelivery(payload).toPromise()
      : this.deliverySrv.createUnifiedDelivery(payload).toPromise();

    this.loading = true;
    op.then((res) => {
      if (res?.success) {
        this.translate
          .get(this.isEditing ? 'OIL_RECEPTION.ADD.MESSAGES.SUCCESS.UPDATE' : 'OIL_RECEPTION.ADD.MESSAGES.SUCCESS.ADD')
          .subscribe((message) => {
            this.toast.success(message);
            this.router.navigate(['/reception/reception-huile']);
          });
      } else {
        this.translate.get('OIL_RECEPTION.ADD.MESSAGES.ERROR.' + (this.isEditing ? 'UPDATE' : 'ADD')).subscribe((message) => {
          this.toast.error(message);
        });
      }
    })
      .catch(() => {
        this.translate.get('CONTROLE_QUALITE.MESSAGES.ERROR.LOAD').subscribe((message) => {
          this.toast.error(message);
        });
      })
      .finally(() => (this.loading = false));
  }

  resetForm(): void {
    this.router.navigate(['/reception/reception-huile']);
  }

  validateSupplier(): void {
    const value = this.receptionForm.get('supplier')!.value;
    if (
      !(value && typeof value === 'object' && 'id' in value) ||
      !this.suppliers.some((s) => s.id && s.id === (value as SupplierType).id)
    ) {
      this.receptionForm.get('supplier')!.setValue(null);
    }
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

  // Case-insensitive "contains" check on name or lastname
  private containsSupplier(s: SupplierType, q: string): boolean {
    const n = (s.name ?? '').toLowerCase();
    const l = (s.lastname ?? '').toLowerCase();
    return n.includes(q) || l.includes(q);
  }

  private applyNextNumbers(res: { success?: boolean; data?: { deliveryNumber: string; lotNumber: string } }): void {
    if (res?.success && res.data) {
      this.receptionForm.patchValue(
        {
          deliveryNumber: res.data.deliveryNumber,
          lotNumber: res.data.lotNumber
        },
        { emitEvent: false }
      );
    }
  }

  // single place to wire autocomplete filtering (supplier typing)
  private setupAutocompleteFilters(): void {
    this.filteredSuppliers$ = this.receptionForm.get('supplier')!.valueChanges.pipe(
      startWith(''),
      // while typing, control emits a string; when selected, emits SupplierType
      map((val) => (typeof val === 'string' ? val : this.displayFn(val))),
      map((text) => {
        const q = (text ?? '').toLowerCase();
        return this.suppliers.filter((s) => `${s.name ?? ''} ${s.lastname ?? ''}`.toLowerCase().includes(q));
      })
    );
  }

  // ensure we build the autocomplete streams only after lists are loaded
  private markCallDone(): void {
    this.pendingCalls--;
    if (this.pendingCalls === 0) {
      this.loading = false;
      // suppliers/regions must be loaded before wiring filters
      this.setupAutocompleteFilters();
    }
  }

  // patch with matched objects by id; avoid manual DOM pokes
  private patchForm(d: UnifiedDelivery): void {
    const parseDate = (v: string | Date | null | undefined): Date | null => (!v ? null : v instanceof Date ? v : new Date(v));

    const matchedSupplier = this.suppliers.find((s) => s.id?.toString() === d.supplier?.id?.toString()) || null;
    const matchedRegion = this.regions.find((r) => r.id === d.region?.id) || null;
    const matchedParcel = this.parcels.find((r) => r.id === d.parcel?.id) || null;

    this.receptionForm.patchValue(
      {
        ...d,
        deliveryDate: parseDate(d.deliveryDate),
        trtDate: parseDate(d.trtDate),
        supplier: matchedSupplier,
        region: matchedRegion,
        parcel: matchedParcel,
        matriculeCamion: normalizeTunisianPlate(d.matriculeCamion)
        // (leave the rest of your fields as-is)
      },
      { emitEvent: false }
    );
  }

  private setupFormSubscriptions(): void {
    this.subscriptions.push(
      this.receptionForm.get('oilType')!.valueChanges.subscribe(() => {
        if (!this.isEditing) {
          const deliveryNumber = this.receptionForm.get('deliveryNumber')?.value;
          if (deliveryNumber != null && deliveryNumber !== '') {
            this.receptionForm.patchValue({ lotNumber: String(deliveryNumber) }, { emitEvent: false });
          }
        }
      })
    );

    // when a real Supplier object is selected, mirror its region
    this.subscriptions.push(
      this.receptionForm.get('supplier')!.valueChanges.subscribe((supplier: SupplierType | string | null) => {
        if (supplier && typeof supplier === 'object' && (supplier as SupplierType).region) {
          const reg = (supplier as SupplierType).region!;
          const match = this.regions.find((r) => r.id === reg.id) || reg;
          this.receptionForm.patchValue({ region: match }, { emitEvent: false });
        }
      })
    );

    // guard region/parcel streams — ignore while user is typing (string)
    this.subscriptions.push(
      this.receptionForm.get('region')!.valueChanges.subscribe((value: any) => {
        if (value && typeof value === 'object' && 'id' in value) {
          if (!this.regions.some((r) => r.id === value.id)) {
            this.receptionForm.get('region')!.setValue(null);
          }
        }
      })
    );
    this.subscriptions.push(
      this.receptionForm.get('parcel')!.valueChanges.subscribe((value: any) => {
        if (value && typeof value === 'object' && 'id' in value) {
          if (!this.parcels.some((r) => r.id === value.id)) {
            this.receptionForm.get('parcel')!.setValue(null);
          }
        }
      })
    );
  }

  // Validator that enforces: control must contain a SupplierType object (not a string)
  private requireSupplierSelection() {
    return (ctrl: import('@angular/forms').AbstractControl) => {
      const v = ctrl.value;
      const isObjectSelected = v && typeof v === 'object';
      return isObjectSelected ? null : { selectionRequired: true };
    };
  }
}
