import {AfterViewInit, Component, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatTableModule} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';
import {MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatCardModule} from '@angular/material/card';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import {MatSortModule} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';
import {Router} from '@angular/router';
import {combineLatest, forkJoin, Subscription} from 'rxjs';

import {SharedModule} from '../../shared/shared.module';
import {OsmDashboard} from '../../shared/modules/osm-dashboard/osm-dashboard';
import {DashboardConfig} from '../../shared/modules/osm-dashboard/models/dashboard-config';
import {UnifiedDelivery} from '../../shared/models/UnifiedDelivery';
import {BaseType} from '../../shared/models/base-type';
import {UnifiedDeliveryService} from '../../shared/services/delivery.service';
import {GenericTypeService} from '../../shared/services/generic-type.service';
import {TypeCategory} from '../../shared/models/type-category.enum';
import {SupplierType} from '../../shared/models/supplier-type';
import {SupplierTypeService} from '../../shared/services/supplier.service';

import {PdfGeneratorService} from '../../shared/services/pdf-generator.service';
import {OIL_DELIVERY_DASHBOARD} from './OIL_DELIVERY_DASHBOARD';
import {AppParameterService} from '../../shared/services/AppParameterService';
import {getOilPdfConfig} from "./oil-pdf.config";
import {ToastService} from '../../shared/services/toast.service';
import {getControlQualitePdfConfig} from '../quality-control-list/PDF-controlQualite.config';
import {getProductionPdfConfig} from "../reception-list/production-pdf.config";

/* ──────────────────────────────────────────────────────────── */
/* validators                                                   */
/* ──────────────────────────────────────────────────────────── */

export const netNotGreaterThanGross: ValidatorFn = (g: AbstractControl): ValidationErrors | null => {
  const brut = g.get('poidsBrute')?.value;
  const net = g.get('poidsNet')?.value;
  return brut != null && net != null && net > brut ? { netGreater: true } : null;
};

/* ──────────────────────────────────────────────────────────── */
/* component                                                    */

/* ──────────────────────────────────────────────────────────── */

@Component({
  selector: 'app-oil-reception',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatCardModule,
    MatExpansionModule,
    ReactiveFormsModule,
    MatSortModule,
    SharedModule,
    OsmDashboard
  ],
  templateUrl: './oil-reception.component.html',
  styleUrl: './oil-reception.component.scss'
})
export class OilReceptionComponent implements OnInit, OnDestroy ,AfterViewInit{
  @ViewChild('setPriceDialog') setPriceDialogTemplate!: TemplateRef<unknown>;
  @ViewChild('dashboard') dashboard!: OsmDashboard;
  @ViewChild('paymentDetailsDialog') paymentDetailsDialogTemplate!: TemplateRef<unknown>;
  paymentDetailsForm!: FormGroup;

  /* ——— state ——— */
  loading = false;
  isEditing = false;

  deliveries: UnifiedDelivery[] = [];
  receptionForm: FormGroup;

  regions: BaseType[] = [];
  suppliers: SupplierType[] = [];
  oilVarieties: BaseType[] = [];
  oliveTypes: BaseType[] = [];
  setPriceForm!: FormGroup;
  isLoading: boolean = false;

  dashboardConfig: DashboardConfig = OIL_DELIVERY_DASHBOARD;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  selectedRow: UnifiedDelivery | null = null;
  OilDelevery: UnifiedDelivery | null = null;
  protected originalOliveReception: UnifiedDelivery;
  private subs = new Subscription();
  private readonly prixbase = 'PRIX_BASE';
  private prix_base: number;

