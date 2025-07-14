import { Component, OnDestroy, OnInit } from '@angular/core';
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
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { CardComponent } from '../../../../@theme/components/card/card.component';
import { MatIcon } from '@angular/material/icon';
import { StorageUnitDtoService } from '../../../../shared/services/storage.service';
import { OliveLotStatus } from '../../../../shared/models/OliveLotStatus';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OperationType } from '../../../../shared/models/operation-type.enum';

// Validator for net weight not exceeding gross weight
const netNotGreaterThanGross = (control: AbstractControl): ValidationErrors | null => {
  const brut = control.get('poidsBrut')?.value;
  const net = control.get('oilQuantity')?.value; // Changed from poidsNet to oilQuantity
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
    TranslateModule
  ],
  templateUrl: './oil-reception-add.component.html',
  styleUrls: ['./oil-reception-add.component.scss']
})
export class OilReceptionFormComponent implements OnInit, OnDestroy {
  loading = false;
  isEditing = false;
  errorMessage: string | null = null;
  receptionForm: FormGroup;

  regions: BaseType[] = [];
  suppliers: SupplierType[] = [];
  oilCategories: BaseType[] = [];
  oilTypes: BaseType[] = [];
  oilVariety: BaseType[] = [];
  deliveries: UnifiedDelivery[] = [];
   operationTypes: { value: OperationType; label: string }[] = [];

  private subscriptions: Subscription[] = [];
  private deliveryId: string | null;

