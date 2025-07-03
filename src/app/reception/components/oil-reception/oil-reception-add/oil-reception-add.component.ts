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

// Validator for net weight not exceeding gross weight
const netNotGreaterThanGross = (control: AbstractControl): ValidationErrors | null => {
  const brut = control.get('poidsBrut')?.value;
  const net = control.get('oilQuantity')?.value; // Changed from poidsNet to oilQuantity
  return brut != null && net != null && net > brut ? { netGreater: true } : null;
};

// Validator for ensuring volume fits storage unit capacity
// const volumeFitsCuve = (): ValidatorFn => {
//   return (control: AbstractControl): ValidationErrors | null => {
//     const storageUnit = control.get('storageUnit')?.value;
//     const volume = control.get('oilQuantity')?.value as number;
//
//     if (!storageUnit || volume == null) return null;
//
//     const available = storageUnit.maxCapacity - storageUnit.currentVolume;
//     return volume > available ? { exceedsCapacity: { available } } : null;
//   };
// };

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
  operationTypes: BaseType[] = []; // Added for operation type
  deliveries: UnifiedDelivery[] = [];
  oliveTypes: BaseType[] = [];

  private subscriptions = new Subscription();
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
        poidsBrute: [0, Validators.min(0)],
        oilQuantity: [0, Validators.min(0)],
        oilVariety: [null, Validators.required],
        oilType: [null, Validators.required],
        parcel: [null, Validators.required],
        oliveType: [null, Validators.required],
        globalLotNumber: [''],
        operationType: [null, Validators.required]
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
      this.genericSrv.getAllTypes(TypeCategory.OLIVE_TYPE).toPromise(),
      this.genericSrv.getAllTypes(TypeCategory.OIL_TYPE).toPromise(),
      this.genericSrv.getAllTypes(TypeCategory.OPERATION_TYPE).toPromise(), // Added to fetch operation types
      this.isEditing && this.deliveryId ? this.deliverySrv.getUnifiedDelivery(this.deliveryId).toPromise() : Promise.resolve(null)
    ])
      .then(([cats, regions, suppliers, deliveries, oliveTypes, oilTypes, operationTypes, delivery]) => {
        this.oilCategories = cats?.success ? cats.data : [];
        this.regions = regions?.success ? regions.data : [];
        this.suppliers = suppliers?.success ? suppliers.data : [];
        this.deliveries = deliveries?.success ? deliveries.data : [];
        this.oliveTypes = oliveTypes?.success ? oliveTypes.data : [];
        this.oilTypes = oilTypes?.success ? oilTypes.data : [];
        this.operationTypes = operationTypes?.success ? operationTypes.data : []; // Initialize operation types

        if (this.isEditing && delivery?.success && delivery.data) {
          const deliveryObj = Array.isArray(delivery.data) ? delivery.data[0] : delivery.data;
          this.patchForm(deliveryObj);
        } else if (this.isEditing) {
          this.errorMessage = 'Erreur lors du chargement de la réception.';
          this.showToast(this.errorMessage);
          this.router.navigate(['/reception-huile']);
          return;
        }

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

    const payload = {
      ...this.receptionForm.getRawValue(),
      deliveryType: 'OIL',
      status: OliveLotStatus.NEW,
      oilQuantity: this.receptionForm.get('oilQuantity')?.value
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
      oliveType: this.oliveTypes.find((t) => t.id === d.oliveType?.id) || null,
      globalLotNumber: d.globalLotNumber || '',
      operationType: this.operationTypes.find((t) => t.id === d.operationType?.id) || null
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

  // private setupFormSubscriptions(): void {
  //   // Subscribe to storage unit changes
  //   this.subscriptions.add(
  //     this.receptionForm.get('storageUnit')?.valueChanges.subscribe(unit => {
  //       if (unit) {
  //         const available = unit.maxCapacity - unit.currentVolume;
  //         this.translate.get('OIL_RECEPTION.ADD.MESSAGES.STORAGE_CAPACITY', {
  //           name: unit.name,
  //           available: available,
  //           max: unit.maxCapacity
  //         }).subscribe(message => {
  //           this.showToast(message, 4000);
  //         });
  //       }
  //     })
  //   );
  //
  //   // Subscribe to oil quantity changes
  //   this.subscriptions.add(
  //     this.receptionForm.get('oilQuantity')?.valueChanges.subscribe(quantity => {
  //       if (quantity) {
  //         const storageUnit = this.receptionForm.get('storageUnit')?.value;
  //         if (storageUnit) {
  //           const available = storageUnit.maxCapacity - storageUnit.currentVolume;
  //           if (quantity > available) {
  //             this.translate.get('OIL_RECEPTION.ADD.ERRORS.EXCEEDS_CAPACITY', {
  //               available: available
  //             }).subscribe(message => {
  //               this.showToast(message, 4000);
  //             });
  //           }
  //         }
  //       }
  //     })
  //   );
  //
  //   // Subscribe to form validation errors
  //   this.subscriptions.add(
  //     this.receptionForm.statusChanges.subscribe(() => {
  //       if (this.receptionForm.hasError('netGreater')) {
  //         this.translate.get('OIL_RECEPTION.ADD.ERRORS.NET_GREATER').subscribe(message => {
  //           this.showToast(message, 4000);
  //         });
  //       }
  //     })
  //   );
  //
  //   // Subscribe to paid amount changes to update unpaid amount
  //   this.subscriptions.add(
  //     this.receptionForm.get('paidAmount')!.valueChanges.subscribe((paidAmount: number) => {
  //       const price = this.receptionForm.get('price')?.value || 0;
  //       const unpaidAmount = Math.max(0, price - (paidAmount || 0));
  //       this.receptionForm.patchValue({ unpaidAmount }, { emitEvent: false });
  //     })
  //   );
  //
  //   // Subscribe to price changes to update unpaid amount
  //   this.subscriptions.add(
  //     this.receptionForm.get('price')!.valueChanges.subscribe((price: number) => {
  //       const paidAmount = this.receptionForm.get('paidAmount')?.value || 0;
  //       const unpaidAmount = Math.max(0, price - paidAmount);
  //       this.receptionForm.patchValue({ unpaidAmount }, { emitEvent: false });
  //     })
  //   );
  //
  //   // Subscribe to olive type changes to update lot number
  //   this.subscriptions.add(
  //     this.receptionForm.get('oliveType')!.valueChanges.subscribe((oliveType: BaseType | null) => {
  //       const deliveryNumber = this.receptionForm.get('deliveryNumber')?.value || this.deliveries.length + 1;
  //       const lotNumber = this.generateLotNumber(oliveType, deliveryNumber);
  //       this.receptionForm.patchValue({ lotNumber }, { emitEvent: false });
  //     })
  //   );
  //
  //   // Subscribe to region changes to update parcel
  //   this.subscriptions.add(
  //     this.receptionForm.get('region')!.valueChanges.subscribe((region: BaseType | null) => {
  //       if (region?.name) {
  //         this.receptionForm.patchValue({ parcel: region.name }, { emitEvent: false });
  //       }
  //     })
  //   );
  //
  //
  // }
}