  constructor(
    private fb: FormBuilder,
    private parameterService: AppParameterService,
    private deliveryService: UnifiedDeliveryService,
    private genericTypeService: GenericTypeService,
    private supplierService: SupplierTypeService,
    private toast: ToastService,
    private router: Router,
    private pdfService: PdfGeneratorService,
    private dialog: MatDialog,
    private pdfGeneratorService: PdfGeneratorService,

  ) {
    this.receptionForm = this.fb.group(
      {
        /* core fields */
        deliveryType: ['OIL', Validators.required],
        deliveryNumber: ['', Validators.required],
        lotNumber: ['', Validators.required],
        globalLotNumber: [null],

        deliveryDate: [new Date(), Validators.required],
        region: [null, Validators.required],

        poidsBrute: [0, Validators.min(0)],
        poidsNet: [0, Validators.min(0)],

        matriculeCamion: ['', Validators.required],
        etatCamion: ['', Validators.required],

        supplier: [null, Validators.required],

        /* oil-specific details */
        oilVariety: [null, [Validators.required]],
        oliveType: [null, [Validators.required]], // still used to stamp the lot code
        oilQuantity: [null, Validators.min(0)],
        unitPrice: [null, Validators.min(0)],
        price: [null, Validators.min(0)],
        paidAmount: [null, Validators.min(0)],
        unpaidAmount: [null, Validators.min(0)]
      },
      { validators: netNotGreaterThanGross }
    );
  }

  /* ——— lifecycle ——— */

