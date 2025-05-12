import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { BaseType } from '../../../../shared/models/base-type';
import { SupplierType } from '../../../../shared/models/supplier-type';
import { UnifiedDelivery } from '../../../../shared/models/UnifiedDelivery';
import { GenericTypeService } from '../../../../shared/services/generic-type.service';
import { SupplierTypeService } from '../../../../shared/services/supplier.service';
import { UnifiedDeliveryService } from '../../../../shared/services/delivery.service';
import { TypeCategory } from '../../../../shared/models/type-category.enum';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { CardComponent } from '../../../../@theme/components/card/card.component';
import { MatIcon } from '@angular/material/icon';
import { StorageUnitDtoService } from '../../../../shared/services/storage.service';
import { StorageUnitDto } from '../../../../shared/models/StorageUnitDto';

// Validator for net weight not exceeding gross weight
const netNotGreaterThanGross = (control: AbstractControl): ValidationErrors | null => {
  const brut = control.get('poidsBrut')?.value;
  const net = control.get('oilQuantity')?.value; // Changed from poidsNet to oilQuantity
  return brut != null && net != null && net > brut ? { netGreater: true } : null;
};

// Validator for ensuring volume fits storage unit capacity
const volumeFitsCuve = (component: OilReceptionFormComponent): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    const cuveId = control.get('storageUnit')?.value;
    const volume = control.get('oilQuantity')?.value as number; // Changed from poidsNet to oilQuantity
    if (!cuveId || volume == null) return null;

    const cuve = component.storageUnits.find((c) => c.id === cuveId);
    if (!cuve) return null;

    const available = cuve.maxCapacity - cuve.currentVolume;
    return volume > available ? { exceedsCapacity: { available } } : null;
  };
};

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
    MatIcon
  ],
  templateUrl: './oil-reception-add.component.html',
  styleUrls: ['./oil-reception-add.component.scss']
})
export class OilReceptionFormComponent implements OnInit, OnDestroy {
  loading = false;
  isEditing = false;
  errorMessage: string | null = null;
  receptionForm: FormGroup;

