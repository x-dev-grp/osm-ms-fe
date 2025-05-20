import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Subscription} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {UnifiedDelivery} from '../../../../shared/models/UnifiedDelivery';
import {OliveLotStatus} from '../../../../shared/models/OliveLotStatus';
import {BaseType} from '../../../../shared/models/base-type';
import {SupplierType} from '../../../../shared/models/supplier-type';
import {GenericTypeService} from '../../../../shared/services/generic-type.service';
import {UnifiedDeliveryService} from '../../../../shared/services/delivery.service';
import {SupplierTypeService} from '../../../../shared/services/supplier.service';
import {TypeCategory} from '../../../../shared/models/type-category.enum';
import {CardComponent} from '../../../../@theme/components/card/card.component';
import {MatIcon} from '@angular/material/icon';
import {MatDivider} from '@angular/material/divider';

// Validator to ensure net weight does not exceed gross weight
const netNotGreaterThanGross = (control: AbstractControl): ValidationErrors | null => {
  const gross = control.get('poidsBrute')?.value;
  const net = control.get('poidsNet')?.value;
  return gross != null && net != null && net > gross ? { netGreater: true } : null;
};

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
    MatDivider
  ],
  templateUrl: './olive-reception-form.component.html',
  styleUrls: ['./olive-reception-form.component.scss']
})
export class OliveReceptionFormComponent implements OnInit, OnDestroy {
  oliveLotStatuses = Object.values(OliveLotStatus);
  loading = false;
  isEditing = false;
  errorMessage: string | null = null;
  receptionForm: FormGroup;