  ngOnInit(): void {
    this.loading = true;
    this.parameterService.getByCode(this.prixbase).subscribe({
      next: (param) => {
        const value = parseFloat(param.value);
        if (!isNaN(value)) {
          this.prix_base = value;
        }
      },
      error: () => {
        console.warn('Prix de trituration introuvable');
      }
    });
    this.setPriceForm = this.fb.group({
      unitPrice: [0, Validators.required],
      price: [{ value: 0, disabled: true }, Validators.required]
    });

    forkJoin([
      this.genericTypeService.getAllTypes(TypeCategory.OIL_VARIETY),
      this.genericTypeService.getAllTypes(TypeCategory.OLIVE_TYPE),
      this.genericTypeService.getAllTypes(TypeCategory.REGION),
      this.supplierService.getAllSuppliers(),
      this.deliveryService.getAllDeliveriesList()
    ]).subscribe({
      next: ([oilVarieties, oliveTypes, regions, suppliers, deliveries]) => {
        this.oilVarieties = oilVarieties.success ? oilVarieties.data : [];
        this.oliveTypes = oliveTypes.success ? oliveTypes.data : [];
        this.regions = regions.success ? regions.data : [];
        this.suppliers = suppliers.success ? suppliers.data : [];
        this.deliveries = deliveries.success ? deliveries.data : [];

        const deliveryCount = this.deliveries.length;
        const maxLot = this.maxLotNumber();

        this.receptionForm.patchValue({
          deliveryNumber: deliveryCount + 1,
          lotNumber: maxLot + 1
        });

        this.setupOliveTypeSubscription();
        this.setupAutoCalculations();

        this.loading = false;
      },
      error: () => {
        this.toast.error('Erreur lors du chargement des données initiales.');
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  /* ——— helpers ——— */

  selectReception(d?: UnifiedDelivery): void {
    if (d?.id) {
      this.router.navigate(['/reception/reception-huile', d.id]);
    } else {
      this.router.navigate(['/reception/reception-huile', 'new']);
    }
  }

  viewDelivery(d: UnifiedDelivery): void {
    this.router.navigate(['reception/reception-details', d.id]);
  }

  QualityControl(d: UnifiedDelivery): void {
    this.router.navigate(['/reception/quality', d.id]);
  }

  /* ——— UI actions ——— */

  generateBonReception(delivery: UnifiedDelivery): void {
    const config = getOilPdfConfig(delivery);
    this.pdfService.generatePdf(config);
  }

  generateBonProduction(delivery: UnifiedDelivery): void {
    const parameters = JSON.parse(localStorage.getItem('osm_app_parameters') || '{}');
    const config = getProductionPdfConfig(delivery, parameters);
    this.pdfGeneratorService.generatePdf(config);
  }


  /* ——— data loading & table helpers ——— */

  /**
   * Handles row actions triggered from the dashboard.
   * This method processes different actions based on the delivery status and available operations.
   *
   * @param e Object containing the row data and action to perform
   */
  onRowAction(e: { row: UnifiedDelivery; action: string }): void {
    console.log(`[OilReception] Processing action: ${e.action} for delivery: ${e.row.lotNumber}`);

    if (!e.row || !e.action) {
      console.error('[OilReception] Invalid action data:', e);
      this.toast.warning("Données d'action invalides");
      return;
    }

    try {
      switch (e.action) {
        case 'READ':
          console.log(`[OilReception] Viewing delivery: ${e.row.lotNumber}`);
          this.viewDelivery(e.row);
          break;

        case 'UPDATE':
          console.log(`[OilReception] Editing delivery: ${e.row.lotNumber}`);
          this.selectReception(e.row);
          break;

        case 'QUALITY':
        case 'OIL_QUALITY':
        case 'UPDATE_OIL_QUALITY':
          console.log(`[OilReception] Opening quality control for delivery: ${e.row.lotNumber}`);
          this.QualityControl(e.row);
          break;

        case 'SET_PRICE':
          console.log(`[OilReception] Setting price for delivery: ${e.row.lotNumber}`);
          this.setPrice(e.row);
          break;

        case 'GEN_PDF_PRODUCTION':
          if (e.row) {
            this.generateBonProduction(e.row);
          }
          break;

        case 'COMPLETE_PAYMENT_DETAILS':
          console.log(`[OilReception] Opening payment details dialog for delivery: ${e.row.lotNumber}`);
          this.openPaymentDetailsDialog(e.row);
          break;

        case 'GEN_PDF':
          if (e.row) {
            console.log(`[OilReception] Generating PDF for delivery: ${e.row.lotNumber}`);
            this.generateBonReception(e.row);
          }
          break;
          case 'GEN_PDF_QC_OIL':
          if (e.row.qualityControlResults) {
            console.log(`[OilReception] Generating PDF for delivery: ${e.row.lotNumber}`);
               const deliveryType = e.row.deliveryType?.toUpperCase() || '';
              const config = getControlQualitePdfConfig(e.row, deliveryType);
              this.pdfService.generatePdf(config);
          }
          break;

        default:
          console.warn(`[OilReception] Unknown action: ${e.action} for delivery: ${e.row.lotNumber}`);
          this.toast.info(`Action non reconnue: ${e.action}`);
          break;
      }
    } catch (error) {
      console.error(`[OilReception] Error processing action ${e.action} for delivery ${e.row.lotNumber}:`, error);
      this.toast.error(`Erreur lors du traitement de l'action: ${e.action}`);
    }
  }

  confirmPrice(dialogRef: MatDialogRef<unknown>): void {
    if (!this.setPriceForm.valid || !this.selectedRow) return;

    // Met à jour les champs
    this.selectedRow.unitPrice = this.setPriceForm.get('unitPrice')?.value;
    this.selectedRow.price = this.setPriceForm.get('price')?.value;

    this.isLoading = true;

    this.deliveryService.updatePricing(this.selectedRow.id, this.selectedRow.unitPrice!).subscribe({
      next: () => {
        dialogRef.close(); // Ferme le dialog après succès
        this.isLoading = false;
        this.dashboard.refrechData();
        this.toast.success();
      },
      error: () => {
        this.toast.error("Erreur lors de l'enregistrement du prix." );
        this.isLoading = false;
      }
    });
  }

  /**
   * Opens the payment details dialog for oil reception.
   * This method is called when the COMPLETE_PAYMENT_DETAILS action is triggered.
   * Includes comprehensive validation, error handling, and loading states.
   *
   * @param row The oil delivery row that needs payment details completion
   */
  openPaymentDetailsDialog(row: UnifiedDelivery): void {
    this.deliveryService.getDeliveryByLotNumber(row.lotOliveNumber!).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.originalOliveReception = res.data;
          console.log('this.originalOliveReception');
          console.log(this.originalOliveReception);
          // Move dialog open logic here
          this.selectedRow = row;
          this.isLoading = true;
          const unitPrice = this.validateAndGetNumber(row.unitPrice, 0, 'unitPrice');
          const quantity = this.validateAndGetNumber(row.oilQuantity, 0, 'oilQuantity');
          const total = unitPrice * quantity;
          this.paymentDetailsForm = this.fb.group({
            unitPrice: [unitPrice, [Validators.required, Validators.min(0.01)]],
            quantity: [quantity, [Validators.required, Validators.min(0.01)]],
            total: [{ value: total, disabled: true }],
            unpaidAmount: [this.validateAndGetNumber(this.originalOliveReception.unpaidAmount, 0, 'unpaidAmount')]
          });
          this.setupPaymentFormSubscriptions();
          this.openPaymentDialog();
        } else {
          console.log('Impossible de charger les détails de la réception.');
        }
      },
      error: (err) => {
        console.error('Erreur de chargement :', err);
      }
    });
    // Remove dialog open logic from here
  }

