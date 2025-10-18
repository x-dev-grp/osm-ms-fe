import { AfterViewInit, Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCardModule } from '@angular/material/card';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { combineLatest, forkJoin, Subscription } from 'rxjs';

import { SharedModule } from '../../shared/shared.module';
import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';
import { DashboardConfig } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { UnifiedDelivery } from '../../shared/models/UnifiedDelivery';
import { BaseType } from '../../shared/models/base-type';
import { UnifiedDeliveryService } from '../../shared/services/delivery.service';
import { GenericTypeService } from '../../shared/services/generic-type.service';
import { TypeCategory } from '../../shared/models/type-category.enum';
import { SupplierType } from '../../shared/models/supplier-type';
import { SupplierTypeService } from '../../shared/services/supplier.service';

import { PdfGeneratorService } from '../../shared/services/pdf-generator.service';
import { OIL_DELIVERY_DASHBOARD } from './OIL_DELIVERY_DASHBOARD';
import { AppParameterService } from '../../shared/services/AppParameterService';
import { ToastService } from '../../shared/services/toast.service';
import { PaymentDetailsDialogComponent } from './payment-details-dialog/payment-details-dialog.component';
import { getProductionPdfConfig } from '../pdf-config/production-pdf.config';
import { getOilPdfConfig } from '../pdf-config/reception-oil-pdf.config';
import { getControlQualitePdfConfig } from '../pdf-config/controlQualite.config';

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
export class OilReceptionComponent implements OnInit, OnDestroy, AfterViewInit {
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
  protected originalOliveReceptions: UnifiedDelivery[];
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
    private pdfGeneratorService: PdfGeneratorService
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
    let config = getOilPdfConfig(delivery);
    config = { ...config, layout: 'oilReceptionForm' };
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
        case 'COMPLETE_PAYMENT_DETAILS':
          console.log(`[OilReception] Opening payment details dialog for delivery: ${e.row.lotNumber}`);
          this.openPaymentDetailsDialogFromParent(e.row);
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
        this.toast.error("Erreur lors de l'enregistrement du prix.");
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
  openPaymentDetailsDialogFromParent(row: any) {
    this.deliveryService.getDeliveryByLotNumber(row.lotOliveNumber!).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.originalOliveReception = res.data;
          console.log('this.originalOliveReception');
          console.log(this.originalOliveReception);
          // Move dialog open logic here
          this.selectedRow = row;
          const maxQty = Number(this.originalOliveReception?.oilQuantity);

          // Derive maxTotal = “original olive delivery price” / unpaid amount to allocate
          // Map this to whatever field your backend provides:
          // e.g., originalOliveReception.price OR (total - paid)
          const maxTotal = (() => {
            const total = Number(this.originalOliveReception?.unpaidAmount);
            const paid = Number(this.originalOliveReception?.paidAmount);
            return Math.max(0, (total || 0) - (paid || 0));
          })();

          // Optional seeds from current row
          const initialUnitPrice = Number(row?.unitPrice) || null;
          const initialQuantity = Number(row?.quantity) || null;

          const ref = this.dialog.open(PaymentDetailsDialogComponent, {
            width: '720px',
            autoFocus: false,
            restoreFocus: false,
            data: { maxQty, maxTotal, initialUnitPrice, initialQuantity } // <— key inputs
          });

          ref.afterClosed().subscribe((result) => {
            if (!result) return;
            // result = { unitPrice, quantity, total }
            // persist these on the row or post to backend as needed
            row.unitPrice = result.unitPrice;
            row.oilQuantity = result.quantity;
            row.paidAmount = result.total;
            row.unpaidAmount = this.originalOliveReception.unpaidAmount! - row.paidAmount;
            const validationResult = this.validatePaymentData(row.unitPrice, row.oilQuantity, row.paidAmount, row.unpaidAmount);
            if (!validationResult.isValid) {
              console.error('[OilReception] Payment validation failed:', validationResult.error);
              this.toast.error(validationResult.error || 'Erreur de validation');
              return;
            }
            const dto = {
              deliveryId: this.selectedRow!.id,
              unitPrice: result.unitPrice,
              price: result.total,
              qualityGrade: this.selectedRow!.categoryOliveOil || '', // Use quality grade if available
              oilUnitPrice: result.unitPrice,
              oilQuantity: result.quantity,
              oilTotalValue: result.total
            };
            this.deliveryService.updatePrincingForPaymentreception(dto).subscribe({
              next: (response) => {
                console.log(`[OilReception] Payment processing successful for delivery: ${this.selectedRow?.lotNumber}`, response);
                this.dashboard.refrechData();
                this.toast.success();
              },
              error: (error) => {
                console.error(`[OilReception] Error processing payment:`, error);
                const errorMessage = this.getErrorMessageFromError(error);
                this.toast.error(`Erreur lors du traitement du paiement: ${errorMessage}`);
              },
              complete: () => {
                this.isLoading = false;
              }
            });
          });
          // Call backend service to process payment with comprehensive error handling
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
      this.toast.warning('Aucune réception sélectionnée');
      return;
    }