  constructor(
    private fb: FormBuilder,
    private genericSrv: GenericTypeService,
    private supplierSrv: SupplierTypeService,
    private deliverySrv: UnifiedDeliveryService,
    private snack: MatSnackBar,
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

    Promise.all([
      this.genericSrv.getAllTypes(TypeCategory.OIL_VARIETY).toPromise(),
      this.genericSrv.getAllTypes(TypeCategory.REGION).toPromise(),
      this.supplierSrv.getAllSuppliers().toPromise(),
      this.deliverySrv.getAllDeliveriesList().toPromise(),
      this.genericSrv.getAllTypes(TypeCategory.OIL_TYPE).toPromise(),
      this.isEditing && this.deliveryId ? this.deliverySrv.getUnifiedDelivery(this.deliveryId).toPromise() : Promise.resolve(null)
    ])
      .then(([cats, regions, suppliers, deliveries, oilTypes, delivery]) => {
        this.oilCategories = cats?.success ? cats.data : [];
        this.regions = regions?.success ? regions.data : [];
        this.suppliers = suppliers?.success ? suppliers.data : [];
        this.deliveries = deliveries?.success ? deliveries.data : [];
         this.oilTypes = oilTypes?.success ? oilTypes.data : [];
        // Initialize operation types
        this.operationTypes = [
          { value: OperationType.OIL_PURCHASE, label: 'OIL_RECEPTION.ADD.FIELDS.OPERATION_TYPE_PURCHASE' },
          { value: OperationType.SIMPLE_RECEPTION, label: 'OIL_RECEPTION.ADD.FIELDS.OPERATION_TYPE_RECEPTION' }
        ];
        this.setupFormSubscriptions();

        // Set default operation type for oil reception
        if (!this.isEditing) {
          // If there's only one operation type, automatically select it
          if (this.operationTypes.length === 1) {
            this.receptionForm.patchValue({ operationType: this.operationTypes[0].value });
          } else {
            // Default to OIL_PURCHASE if multiple options
            this.receptionForm.patchValue({ operationType: OperationType.OIL_PURCHASE });
          }
        }

        if (this.isEditing && delivery?.success && delivery.data) {
          const deliveryObj = Array.isArray(delivery.data) ? delivery.data[0] : delivery.data;
          this.patchForm(deliveryObj);
        } else if (this.isEditing) {
          this.errorMessage = 'Erreur lors du chargement de la réception.';
          this.showToast(this.errorMessage);
          this.router.navigate(['/reception-huile']);
          return;
        }
        // When region changes, set parcel to region name
        this.receptionForm.get('region')?.valueChanges.subscribe((region: BaseType | null) => {
          if (region?.name) {
            this.receptionForm.patchValue({ parcel: region.name });
          }
        });
        this.setNextNumbers();
        // this.setupFormSubscriptions();

        this.loading = false;
      })
      .catch((error) => {
        this.errorMessage = 'Erreur lors du chargement des données.';
        console.log(this.errorMessage + '    ' + error);
        this.showToast(this.errorMessage);
        this.loading = false;
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  private setNextNumbers(): void {
    const deliveryCount = this.deliveries.length;
    const maxLot = Math.max(0, ...this.deliveries.map((d) => +d.lotNumber || 0));
    this.receptionForm.patchValue({
      deliveryNumber: deliveryCount + 1,
      lotNumber: maxLot + 1
    });
  }

  save(): void {
    if (this.receptionForm.invalid) {
      if (this.receptionForm.hasError('exceedsCapacity')) {
        this.translate.get('OIL_RECEPTION.ADD.ERRORS.EXCEEDS_CAPACITY').subscribe((message) => {
          this.showToast(message, 4000);
        });
      } else {
        this.translate.get('OIL_RECEPTION.ADD.MESSAGES.ERROR.INCOMPLETE_FORM').subscribe((message) => {
          this.showToast(message, 4000);
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
      oilQuantity: Number(formValue.oilQuantity) || 0,
      unitPrice: Number(formValue.unitPrice) || 0,
      price: Number(formValue.price) || 0,
      paidAmount: Number(formValue.paidAmount) || 0,
      unpaidAmount: Number(formValue.unpaidAmount) || 0,
      oilType: formValue.oilType || null,
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
            this.showToast(message);
            this.router.navigate(['/reception/reception-huile']);
          });
      } else {
        this.translate.get('OIL_RECEPTION.ADD.MESSAGES.ERROR.' + (this.isEditing ? 'UPDATE' : 'ADD')).subscribe((message) => {
          this.showToast(message);
        });
      }
    })
      .catch(() => {
        this.translate.get('OIL_RECEPTION.ADD.MESSAGES.ERROR.SERVER').subscribe((message) => {
          this.showToast(message);
        });
      })
      .finally(() => (this.loading = false));
  }

  private patchForm(d: UnifiedDelivery): void {
    const parse = (v: string | Date | null): Date | null => (v ? new Date(v) : null);
    this.receptionForm.patchValue({
      id: this.isEditing ? this.deliveryId : null,
      deliveryType: d.deliveryType,
      deliveryNumber: d.deliveryNumber,
      lotNumber: d.lotNumber,
      parcel: d.parcel,
      deliveryDate: parse(d.deliveryDate),
      region: this.regions.find((r) => r.id === d.region?.id) || null,
      supplier: this.suppliers.find((s) => s.id === d.supplier?.id) || null,
      matriculeCamion: d.matriculeCamion,
      etatCamion: d.etatCamion,
      poidsBrute: d.poidsBrute,
      oilQuantity: d.oilQuantity,
      oilVariety: this.oilCategories.find((c) => c.id === d.oilVariety?.id) || null,
      oilType: this.oilTypes.find((t) => t.id === d.oilType?.id) || null,
       globalLotNumber: d.globalLotNumber || '',
      operationType: OperationType.OIL_PURCHASE
    });

    // Mark all controls as touched and update validity to ensure UI updates
    Object.values(this.receptionForm.controls).forEach((control) => {
      control.markAsTouched();
      control.updateValueAndValidity();
    });
  }

  private showToast(message: string, duration = 3000): void {
    this.snack.open(message, 'Fermer', {
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['custom-snackbar']
    });
  }


  resetForm(): void {
    this.router.navigate(['/reception-huile']);
  }

  onBack(): void {
    window.history.back();
  }

  private generateLotNumber(oilTye: BaseType | null, deliveryNumber: number): string {
    if (!oilTye?.name) return '';
    const year = new Date().getFullYear().toString().slice(-2);
    const paddedNumber = deliveryNumber.toString().padStart(4, '0');
    return `${paddedNumber}${oilTye.name.toUpperCase()}${year}`;
  }

  validateSupplier() {
    const value = this.receptionForm.get('supplier')!.value;
    if (!isValidSelection(value, this.suppliers)) {
      this.receptionForm.get('supplier')!.setValue(null);
    }
  }

  validateRegion() {
    const value = this.receptionForm.get('region')!.value;
    if (!isValidSelection(value, this.regions)) {
      this.receptionForm.get('region')!.setValue(null);
    }
  }

  validateOilVariety() {
    const value = this.receptionForm.get('oilVariety')!.value;
    if (!isValidSelection(value, this.oilCategories)) {
      this.receptionForm.get('oilVariety')!.setValue(null);
    }
  }

  validateOilType() {
    const value = this.receptionForm.get('oilType')!.value;
    if (!isValidSelection(value, this.oilTypes)) {
      this.receptionForm.get('oilType')!.setValue(null);
    }
  }



  displayFn<T extends { name?: string; supplierInfo?: { name: string } }>(item: T): string {
    if (!item) return '';
    if (item.supplierInfo) {
      return item.supplierInfo.name;
    }
    return item.name || '';
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