  regions: BaseType[] = [];
  suppliers: SupplierType[] = [];
  oliveVarieties: BaseType[] = [];
  oliveTypes: BaseType[] = [];
  deliveries: UnifiedDelivery[] = [];

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private deliveryService: UnifiedDeliveryService,
    private genericTypeService: GenericTypeService,
    private supplierService: SupplierTypeService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.receptionForm = this.fb.group(
      {
        deliveryType: [{ value: 'OLIVE', disabled: true }, Validators.required],
        deliveryNumber: [{ value: '', disabled: true }, Validators.required],
        lotNumber: [{ value: '', disabled: true }, Validators.required],
        globalLotNumber: [''],
        deliveryDate: [new Date(), Validators.required],
        region: [null, Validators.required],
        poidsBrute: [0, Validators.min(0)],
        poidsNet: [0, Validators.min(0)],
        matriculeCamion: ['', Validators.required],
        etatCamion: ['', Validators.required],
        supplier: [null, Validators.required],
        trtDate: [new Date()],
        oliveVariety: [null],
        sackCount: [null, Validators.min(0)],
        oliveType: [null],
        status: [null],
        rendement: [null, Validators.min(0)],
        oliveQuantity: [null, Validators.min(0)],
        parcel: ['']
      },
      { validators: netNotGreaterThanGross }
    );
  }

  ngOnInit(): void {
    this.loading = true;
    this.errorMessage = null;

    // Determine if in edit mode
    const deliveryId = this.route.snapshot.paramMap.get('id');
    this.isEditing = deliveryId !== null && deliveryId !== 'new';

    // Fetch initial data and delivery (if editing)
    Promise.all([
      this.genericTypeService.getAllTypes(TypeCategory.OLIVE_VARIETY).toPromise(),
      this.genericTypeService.getAllTypes(TypeCategory.OLIVE_TYPE).toPromise(),
      this.genericTypeService.getAllTypes(TypeCategory.REGION).toPromise(),
      this.supplierService.getAllSuppliers().toPromise(),
      this.deliveryService.getAllDeliveriesList().toPromise(),
      this.isEditing && deliveryId ? this.deliveryService.getUnifiedDelivery(deliveryId).toPromise() : Promise.resolve(null)
    ])
      .then(([varieties, types, regions, suppliers, deliveries, delivery]) => {
        // Initialize data arrays
        this.oliveVarieties = varieties?.success ? varieties.data : [];
        this.oliveTypes = types?.success ? types.data : [];
        this.regions = regions?.success ? regions.data : [];
        this.suppliers = suppliers?.success ? suppliers.data : [];
        this.deliveries = deliveries?.success ? deliveries.data : [];

        // Set delivery and lot numbers for new receptions
        if (!this.isEditing) {
          const deliveryCount = this.deliveries.length;
          const maxLot = this.getMaxLotNumber();
          this.receptionForm.patchValue({
            deliveryNumber: deliveryCount + 1,
            lotNumber: maxLot + 1
          });
        }

        // Patch form with delivery data if editing
        if (delivery?.success && delivery.data) {
          this.patchForm(delivery.data[0]);
        } else if (this.isEditing) {
          this.errorMessage = 'Erreur lors du chargement de la réception.';
          this.showToast(this.errorMessage);
          this.router.navigate(['/reception-olive']);
          return;
        }

        // Setup form subscriptions
        this.setupFormSubscriptions();

        this.loading = false;
      })
      .catch((error) => {
        this.errorMessage = 'Erreur lors du chargement des données initiales.';
        this.showToast(this.errorMessage);
        console.error('Initialization error:', error);
        this.loading = false;
        this.router.navigate(['/reception/reception-olive']);
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Save or update the reception
  async saveReception(): Promise<void> {
    if (this.receptionForm.invalid) {
      this.showToast('Veuillez remplir tous les champs obligatoires.', 4000);
      return;
    }

    const formValue = this.receptionForm.getRawValue();
    if (!formValue.region?.id) {
      this.showToast('Veuillez sélectionner une région valide.', 4000);
      return;
    }
    if (!formValue.supplier?.id) {
      this.showToast('Veuillez sélectionner un fournisseur valide.', 4000);
      return;
    }

    const deliveryId = this.route.snapshot.paramMap.get('id');
    const payload: any = {
      id: this.isEditing && deliveryId !== 'new' ? deliveryId : undefined,
      deliveryType: 'OLIVE',
      deliveryNumber: formValue.deliveryNumber,
      lotNumber: formValue.lotNumber,
      globalLotNumber: formValue.globalLotNumber,
      deliveryDate: this.toISOString(formValue.deliveryDate),
      region: formValue.region,
      poidsBrute: formValue.poidsBrute,
      poidsNet: formValue.poidsNet,
      matriculeCamion: formValue.matriculeCamion,
      etatCamion: formValue.etatCamion,
      supplier: formValue.supplier,
      trtDate: this.toISOString(formValue.trtDate),
      oliveVariety: formValue.oliveVariety,
      sackCount: formValue.sackCount,
      oliveType: formValue.oliveType,
      status: formValue.status,
      rendement: formValue.rendement,
      oliveQuantity: formValue.oliveQuantity,
      parcel: formValue.parcel
    };

    this.loading = true;
    try {
      const response = await (this.isEditing
        ? this.deliveryService.updateUnifiedDelivery(payload).toPromise()
        : this.deliveryService.createUnifiedDelivery(payload).toPromise());

      if (response?.success && response.data) {
        this.showToast(this.isEditing ? 'Réception olive mise à jour.' : 'Réception olive ajoutée.');
        this.router.navigate(['reception/reception-olive']);
      } else {
        this.showToast(response?.message || 'Échec de l’opération.');
      }
    } catch (error) {
      this.showToast(this.isEditing ? 'Erreur lors de la mise à jour.' : 'Erreur lors de l’ajout.');
      console.error('Save error:', error);
    } finally {
      this.loading = false;
    }
  }

  // Navigate back to dashboard
  resetForm(): void {
    this.router.navigate(['/reception/reception-olive']);
  }

  // Display toast notification
  private showToast(message: string, duration = 3000): void {
    this.snackBar.open(message, 'Fermer', {
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['custom-snackbar']
    });
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

  // Patch form with delivery data
  private patchForm(delivery: UnifiedDelivery): void {
    const parseDate = (value: any): Date | null => (value ? (value instanceof Date ? value : new Date(value)) : null);

    this.receptionForm.patchValue({
      ...delivery,
      deliveryType: 'OLIVE',
      deliveryDate: parseDate(delivery.deliveryDate),
      trtDate: parseDate(delivery.trtDate),
      region: this.regions.find((r) => r.id === delivery.region?.id) || null,
      supplier: this.suppliers.find((s) => s.id === delivery.supplier?.id) || null,
      oliveVariety: this.oliveVarieties.find((v) => v.id === delivery.oliveVariety?.id) || null,
      oliveType: this.oliveTypes.find((t) => t.id === delivery.oliveType?.id) || null
    });
  }

  // Setup subscriptions for olive type and region changes
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

  // Generate lot number based on olive type and delivery number
  private generateLotNumber(oliveType: BaseType | null, deliveryNumber: number): string {
    if (!oliveType?.name) return '';
    const year = new Date().getFullYear().toString().slice(-2);
    const paddedNumber = deliveryNumber.toString().padStart(4, '0');
    return `${paddedNumber}${oliveType.name.toUpperCase()}${year}`;
  }
  onBack(): void {
    window.history.back();
  }
}