  /**
   * Updates the total amount in the payment details form based on unit price and quantity.
   * Includes validation and error handling for calculation accuracy.
   */
  updatePaymentDetailsTotal(): void {
    if (!this.paymentDetailsForm) {
      console.warn('[OilReception] Payment details form is not initialized');
      return;
    }

    try {
      const unitPriceControl = this.paymentDetailsForm.get('unitPrice');
      const quantityControl = this.paymentDetailsForm.get('quantity');
      const totalControl = this.paymentDetailsForm.get('total');

      if (!unitPriceControl || !quantityControl || !totalControl) {
        console.error('[OilReception] Required form controls are missing');
        return;
      }

      const unitPrice = this.validateAndGetNumber(unitPriceControl.value, 0, 'unitPrice');
      const quantity = this.validateAndGetNumber(quantityControl.value, 0, 'quantity');

      // Calculate total with precision handling
      const total = this.calculateTotalWithPrecision(unitPrice, quantity);
      // Update total without triggering valueChanges to avoid infinite loop
      totalControl.setValue(total, { emitEvent: false });
    } catch (error) {
      console.error('[OilReception] Error updating payment details total:', error);
      // Set total to 0 if calculation fails
      this.paymentDetailsForm.get('total')?.setValue(0, { emitEvent: false });
    }
  }

