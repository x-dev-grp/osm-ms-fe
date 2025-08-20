import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs';
import {BaseType} from '../../../../shared/models/base-type';
import {SupplierType} from '../../../../shared/models/supplier-type';
import {UnifiedDelivery} from '../../../../shared/models/UnifiedDelivery';
import {GenericTypeService} from '../../../../shared/services/generic-type.service';
import {SupplierTypeService} from '../../../../shared/services/supplier.service';
import {UnifiedDeliveryService} from '../../../../shared/services/delivery.service';
import {
  AbstractControl,
  FormBuilder, FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {CardComponent} from '../../../../theme/components/card/card.component';
import {MatIcon} from '@angular/material/icon';
import {StorageUnitDtoService} from '../../../../shared/services/storage.service';
import {OliveLotStatus} from '../../../../shared/models/OliveLotStatus';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {OperationType} from '../../../../shared/models/operation-type.enum';
import {BaseTypeComponent} from '../../../../shared/modules/base-type/base-type.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { OliveType } from '../../../../shared/models/olive-type.enum';
import { OilType } from '../../../../shared/models/oil-type.enum';
import { mapOilFromOlive, mapOliveFromOil } from '../../../../shared/models/olive-oil-type.util';

// Validator for net weight not exceeding gross weight
const netNotGreaterThanGross = (control: AbstractControl): ValidationErrors | null => {
  const brut = control.get('poidsBrut')?.value;
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
    CardComponent,
    MatIcon,
    MatAutocompleteModule,
    TranslateModule,
    BaseTypeComponent
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
  deliveries: UnifiedDelivery[] = [];
  operationTypes: { value: OperationType; label: string }[] = [];
  private pendingCalls = 0; // Compteur de requêtes HTTP en cours
  private subscriptions: Subscription[] = [];
  private deliveryId: string | null;
  private pendingEditReception: UnifiedDelivery | null = null;
  private _typeSubs: Subscription[] = [];
  oliveOptions = Object.values(OliveType);
  oilOptions = Object.values(OilType);
  constructor(
    private fb: FormBuilder,
    private genericSrv: GenericTypeService,
    private supplierSrv: SupplierTypeService,
    private deliverySrv: UnifiedDeliveryService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private storageService: StorageUnitDtoService,
    private router: Router,
    public translate: TranslateService
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
        matriculeCamion: ['', Validators.required],
        etatCamion: ['', Validators.required],
        poidsBrute: [0, [Validators.min(0)]],
        poidsNet: [0, [Validators.min(0)]],
        oilQuantity: [0, [Validators.min(0)]],
        oilVariety: [null, Validators.required],
        oilType: [null, Validators.required],
        parcel: [null, Validators.required],
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
// 1) S’assurer que les contrôles existent
    if (!this.receptionForm.get('oliveType')) {
      this.receptionForm.addControl('oliveType', new FormControl<OliveType | null>(null, Validators.required));
    }
    if (!this.receptionForm.get('oilType')) {
      this.receptionForm.addControl('oilType', new FormControl<OilType | null>(null, Validators.required));
    }

// 2) Synchro olive -> oil
    this._typeSubs.push(
      this.receptionForm.get('oliveType')!.valueChanges.subscribe((val: OliveType | null) => {
        const mapped = mapOilFromOlive(val);
        this.receptionForm.get('oilType')!.setValue(mapped, { emitEvent: false });
      })
    );

// 3) Synchro oil -> olive
    this._typeSubs.push(
      this.receptionForm.get('oilType')!.valueChanges.subscribe((val: OilType | null) => {
        const mapped = mapOliveFromOil(val);
        this.receptionForm.get('oliveType')!.setValue(mapped, { emitEvent: false });
      })
    );

// 4) Initialisation: si l’un des deux est déjà rempli (édition), déduire l’autre
    const oliveInit = this.receptionForm.get('oliveType')!.value as OliveType | null;
    const oilInit   = this.receptionForm.get('oilType')!.value as OilType   | null;

    if (oliveInit && !oilInit) {
      this.receptionForm.get('oilType')!.setValue(mapOilFromOlive(oliveInit), { emitEvent: false });
    } else if (oilInit && !oliveInit) {
      this.receptionForm.get('oliveType')!.setValue(mapOliveFromOil(oilInit), { emitEvent: false });
    }
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
        this.toast.error('Erreur chargement fournisseurs');
      },
      complete: () => this.markCallDone()
    });
    this.subscriptions.push(suppliersSub);

    // ===== 2️⃣  Charger la liste des réceptions =====
    this.pendingCalls++;

    /*************** 2.  Dans le flux de chargement des réceptions ****************/
    const deliveriesSub = this.deliverySrv.getAllDeliveriesList().subscribe({
      next: (res) => {
        this.deliveries = res.success ? res.data : [];
        if (!this.isEditing) {
          this.setNextNumbers();            // 👉 applique automatiquement le prochain deliveryNumber/lotNumber
        }
      },
      error: () => this.toast.error(
        this.translate.instant('DELIVERIES.FORM.MESSAGES.LOAD_ERROR'),
      ),
      complete: () => this.markCallDone()
    });
    this.subscriptions.push(deliveriesSub);
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
            this.errorMessage = 'Erreur lors du chargement de la réception.';
            this.router.navigate(['/reception-huile']);
          }
        },
        error: () => {
          this.errorMessage = 'Erreur lors du chargement de la réception.';
          this.router.navigate(['/reception-huile']);
        },
        complete: () => this.markCallDone()
      });
      this.subscriptions.push(editSub);
    }

    // ===== 4️⃣  Initialiser les types d’opération & abonnements =====
    this.operationTypes = [
      {
        value: OperationType.OIL_PURCHASE,
        label: 'OIL_RECEPTION.ADD.FIELDS.OPERATION_TYPE_PURCHASE'
      },
      { value: OperationType.SIMPLE_RECEPTION, label: 'OIL_RECEPTION.ADD.FIELDS.OPERATION_TYPE_RECEPTION' }
    ];
    this.setupFormSubscriptions();

    // Par défaut (création) on pré‑sélectionne l’opération OIL_PURCHASE
    if (!this.isEditing) {
      this.receptionForm.patchValue({ operationType: OperationType.OIL_PURCHASE });
    }

    // Si aucune requête n’était nécessaire (cas création sans édition)
    if (this.pendingCalls === 0) {
      this.loading = false;
    }
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
    const payload = {
      id: this.isEditing && this.deliveryId ? this.deliveryId : '',
      deliveryNumber: formValue.deliveryNumber || '',
      deliveryType: 'OIL',
      lotNumber: formValue.lotNumber || '',
      deliveryDate: formValue.deliveryDate ? new Date(formValue.deliveryDate) : new Date(),
      region: formValue.region || null,
      poidsBrute: Number(formValue.poidsBrute) || 0,
      poidsNet: Number(formValue.poidsNet) || 0,
      matriculeCamion: formValue.matriculeCamion || '',
      etatCamion: formValue.etatCamion || '',
      supplier: formValue.supplier || null,
      globalLotNumber: formValue.globalLotNumber || null,
      oilVariety: formValue.oilVariety || null,
      oilQuantity: Number(formValue.poidsNet) || 0,
      unitPrice: Number(formValue.unitPrice) || 0,
      price: Number(formValue.price) || 0,
      paidAmount: Number(formValue.paidAmount) || 0,
      unpaidAmount: Number(formValue.unpaidAmount) || 0,
      oilType: this.receptionForm.value.oilType,     // 'HB' | 'HC'
      oliveType: this.receptionForm.value.oliveType,     // 'HB' | 'HC'
      trtDate: formValue.trtDate ? new Date(formValue.trtDate) : null,
      operationType: formValue.operationType || OperationType.OIL_PURCHASE,
      oliveVariety: formValue.oliveVariety || null,
      sackCount: Number(formValue.sackCount) || 0,
      status: OliveLotStatus.NEW,
      rendement: Number(formValue.rendement) || 0,
      oliveQuantity: Number(formValue.oliveQuantity) || 0,
      parcel: formValue.parcel || '',
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
        this.translate.get('OIL_RECEPTION.ADD.MESSAGES.ERROR.SERVER').subscribe((message) => {
          this.toast.error(message);
        });
      })
      .finally(() => (this.loading = false));
  }

  resetForm(): void {
    this.router.navigate(['/reception-huile']);
  }

  onBack(): void {
    window.history.back();
  }

  validateSupplier() {
    const value = this.receptionForm.get('supplier')!.value;
    if (!isValidSelection(value, this.suppliers)) {
      this.receptionForm.get('supplier')!.setValue(null);
    }
  }

  displayFn<T extends { name?: string; supplierInfo?: { name: string; lastname: string } }>(item: T): string {
    if (!item) return '';
    if (item.supplierInfo) {
      return item.supplierInfo.name + ' ' + item.supplierInfo.lastname;
    }
    return item.name || '';
  }

  private markCallDone(): void {
    // Décrément‑le quand une requête se termine
    this.pendingCalls--;
    if (this.pendingCalls === 0) {
      this.loading = false; // Désactive le spinner quand tout est fini
    }
  }

  /*************** 1.  Méthode utilitaire ****************/
  private setNextNumbers(): void {
    const deliveryCount = this.deliveries.length;                       // nb. total de réceptions déjà saisies
    const maxLot = Math.max(0, ...this.deliveries
      .map(d => Number(d.lotNumber) || 0));    // plus grand n° de lot existant

    this.receptionForm.patchValue({
      deliveryNumber: deliveryCount + 1,   // prochain n° de réception
      lotNumber:      maxLot + 1           // prochain n° de lot
    }, { emitEvent: false });
  }

  private patchForm(d: UnifiedDelivery): void {
    const parse = (v: string | Date | null): Date | null => (v ? new Date(v) : null);
    const matchedSupplier = this.suppliers.find(s => s.id?.toString() === d.supplier?.id?.toString());

    console.log('patchForm supplier:', d.supplier);
    console.log('matched:', this.suppliers.find(s => s.id === d.supplier?.id));
    this.receptionForm.patchValue({
      id: this.isEditing ? this.deliveryId : null,
      deliveryType: d.deliveryType,
      deliveryNumber: d.deliveryNumber,
      lotNumber: d.lotNumber,
      parcel: d.parcel,
      deliveryDate: parse(d.deliveryDate),
      region: d.region || null,
      supplier: matchedSupplier || null,
      matriculeCamion: d.matriculeCamion,
      etatCamion: d.etatCamion,
      poidsBrute: d.poidsBrute,
      oilQuantity: d.poidsNet,
      oilVariety: d.oilVariety || null,
      oilType: d.oilType|| null,
      globalLotNumber: d.globalLotNumber || '',
      operationType: OperationType.OIL_PURCHASE
    });

    // Mark all controls as touched and update validity to ensure UI updates
    Object.values(this.receptionForm.controls).forEach((control) => {
      control.markAsTouched();
      control.updateValueAndValidity();
    });
  }



  private generateLotNumber(oilTye: BaseType | null, deliveryNumber: number): string {
    if (!oilTye?.name) return '';
    const year = new Date().getFullYear().toString().slice(-2);
    const paddedNumber = deliveryNumber.toString().padStart(4, '0');
    return `${paddedNumber}${oilTye.name.toUpperCase()}${year}`;
  }

  private setupFormSubscriptions(): void {
    this.subscriptions.push(
      this.receptionForm.get('oilType')!.valueChanges.subscribe((oilTye: BaseType | null) => {
        const deliveryNumber = this.receptionForm.get('deliveryNumber')?.value || this.deliveries.length + 1;
        const lotNumber = this.generateLotNumber(oilTye, deliveryNumber);
        this.receptionForm.patchValue({ lotNumber }, { emitEvent: false });
      })
    );
  }
}
