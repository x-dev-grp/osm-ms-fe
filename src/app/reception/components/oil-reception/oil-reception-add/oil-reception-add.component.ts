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
  Validators
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { CardComponent } from '../../../../@theme/components/card/card.component';
import { MatIcon } from '@angular/material/icon';


// ─────────────────────────────────────────────────────────────────────────────
// ✅ Validateur personnalisé : volume net ne doit pas dépasser le volume brut
// ─────────────────────────────────────────────────────────────────────────────
const netNotGreaterThanGross = (
  control: AbstractControl,
): ValidationErrors | null => {
  const brut = control.get('volumeBrut')?.value;
  const net = control.get('volumeNet')?.value;
  return brut != null && net != null && net > brut ? { netGreater: true } : null;
};

@Component({
  selector: 'app-oil-reception-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // Material
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



  regions: BaseType[] = [];
  suppliers: SupplierType[] = [];
  oilCategories: BaseType[] = [];
  deliveries: UnifiedDelivery[] = [];
  private subscriptions = new Subscription();


  constructor(
    private fb: FormBuilder,
    private genericSrv: GenericTypeService,
    private supplierSrv: SupplierTypeService,
    private deliverySrv: UnifiedDeliveryService,
    private snack: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // ─────────────────────────────────────────────────────────────────────────
    // 🛠️   Construction du FormGroup
    // ─────────────────────────────────────────────────────────────────────────
    this.receptionForm = this.fb.group(
      {
        deliveryType: [{ value: 'OIL', disabled: true }, Validators.required],
        deliveryNumber: [{ value: '', disabled: true }, Validators.required],
        lotNumber: [{ value: '', disabled: true }, Validators.required],
        deliveryDate: [new Date(), Validators.required],

        region: [null, Validators.required],
        supplier: [null, Validators.required],

        matriculeCamion: [''],
        etatCamion: [''],

        volumeBrut: [0, Validators.min(0)],
        poidsNet: [0, Validators.min(0)],

        // ───── Champs spécifiques à l'huile ─────
        oilCategory: [null, Validators.required],
        acidity: [null, [Validators.min(0), Validators.max(1)]], // Ex: 0.8% max pour EVOO
        peroxideValue: [null, Validators.min(0)],
        tankNumber: ['']
      },
      { validators: netNotGreaterThanGross }
    );
  }

  ngOnInit(): void {
    this.loading = true;
    // Determine if in edit mode
    const deliveryId = this.route.snapshot.paramMap.get('id');
    this.isEditing = deliveryId !== null && deliveryId !== 'new';
    Promise.all([
      this.genericSrv.getAllTypes(TypeCategory.OIL_VARIETY).toPromise(),
      this.genericSrv.getAllTypes(TypeCategory.REGION).toPromise(),
      this.supplierSrv.getAllSuppliers().toPromise(),
      this.deliverySrv.getAllDeliveriesList().toPromise(),
      this.isEditing && deliveryId ? this.deliverySrv.getUnifiedDelivery(deliveryId).toPromise() : Promise.resolve(null)
    ])
      .then(([cats, regions, suppliers, deliveries, delivery]) => {
        this.oilCategories = cats?.success ? cats.data : [];
        this.regions = regions?.success ? regions.data : [];
        this.suppliers = suppliers?.success ? suppliers.data : [];
        this.deliveries = deliveries?.success ? deliveries.data : [];

        // Patch form with delivery data if editing
        if (delivery?.success && delivery.data) {
          this.patchForm(delivery.data[0]);
        } else if (this.isEditing) {
          this.errorMessage = 'Erreur lors du chargement de la réception.';
          this.showToast(this.errorMessage);
          this.router.navigate(['/reception-huile']);
          return;
        }

        // Setup form subscriptions
        this.setupFormSubscriptions();

        this.loading = false;
      })
      .catch(  )
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
      region: this.regions.find((r) => r.id === d.region?.id),
      supplier: this.suppliers.find((s) => s.id === d.supplier?.id),
      oilCategory: this.oilCategories.find((c) => c.id === d.oilVariety?.id)
    });
  }

  save(): void {
    if (this.receptionForm.invalid) {
      this.toast('Formulaire incomplet');
      return;
    }

    const payload = {
      ...this.receptionForm.getRawValue(),
      deliveryType: 'OIL'
    } as UnifiedDelivery;

    const op = this.isEditing
      ? this.deliverySrv.updateUnifiedDelivery(payload).toPromise()
      : this.deliverySrv.createUnifiedDelivery(payload).toPromise();

    this.loading = true;
    op.then((res) => this.toast(res?.success ? 'Enregistré' : (res?.message ?? 'Échec')))
      .catch(() => this.toast('Erreur serveur'))
      .finally(() => (this.loading = false));
  }



  private toast(msg: string): void {
    this.snack.open(msg, 'Fermer', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  private failAndExit(msg: string): void {
    this.toast(msg);
    this.router.navigate(['/reception/reception-huile']);
  }

  resetForm(): void {
    this.router.navigate(['/reception/reception-huile']);
  }

  onBack(): void {
    window.history.back();
  }
  // Generate lot number based on olive type and delivery number
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
  }
}