    if (!this.selectedRow.id) {
      console.error('[OilReception] Selected row has no ID');
      this.toast.warning('ID de réception manquant');
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
          this.toast.error(`Erreur lors du traitement du paiement: ${errorMessage}`);
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

  ngAfterViewInit(): void {
    this.setPriceForm.get('unitPrice')?.valueChanges.subscribe((unitPrice) => {
      const quantity = this.selectedRow?.poidsNet || this.selectedRow?.oilQuantity || 0;
      const price = parseFloat(unitPrice) * quantity;
      this.setPriceForm.get('price')?.setValue(+price.toFixed(3));
    });
  }

  private maxLotNumber(): number {
    const nums = this.deliveries
      .map((d) => d.lotNumber?.replace(/^\D+/, '') ?? '')
      .map((n) => parseInt(n, 10))
      .filter((n) => !isNaN(n));
    return nums.length ? Math.max(...nums) : 0;
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

    if (this.selectedRow.globalLotNumber) {
      this.deliveryService.getDeliveriesByGlobalLotNumber(row.globalLotNumber!).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            // NOTE: global lot returns a list
            const list: any[] = Array.isArray(res.data) ? res.data : [res.data];
            this.originalOliveReceptions = list as any[];
            console.log('this.originalOliveReception (global lot)', this.originalOliveReceptions);

            // Σ(oliveQty × oliveUnitPrice)
            const totalCost = this.originalOliveReceptions.reduce((acc, d: any) => acc + d.price, 0);

            // Σ(oilQuantity) across all items in the global lot
            const totalOilQty = this.originalOliveReceptions.reduce((acc, d: any) => acc + d?.oilQuantity, 0);

            // Derived unit price for oil (rounded 3)
            const computedUnitPrice = totalOilQty > 0 ? Number((totalCost / totalOilQty).toFixed(3)) : 0;

            // Max total across the lot
            const totalUnpaid = this.originalOliveReceptions.reduce((a, d: any) => a + Number(d?.unpaidAmount || 0), 0);
            const totalPaid = this.originalOliveReceptions.reduce((a, d: any) => a + Number(d?.paidAmount || 0), 0);
            const maxTotal = Math.max(0, totalUnpaid - totalPaid);

            // Seeds: prefer row’s oil qty; else total
            const quantity = Number(row?.oilQuantity || 0) || totalOilQty || null;

            // Fallback chain for unit price: computed → prix_base → row.unitPrice

            const total = computedUnitPrice != null && quantity != null ? Math.round(computedUnitPrice * quantity * 1000) / 1000 : null;

            // Patch form before opening
            this.setPriceForm.patchValue({
              unitPrice: computedUnitPrice,
              quantity: quantity,
              total: total
            });

            // Open dialog here (after values are ready)
            this.dialog.open(this.setPriceDialogTemplate, {
              width: 'auto',
              data: row,
              disableClose: true,
              panelClass: 'set-price-dialog'
            });
          } else {
            console.log('Impossible de charger les détails de la réception (lot global).');
          }
        },
        error: (err) => {
          console.error('Erreur de chargement (lot global) :', err);
        }
      });

      // Prevent the old bottom block from opening the dialog too early
      return;
    } else if (row.lotOliveNumber) {
      this.deliveryService.getDeliveryByLotNumber(row.lotOliveNumber!).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            // NOTE: global lot returns a list
            this.originalOliveReception = Array.isArray(res.data) ? res.data : res.data;
            console.log('this.originalOliveReception (global lot)', this.originalOliveReception);

            // Σ(oliveQty × oliveUnitPrice)
            const totalCost = this.originalOliveReception.price || 0;
            // Σ(oilQuantity) across all items in the global lot
            const totalOilQty = this.originalOliveReception.oilQuantity || 0;
            // Derived unit price for oil (rounded 3)
            const computedUnitPrice = totalOilQty > 0 ? Number((totalCost / totalOilQty).toFixed(3)) : 0;

            // Max total across the lot
            const totalUnpaid = this.originalOliveReception.unpaidAmount || 0;
            const totalPaid = this.originalOliveReception.paidAmount || 0;
            const maxTotal = Math.max(0, totalUnpaid - totalPaid);

            // Seeds: prefer row’s oil qty; else total
            let quantity = Number(row?.oilQuantity || 0).toFixed(3) || totalOilQty || 0;

            const total = computedUnitPrice != null && quantity != null ? Number(computedUnitPrice * totalOilQty).toFixed(3) : null;

            // Patch form before opening
            this.setPriceForm.patchValue({
              unitPrice: computedUnitPrice,
              quantity: totalOilQty,
              total: total
            });

            // Open dialog here (after values are ready)
            this.dialog.open(this.setPriceDialogTemplate, {
              width: 'auto',
              data: row,
              disableClose: true,
              panelClass: 'set-price-dialog'
            });
          } else {
            console.log('Impossible de charger les détails de la réception (lot global).');
          }
        },
        error: (err) => {
          console.error('Erreur de chargement :', err);
        }
      });
    } else {
      const initialUnitPrice = this.prix_base || row.unitPrice || null;
      this.setPriceForm.get('unitPrice')?.setValue(initialUnitPrice);
      this.dialog.open(this.setPriceDialogTemplate, {
        width: 'auto',
        data: row,
        disableClose: true,
        panelClass: 'set-price-dialog'
      });
    }

    // (Removed) Old bottom block that opened the dialog immediately.
    // It caused the dialog to open before async values were computed.
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
    this.subs.add(
      up.valueChanges.subscribe(() => {
        if ((this as any)._syncingPayment) return;
        this.onUnitPriceChanged();
      })
    );
    this.subs.add(
      this.receptionForm.get('region')!.valueChanges.subscribe((region: BaseType | null) => {
        if (region?.name) {
          this.receptionForm.patchValue({ parcel: region.name }, { emitEvent: false });
        }
      })
    );
    // subscribe: quantity -> total
    this.subs.add(
      qty.valueChanges.subscribe(() => {
        if ((this as any)._syncingPayment) return;
        this.onQuantityChanged();
      })
    );

    // initial sync (compute total from current unitPrice*quantity)
    this.onQuantityChanged();
  }

  private onUnitPriceChanged(): void {
    if (!this.paymentDetailsForm) return;
    (this as any)._syncingPayment = true;
    try {
      const f = this.paymentDetailsForm;
      const unitPrice = Number(f.get('unitPrice')?.value) || 0;
      const total = Number(f.get('total')?.value) || 0;

      // quantity = total / unitPrice (with simple guards)
      let quantity = unitPrice > 0 ? total / unitPrice : 0;

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
      let quantity = Number(f.get('quantity')?.value) || 0;

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
      return 'réception non trouvée';
    }
    if (errorObj?.status === 400) {
      return 'Données de paiement invalides';
    }
    if (errorObj?.status === 500) {
      return 'Erreur serveur';
    }
    return 'Erreur inconnue';
  }
}