  storageUnits: StorageUnitDto[] = [];
  regions: BaseType[] = [];
  suppliers: SupplierType[] = [];
  oilCategories: BaseType[] = [];
  oilTypes: BaseType[] = []; // Added for oilType selection
  deliveries: UnifiedDelivery[] = [];
  oliveTypes: BaseType[] = [];

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private genericSrv: GenericTypeService,
    private supplierSrv: SupplierTypeService,
    private deliverySrv: UnifiedDeliveryService,
    private snack: MatSnackBar,
    private route: ActivatedRoute,
    private storageService: StorageUnitDtoService,
    private router: Router
  ) {
    // Construction du FormGroup with validators
    this.receptionForm = this.fb.group(
      {
        deliveryType: [{ value: 'OIL', disabled: true }, Validators.required],
        deliveryNumber: [{ value: '', disabled: true }, Validators.required],
        lotNumber: [{ value: '', disabled: true }, Validators.required],
        deliveryDate: [new Date(), Validators.required],
        region: [null, Validators.required],
        supplier: [null, Validators.required],
        matriculeCamion: ['', Validators.required],
        etatCamion: ['', Validators.required],
        poidsBrut: [0, Validators.min(0)],
        oilQuantity: [0, Validators.min(0)], // Renamed from poidsNet to oilQuantity
        oilVariety: [null, Validators.required],
        oilType: [null, Validators.required], // Added oilType
        oliveType: [null, Validators.required],
        storageUnit: [null, Validators.required],
        globalLotNumber: [''],
        unitPrice: [0, [Validators.min(0), Validators.required]], // Added unitPrice
        price: [0, Validators.min(0)], // Added price
        paidAmount: [0, Validators.min(0)], // Added paidAmount
        unpaidAmount: [0, Validators.min(0)] // Added unpaidAmount
      },
      { validators: [netNotGreaterThanGross, volumeFitsCuve(this)] }
    );
  }

  ngOnInit(): void {
    this.loading = true;
    const deliveryId = this.route.snapshot.paramMap.get('id');
    this.isEditing = deliveryId !== null && deliveryId !== 'new';

    Promise.all([
      this.genericSrv.getAllTypes(TypeCategory.OIL_VARIETY).toPromise(),
      this.storageService.getAllStorageUnit().toPromise(),
      this.genericSrv.getAllTypes(TypeCategory.REGION).toPromise(),
      this.supplierSrv.getAllSuppliers().toPromise(),
      this.deliverySrv.getAllDeliveriesList().toPromise(),
      this.genericSrv.getAllTypes(TypeCategory.OLIVE_TYPE).toPromise(),
      this.genericSrv.getAllTypes(TypeCategory.OIL_TYPE).toPromise(), // Added to fetch oil types
      this.isEditing && deliveryId ? this.deliverySrv.getUnifiedDelivery(deliveryId).toPromise() : Promise.resolve(null)
    ])
      .then(([cats, storageUnits, regions, suppliers, deliveries, oliveTypes, oilTypes, delivery]) => {
        this.oilCategories = cats?.success ? cats.data : [];
        this.storageUnits = storageUnits?.success ? storageUnits.data : [];
        this.regions = regions?.success ? regions.data : [];
        this.suppliers = suppliers?.success ? suppliers.data : [];
        this.deliveries = deliveries?.success ? deliveries.data : [];
        this.oliveTypes = oliveTypes?.success ? oliveTypes.data : [];
        this.oilTypes = oilTypes?.success ? oilTypes.data : []; // Initialized oilTypes

        if (this.isEditing && delivery?.success && delivery.data) {
          this.patchForm(delivery.data[0]);
        } else if (this.isEditing) {
          this.errorMessage = 'Erreur lors du chargement de la réception.';
          this.showToast(this.errorMessage);
          this.router.navigate(['/reception-huile']);
          return;
        }

        this.setNextNumbers();
        this.setupFormSubscriptions();
        this.setupDynamicValidation();
        this.updatePrice(); // Initialize price calculation

        this.loading = false;
      })
      .catch((error) => {
        this.errorMessage = 'Erreur lors du chargement des données.';
        console.log(this.errorMessage + "    " + error);
        this.showToast(this.errorMessage);
        this.loading = false;
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private setNextNumbers(): void {
    const deliveryCount = this.deliveries.length;
    const maxLot = Math.max(0, ...this.deliveries.map((d) => +d.lotNumber || 0));
    this.receptionForm.patchValue({
      deliveryNumber: deliveryCount + 1,
      lotNumber: maxLot + 1
    });
  }

  private patchForm(d: UnifiedDelivery): void {
    const parse = (v: any) => (v ? new Date(v) : null);
    this.receptionForm.patchValue({
      ...d,
      deliveryDate: parse(d.deliveryDate),
      region: this.regions.find((r) => r.id === d.region?.id) || null,
      supplier: this.suppliers.find((s) => s.id === d.supplier?.id) || null,
      oilVariety: this.oilCategories.find((c) => c.id === d.oilVariety?.id) || null,
      oilType: this.oilTypes.find((t) => t.id === d.oilType?.id) || null, // Patch oilType
      oliveType: this.oliveTypes.find((t) => t.id === d.oliveType?.id) || null,
      storageUnit: this.storageUnits.find((s) => s.id === d.storageUnit?.id) || null,
      globalLotNumber: d.globalLotNumber || '',
      unitPrice: d.unitPrice || 0,
      price: d.price || 0,
      paidAmount: d.paidAmount || 0,
      unpaidAmount: d.unpaidAmount || 0
    });
    this.updatePrice(); // Update price after patching
  }

  save(): void {
    if (this.receptionForm.invalid) {
      this.showToast('Formulaire incomplet ou validation échouée.');
      return;
    }

    const payload = {
      ...this.receptionForm.getRawValue(),
      deliveryType: 'OIL',
      oilQuantity: this.receptionForm.get('oilQuantity')?.value // Ensure oilQuantity is set
    } as UnifiedDelivery;

    const op = this.isEditing
      ? this.deliverySrv.updateUnifiedDelivery(payload).toPromise()
      : this.deliverySrv.createUnifiedDelivery(payload).toPromise();

    this.loading = true;
    op
      .then((res) => this.showToast(res?.success ? 'Enregistré' : res?.message ?? 'Échec'))
      .catch(() => this.showToast('Erreur serveur'))
      .finally(() => (this.loading = false));
  }

  private showToast(message: string, duration = 3000): void {
    this.snack.open(message, 'Fermer', {
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['custom-snackbar']
    });
  }

  private failAndExit(msg: string): void {
    this.showToast(msg);
    this.router.navigate(['/reception-huile']);
  }

  resetForm(): void {
    this.router.navigate(['/reception-huile']);
  }

  onBack(): void {
    window.history.back();
  }

  private generateLotNumber(oliveType: BaseType | null, deliveryNumber: number): string {
    if (!oliveType?.name) return '';
    const year = new Date().getFullYear().toString().slice(-2);
    const paddedNumber = deliveryNumber.toString().padStart(4, '0');
    return `${paddedNumber}${oliveType.name.toUpperCase()}${year}`;
  }

  private setupFormSubscriptions(): void {
    this.subscriptions.add(
      this.receptionForm.get('oliveType')!.valueChanges.subscribe((oliveType: BaseType | null) => {
        const deliveryNumber = this.receptionForm.get('deliveryNumber')?.value || this.deliveries.length + 1;
        const lotNumber = this.generateLotNumber(oliveType, deliveryNumber);
        this.receptionForm.patchValue({ lotNumber }, { emitEvent: false });
      })
    );

    this.subscriptions.add(
      this.receptionForm.get('region')!.valueChanges.subscribe((region: BaseType | null) => {
        if (region?.name) {
          this.receptionForm.patchValue({ parcel: region.name }, { emitEvent: false });
        }
      })
    );

    // Subscribe to unitPrice and oilQuantity changes to update price
    this.subscriptions.add(
      this.receptionForm.get('unitPrice')!.valueChanges.subscribe(() => this.updatePrice())
    );
    this.subscriptions.add(
      this.receptionForm.get('oilQuantity')!.valueChanges.subscribe(() => this.updatePrice())
    );
  }

  private setupDynamicValidation(): void {
    this.subscriptions.add(
      this.receptionForm.get('storageUnit')!.valueChanges.subscribe(() => {
        this.receptionForm.updateValueAndValidity();
      })
    );
    this.subscriptions.add(
      this.receptionForm.get('oilQuantity')!.valueChanges.subscribe(() => {
        this.receptionForm.updateValueAndValidity();
      })
    );
  }

  private updatePrice(): void {
    const unitPrice = this.receptionForm.get('unitPrice')?.value || 0;
    const oilQuantity = this.receptionForm.get('oilQuantity')?.value || 0;
    const price = unitPrice * oilQuantity;
    this.receptionForm.patchValue({ price }, { emitEvent: false });

    // Update unpaidAmount as price - paidAmount
    const paidAmount = this.receptionForm.get('paidAmount')?.value || 0;
    const unpaidAmount = price - paidAmount;
    this.receptionForm.patchValue({ unpaidAmount: unpaidAmount < 0 ? 0 : unpaidAmount }, { emitEvent: false });
  }
}