  /**
   * Confirms and processes the payment details from the dialog.
   * This method updates the oil reception with payment information and calls the backend service.
   * Includes comprehensive validation, error handling, and loading states.
   *
   * @param dialogRef Reference to the dialog to close after processing
   */
  confirmPaymentDetails(dialogRef: MatDialogRef<unknown>): void {
    console.log(`[OilReception] Confirming payment details for delivery: ${this.selectedRow?.lotNumber}`);

    // Comprehensive form validation
    if (!this.paymentDetailsForm) {
      console.error('[OilReception] Payment details form is not initialized');
      this.toast.warning('Formulaire de paiement non initialisé');
      return;
    }

    if (!this.paymentDetailsForm.valid) {
      console.error('[OilReception] Payment details form is invalid:', this.paymentDetailsForm.errors);
      this.logFormValidationErrors();
      this.toast.warning('Formulaire de paiement invalide. Veuillez vérifier les champs.');
      return;
    }

    if (!this.selectedRow) {
      console.error('[OilReception] No selected row for payment confirmation');
      this.toast.warning('Aucune livraison sélectionnée');
      return;
    }

    if (!this.selectedRow.id) {
      console.error('[OilReception] Selected row has no ID');
      this.toast.warning('ID de livraison manquant');
      return;
    }

    try {
      this.isLoading = true;
      const formValue = this.paymentDetailsForm.getRawValue();
      const { unitPrice, quantity, total, unpaidAmount } = formValue;

      console.log(
        `[OilReception] Payment details - unitPrice: ${unitPrice}, quantity: ${quantity}, total: ${total}, unpaidAmount: ${unpaidAmount}`
      );

      // Comprehensive payment data validation
      const validationResult = this.validatePaymentData(unitPrice, quantity, total, unpaidAmount);
      if (!validationResult.isValid) {
        console.error('[OilReception] Payment validation failed:', validationResult.error);
        this.toast.error(validationResult.error || 'Erreur de validation');
        return;
      }

      // Update the selected row with payment details
      this.selectedRow.unitPrice = unitPrice;
      this.selectedRow.oilQuantity = quantity;
      this.selectedRow.price = total;
      this.selectedRow.unpaidAmount = unpaidAmount;

      console.log(`[OilReception] Updated selected row with payment details`);

      // Build ExchangePricingDto for backend processing
      const dto = {
        deliveryId: this.selectedRow.id,
        unitPrice: unitPrice,
        price: total,
        qualityGrade: this.selectedRow.categoryOliveOil || '', // Use quality grade if available
        oilUnitPrice: unitPrice,
        oilQuantity: quantity,
        oilTotalValue: total
      };

      console.log(`[OilReception] Sending payment data to backend:`, dto);

      // Call backend service to process payment with comprehensive error handling
      this.deliveryService.updatePrincingForPaymentreception(dto).subscribe({
        next: (response) => {
          console.log(`[OilReception] Payment processing successful for delivery: ${this.selectedRow?.lotNumber}`, response);
          dialogRef.close();
          this.dashboard.refrechData();
          this.toast.success();
        },
        error: (error) => {
          console.error(`[OilReception] Error processing payment:`, error);
          const errorMessage = this.getErrorMessageFromError(error);
          this.toast.error(`Erreur lors du traitement du paiement: ${errorMessage}` );
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error(`[OilReception] Unexpected error during payment confirmation:`, error);
      this.toast.error('Erreur inattendue lors de la confirmation du paiement');
      this.isLoading = false;
    }
  }

  /* ——— form patch & subscriptions ——— */

  /**
   * Returns the maximum allowed unit price so that unitPrice * quantity <= unpaidAmount
   */
  maxUnitPrice(): number {
    const unpaid = this.paymentDetailsForm?.get('unpaidAmount')?.value || 0;
    const quantity = this.paymentDetailsForm?.get('quantity')?.value || 1;
    if (quantity > 0) {
      return unpaid / quantity;
    }
    return unpaid;
  }

  /**
   * Returns the maximum allowed quantity so that unitPrice * quantity <= unpaidAmount
   */
  maxQuantity(): number {
    const unpaid = this.paymentDetailsForm?.get('unpaidAmount')?.value || 0;
    const unitPrice = this.paymentDetailsForm?.get('unitPrice')?.value || 1;
    if (unitPrice > 0) {
      return unpaid / unitPrice;
    }
    return unpaid;
  }



  private maxLotNumber(): number {
    const nums = this.deliveries
      .map((d) => d.lotNumber?.replace(/^\D+/, '') ?? '')
      .map((n) => parseInt(n, 10))
      .filter((n) => !isNaN(n));
    return nums.length ? Math.max(...nums) : 0;
  }

  private fetchDeliveries(): void {
    this.deliveryService.getAllDeliveriesList().subscribe((res) => {
      this.deliveries = res.success ? res.data.filter((d) => d.deliveryType === 'OIL') : [];
      if (!res.success) this.toast.error(res.message || 'Erreur lors du chargement des réceptions.');
      if (res.success) this.toast.success(res.message );
    });
  }

  private deleteDelivery(d: UnifiedDelivery): void {
    this.deliveryService.deleteUnifiedDelivery(d.id!).subscribe(
      (res) => {
        if (res.success) {
          this.fetchDeliveries();
          this.toast.success();
        }
      },
      () => this.toast.error('Erreur lors de la suppression.')
    );
  }



  private setupOliveTypeSubscription(): void {
    const sub = this.receptionForm.get('oliveType')!.valueChanges.subscribe((ol: BaseType | null) => {
      const num = this.receptionForm.get('deliveryNumber')?.value || this.deliveries.length + 1;
      const lot = this.generateLotNumber(ol, num);
      this.receptionForm.patchValue({ lotNumber: lot }, { emitEvent: false });
    });
    this.subs.add(sub);
  }

  private setupAutoCalculations(): void {
    const qty$ = this.receptionForm.get('oilQuantity')!.valueChanges;
    const unit$ = this.receptionForm.get('unitPrice')!.valueChanges;
    const paid$ = this.receptionForm.get('paidAmount')!.valueChanges;

    this.subs.add(
      combineLatest([qty$, unit$]).subscribe(([q, u]) => {
        const price = (q || 0) * (u || 0);
        this.receptionForm.patchValue({ price }, { emitEvent: false });
      })
    );

    this.subs.add(
      combineLatest([this.receptionForm.get('price')!.valueChanges, paid$]).subscribe(([price, paid]) => {
        const unpaid = (price || 0) - (paid || 0);
        this.receptionForm.patchValue({ unpaidAmount: unpaid }, { emitEvent: false });
      })
    );
  }

  private generateLotNumber(ol: BaseType | null, num: number): string {
    if (!ol?.name) return '';
    const year = new Date().getFullYear().toString().slice(-2);
    const nStr = num.toString().padStart(4, '0');
    return `${nStr}${ol.name.toUpperCase()}${year}`;
  }

  private setPrice(row: UnifiedDelivery): void {
    this.selectedRow = row;

    // Use prix_base if available, fallback to row.unitPrice
    const initialUnitPrice = this.prix_base || row.unitPrice || null;

    console.log('initialUnitPrice(): ' + initialUnitPrice);

    console.log('loadTriturationPriceFromParam(): ' + this.prix_base);

this.setPriceForm.get('unitPrice')?.setValue(initialUnitPrice);
    this.dialog.open(this.setPriceDialogTemplate, {
      width: 'auto',
      data: row,
      disableClose: true,
      panelClass: 'set-price-dialog'
    });
  }


  /**
   * Validates and converts a value to a number with fallback
   * @param value The value to validate
   * @param fallback The fallback value if validation fails
   * @param fieldName The field name for logging
   * @returns The validated number
   */
  private validateAndGetNumber(value: number | string | null | undefined, fallback: number, fieldName: string): number {
    const num = Number(value);
    if (isNaN(num) || num < 0) {
      console.warn(`[OilReception] Invalid ${fieldName}: ${value}, using fallback: ${fallback}`);
      return fallback;
    }
    return num;
  }

  /**
   * Sets up form subscriptions for payment details
   */
  private setupPaymentFormSubscriptions(): void {
    if (!this.paymentDetailsForm) return;

    // guard flag to avoid loops
    (this as any)._syncingPayment ??= false;

    const up = this.paymentDetailsForm.get('unitPrice')!;
    const qty = this.paymentDetailsForm.get('quantity')!;
    const tot = this.paymentDetailsForm.get('total')!;

    // subscribe: unitPrice -> quantity
    this.subs.add(up.valueChanges.subscribe(() => {
      if ((this as any)._syncingPayment) return;
      this.onUnitPriceChanged();
    }));
    this.subs.add(
      this.receptionForm.get('region')!.valueChanges.subscribe((region: BaseType | null) => {
        if (region?.name) {
          this.receptionForm.patchValue({ parcel: region.name }, { emitEvent: false });
        }
      })
    );
    // subscribe: quantity -> total
    this.subs.add(qty.valueChanges.subscribe(() => {
      if ((this as any)._syncingPayment) return;
      this.onQuantityChanged();
    }));

    // initial sync (compute total from current unitPrice*quantity)
    this.onQuantityChanged();
  }
  private onUnitPriceChanged(): void {
    if (!this.paymentDetailsForm) return;
    (this as any)._syncingPayment = true;
    try {
      const f = this.paymentDetailsForm;
      const unitPrice = Number(f.get('unitPrice')?.value) || 0;
      const total     = Number(f.get('total')?.value)     || 0;

      // quantity = total / unitPrice (with simple guards)
      let quantity = unitPrice > 0 ? (total / unitPrice) : 0;

      // respect your existing maxQuantity() cap if present
      if (typeof (this as any).maxQuantity === 'function') {
        const maxQ = (this as any).maxQuantity();
        if (quantity > maxQ) quantity = maxQ;
      }

      f.get('quantity')?.setValue(this.round3(Math.max(0, quantity)), { emitEvent: false });
    } finally {
      (this as any)._syncingPayment = false;
    }
  }
  private onQuantityChanged(): void {
    if (!this.paymentDetailsForm) return;
    (this as any)._syncingPayment = true;
    try {
      const f = this.paymentDetailsForm;
      const unitPrice = Number(f.get('unitPrice')?.value) || 0;
      let quantity    = Number(f.get('quantity') ?.value) || 0;

      // respect your existing maxQuantity() cap if present
      if (typeof (this as any).maxQuantity === 'function') {
        const maxQ = (this as any).maxQuantity();
        if (quantity > maxQ) {
          quantity = maxQ;
          f.get('quantity')?.setValue(this.round3(quantity), { emitEvent: false });
        }
      }

      const total = this.round3(unitPrice * quantity);
      f.get('total')?.setValue(total, { emitEvent: false });
    } finally {
      (this as any)._syncingPayment = false;
    }
  }
  private round3(n: number): number {
    return Math.round((n + Number.EPSILON) * 1000) / 1000;
  }

  /**
   * Opens the payment dialog with proper error handling
   */
  private openPaymentDialog(): void {
    try {
      console.log(`[OilReception] Opening payment details dialog`);
      this.dialog.open(this.paymentDetailsDialogTemplate, {
        width: '500px',
        data: this.selectedRow,
        disableClose: true,
        panelClass: 'payment-details-dialog'
      });
    } catch (error) {
      console.error(`[OilReception] Error opening dialog:`, error);
      this.toast.error("Erreur lors de l'ouverture du dialogue");
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Calculates total with proper precision handling to avoid floating point errors
   * @param unitPrice The unit price
   * @param quantity The quantity
   * @returns The calculated total with 2 decimal places
   */
  private calculateTotalWithPrecision(unitPrice: number, quantity: number): number {
    // Use multiplication and rounding to avoid floating point precision issues
    const total = Math.round(unitPrice * quantity * 100) / 100;
    return total;
  }

  /**
   * Validates payment data with comprehensive checks
   * @param unitPrice The unit price
   * @param quantity The quantity
   * @param total The total amount
   * @param unpaidAmount The unpaid amount
   * @returns Validation result with error message if invalid
   */
  private validatePaymentData(
    unitPrice: number,
    quantity: number,
    total: number,
    unpaidAmount: number
  ): {
    isValid: boolean;
    error?: string;
  } {
    // Validate unit price
    if (!unitPrice || unitPrice <= 0) {
      return { isValid: false, error: 'Prix unitaire doit être supérieur à 0' };
    }

    if (unitPrice > 10000) {
      // Reasonable upper limit
      return { isValid: false, error: 'Prix unitaire trop élevé' };
    }

    // Validate quantity
    if (!quantity || quantity <= 0) {
      return { isValid: false, error: 'Quantité doit être supérieure à 0' };
    }

    if (quantity > 100000) {
      // Reasonable upper limit
      return { isValid: false, error: 'Quantité trop élevée' };
    }

    // Validate total
    if (!total || total <= 0) {
      return { isValid: false, error: 'Montant total doit être supérieur à 0' };
    }

    // Validate calculation consistency
    const calculatedTotal = unitPrice * quantity;
    const tolerance = 0.01; // Allow for floating point precision
    if (Math.abs(calculatedTotal - total) > tolerance) {
      return { isValid: false, error: 'Incohérence dans le calcul du montant total' };
    }

    // Validate unpaid amount
    if (unpaidAmount < 0) {
      return { isValid: false, error: 'Montant impayé ne peut pas être négatif' };
    }
//todo check it again in paiment  mixed
    if (unpaidAmount < total) {
      return { isValid: false, error: 'Montant impayé ne peut pas dépasser le montant total' };
    }

    return { isValid: true };
  }

  /**
   * Logs form validation errors for debugging
   */
  private logFormValidationErrors(): void {
    if (!this.paymentDetailsForm) return;

    Object.keys(this.paymentDetailsForm.controls).forEach((key) => {
      const control = this.paymentDetailsForm.get(key);
      if (control && control.errors) {
        console.error(`[OilReception] Form control '${key}' has errors:`, control.errors);
      }
    });
  }

  /**
   * Extracts user-friendly error message from error object
   * @param error The error object
   * @returns User-friendly error message
   */
  private getErrorMessageFromError(error: unknown): string {
    const errorObj = error as { error?: { message?: string }; message?: string; status?: number };

    if (errorObj?.error?.message) {
      return errorObj.error.message;
    }
    if (errorObj?.message) {
      return errorObj.message;
    }
    if (errorObj?.status === 404) {
      return 'Livraison non trouvée';
    }
    if (errorObj?.status === 400) {
      return 'Données de paiement invalides';
    }
    if (errorObj?.status === 500) {
      return 'Erreur serveur';
    }
    return 'Erreur inconnue';
  }

  ngAfterViewInit(): void {
    this.setPriceForm.get('unitPrice')?.valueChanges.subscribe((unitPrice) => {
      const quantity = this.selectedRow ?.poidsNet || this.selectedRow ?.oilQuantity || 0;
      const price = parseFloat(unitPrice) * quantity;
      this.setPriceForm.get('price')?.setValue(+price.toFixed(3));
    });
  }
}
