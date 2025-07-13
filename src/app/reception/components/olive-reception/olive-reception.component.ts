import {Component, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatTableModule} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';
import {MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatCardModule} from '@angular/material/card';
import {MatSortModule} from '@angular/material/sort';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatPaginator} from '@angular/material/paginator';
import {Router} from '@angular/router';
import {Subscription, tap} from 'rxjs';
import {TranslateService} from '@ngx-translate/core';

import {SharedModule} from '../../../demo/shared/shared.module';
import {OsmDashboard} from '../../../shared/modules/osm-dashboard/osm-dashboard';
import {DashboardConfig} from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import {UnifiedDelivery} from '../../../shared/models/UnifiedDelivery';
import {UnifiedDeliveryService} from '../../../shared/services/delivery.service';

import {OLIVE_DELIVERY_DASHBOARD} from './OLIVE_DELIVERY_DASHBOARD';
import {PdfGeneratorService} from '../../../shared/services/pdf-generator.service';
import {ApiResponse} from '../../../shared/models/api-response';
import {OliveLotStatus} from '../../../shared/models/OliveLotStatus';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {OperationType} from '../../../shared/models/operation-type.enum';
import {ExchangePricingDto} from '../../../shared/models/ExchangePricingDto';

@Component({
  selector: 'app-olive-reception',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatCardModule,
    MatSortModule,
    SharedModule,
    OsmDashboard],
  templateUrl: './olive-reception.component.html',
  styleUrls: ['./olive-reception.component.scss']
})
export class OliveReceptionComponent implements OnInit, OnDestroy {
  @ViewChild('dashboard') dashboard!: OsmDashboard;
  @ViewChild('setPriceDialog') setPriceDialogTemplate!: TemplateRef<object>;
  formOpen = false;
  isEditing = false;
  selectedDelivery?: UnifiedDelivery;
  deliveries: UnifiedDelivery[] = [];
  dashboardConfig: DashboardConfig = OLIVE_DELIVERY_DASHBOARD;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  selectedRow?: UnifiedDelivery;
  setPriceForm!: FormGroup;

  private subs = new Subscription();
  isLoading: boolean = false;
  qualityGrade: { id: string; name: string }[] = [
    { id: 'vierge_extra', name: 'Extra Vierge' },
    { id: 'vierge', name: 'Vierge' },
    { id: 'lampante', name: 'Lampante' }
  ];

  constructor(
    private deliveryService: UnifiedDeliveryService,
    private snackBar: MatSnackBar,
    private router: Router,
    private pdfService: PdfGeneratorService,
    private translate: TranslateService,

    private fb: FormBuilder,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.fetchDeliveries();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  selectReception(d?: UnifiedDelivery): void {
    if (d?.id) {
      this.router.navigate(['/reception/reception-olive', d.id]);
    } else {
      this.router.navigate(['/reception/reception-olive', 'new']);
    }
  }

  private fetchDeliveries(): void {
    this.subs.add(
      this.deliveryService.getAllDeliveriesList().subscribe((res) => {
        this.deliveries = res.success ? res.data.filter((d) => d.deliveryType === 'OLIVE') : [];
        if (!res.success) this.toast(this.translate.instant('DELIVERIES.MESSAGES.LOAD_ERROR'));
      })
    );
  }

  viewDelivery(d: UnifiedDelivery): void {
    this.router.navigate(['reception/reception-details', d.id]);
  }

  QualityControl(d: UnifiedDelivery): void {
    this.router.navigate(['reception/quality', d.id]);
  }

  sendToProduction(d: UnifiedDelivery): void {
    if (d.id) {
       this.subs.add(
        this.deliveryService.updateStatus(d.id,OliveLotStatus.IN_PROGRESS).subscribe(
          (res: ApiResponse<void>) => {
            if (res.success) {
              this.dashboard.refrechData();
            } else {
              this.toast(this.translate.instant('DELIVERIES.MESSAGES.SENT_TO_PRODUCTION_ERROR'));
            }
          },
          () => this.toast(this.translate.instant('DELIVERIES.MESSAGES.SENT_TO_PRODUCTION_ERROR'))
        )
      );
    }
  }

  cancelDelivery(d: UnifiedDelivery): void {
    if (d.id) {
      const updatedDelivery = { ...d, status: OliveLotStatus.CANCELLED };
      this.subs.add(
        this.deliveryService.updateUnifiedDelivery(updatedDelivery).subscribe(
          (res: ApiResponse<UnifiedDelivery>) => {
            if (res.success) {
              this.fetchDeliveries();
              this.toast(this.translate.instant('DELIVERIES.MESSAGES.CANCELLED_SUCCESS'));
            } else {
              this.toast(this.translate.instant('DELIVERIES.MESSAGES.CANCELLED_ERROR'));
            }
          },
          () => this.toast(this.translate.instant('DELIVERIES.MESSAGES.CANCELLED_ERROR'))
        )
      );
    }
  }


  genererBonReception(delivery: UnifiedDelivery): void {
    this.pdfService.generateReceptionPdf(delivery, 'OLIVE');
  }

  onRowAction(e: { row: UnifiedDelivery; action: string }): void {
    switch (e.action) {
      case 'READ':
        this.viewDelivery(e.row);
        break;
      case 'UPDATE':
        this.selectReception(e.row);
        break;
      case 'DELETE':
        if (e.row.id) this.deleteDelivery(e.row);
        break;
      case 'GEN_PDF':
        if (e.row) {
          this.genererBonReception(e.row);
        }
        break;
      case 'SET_PRICE':
        this.setPrice(e.row);
        break;

        case 'OIL_OUT_TRANSACTION':
        this.createOilTransactionFromExchange(e.row);
        break;
      case 'TO_PROD':
        this.sendToProduction(e.row);
        break;
      case 'OLIVE_QUALITY':
      case 'QUALITY':
        this.QualityControl(e.row);
        break;
      case 'CANCEL':
        this.cancelDelivery(e.row);
        break;
    }
  }

  private deleteDelivery(d: UnifiedDelivery): void {
    this.subs.add(
      this.deliveryService.deleteUnifiedDelivery(d.id!).subscribe(
        (res) => {
          if (res.success) {
            this.fetchDeliveries();
            this.toast(this.translate.instant('DELIVERIES.MESSAGES.DELETE_SUCCESS'));
          }
        },
        () => this.toast(this.translate.instant('DELIVERIES.MESSAGES.DELETE_ERROR'))
      )
    );
  }

  private toast(message: string, duration = 3000): void {
    this.snackBar.open(message, this.translate.instant('STANDARD.BTNS.CANCEL'), {
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['']
    });
  }

  private setPrice(row: UnifiedDelivery): void {
    this.selectedRow = row;

    // Always start with standard pricing fields
    const poidsNet = row.poidsNet || 0;
    const initialUnitPrice = row.unitPrice || 0;
    const initialPrice = initialUnitPrice * poidsNet;

    if (row.operationType === OperationType.EXCHANGE) {
      // Load oil types for exchange deliveries
      // this.getOilTypes(); // This line is removed as oilTypes is now static

      // Handle exchange delivery type - add oil fields to standard form
      const initialOilQuantity = row.oilQuantity || 0;
      // For exchange, oil total value should equal olive total price
      const initialOilTotalValue = initialPrice; // Equal to olive total price
      const initialOilUnitPrice = initialOilQuantity > 0 ? initialOilTotalValue / initialOilQuantity : 0;
      const initialQualityGrade = row.oilType?.id || this.qualityGrade[0]?.id || '';

      this.setPriceForm = this.fb.group({
        // Standard fields
        unitPrice: [initialUnitPrice, Validators.required],
        price: [initialPrice, Validators.required],
        // Exchange fields
        qualityGrade: [initialQualityGrade, Validators.required],
        oilUnitPrice: [initialOilUnitPrice, Validators.required],
        oilQuantity: [initialOilQuantity, Validators.required],
        oilTotalValue: [initialOilTotalValue, Validators.required]
      });

      // Update standard price live as unitPrice changes
      this.setPriceForm.get('unitPrice')?.valueChanges.subscribe((unitPrice: string) => {
        const price = (parseFloat(unitPrice) || 0) * poidsNet;
        this.setPriceForm.get('price')?.setValue(+price.toFixed(3), { emitEvent: false });

        // For exchange, update oil total value to match olive total price
        this.setPriceForm.get('oilTotalValue')?.setValue(+price.toFixed(3), { emitEvent: false });

        // Update oil unit price based on oil quantity
        const oilQuantity = this.setPriceForm.get('oilQuantity')?.value || 0;
        if (oilQuantity > 0) {
          const newOilUnitPrice = price / oilQuantity;
          this.setPriceForm.get('oilUnitPrice')?.setValue(+newOilUnitPrice.toFixed(3), { emitEvent: false });
        }
      });

      // Update oil unit price when oil quantity changes (keeping total value equal to olive price)
      this.setPriceForm.get('oilQuantity')?.valueChanges.subscribe((oilQuantity: number) => {
        const oliveTotalPrice = this.setPriceForm.get('price')?.value || 0;
        this.setPriceForm.get('oilTotalValue')?.setValue(+oliveTotalPrice.toFixed(3), { emitEvent: false });

        if (parseFloat(oilQuantity.toString()) > 0) {
          const newOilUnitPrice = oliveTotalPrice / parseFloat(oilQuantity.toString());
          this.setPriceForm.get('oilUnitPrice')?.setValue(+newOilUnitPrice.toFixed(3), { emitEvent: false });
        }
      });

      // Update oil quantity when oil unit price changes (keeping total value equal to olive price)
      this.setPriceForm.get('oilUnitPrice')?.valueChanges.subscribe((oilUnitPrice: number) => {
        const oliveTotalPrice = this.setPriceForm.get('price')?.value || 0;
        this.setPriceForm.get('oilTotalValue')?.setValue(+oliveTotalPrice.toFixed(3), { emitEvent: false });

        if (parseFloat(oilUnitPrice.toString()) > 0) {
          const newOilQuantity = oliveTotalPrice / parseFloat(oilUnitPrice.toString());
          this.setPriceForm.get('oilQuantity')?.setValue(+newOilQuantity.toFixed(3), { emitEvent: false });
        }
      });

    } else {
      // Handle standard delivery type - only standard fields
      this.setPriceForm = this.fb.group({
        unitPrice: [initialUnitPrice, Validators.required],
        price: [initialPrice, Validators.required]
      });

      // Update price live as unitPrice changes
      this.setPriceForm.get('unitPrice')?.valueChanges.subscribe((unitPrice: string) => {
        const price = (parseFloat(unitPrice) || 0) * poidsNet;
        this.setPriceForm.get('price')?.setValue(+price.toFixed(3), { emitEvent: false });
      });
    }

    this.dialog.open(this.setPriceDialogTemplate, {
      width: '500px',
      data: row,
      disableClose: true,
      panelClass: 'set-price-dialog'
    });
  }

  confirmPrice(dialogRef: MatDialogRef<unknown>): void {
    if (!this.setPriceForm.valid || !this.selectedRow) return;

    this.isLoading = true;

    // Always update standard fields
    this.selectedRow.unitPrice = this.setPriceForm.get('unitPrice')?.value;
    this.selectedRow.price = this.setPriceForm.get('price')?.value;

    if (this.selectedRow.operationType === OperationType.EXCHANGE) {
      // Handle exchange delivery pricing - also update oil fields
      const oilQuantity = this.setPriceForm.get('oilQuantity')?.value;
      const oilUnitPrice = this.setPriceForm.get('oilUnitPrice')?.value;
      const oilTotalValue = this.setPriceForm.get('oilTotalValue')?.value;
      const qualityGrade = this.setPriceForm.get('qualityGrade')?.value;

                  // Update the selected row with exchange values
      this.selectedRow.oilQuantity = oilQuantity;
      // Note: oilType assignment removed due to type mismatch - qualityGrade is string but BaseType expects number id

      // Create DTO with all exchange pricing data
      const exchangePricingDto: ExchangePricingDto = {
        deliveryId: this.selectedRow.id!,
        unitPrice: this.selectedRow.unitPrice || 0,
        price: this.selectedRow.price || 0,
        qualityGrade: qualityGrade,
        oilUnitPrice: oilUnitPrice || 0,
        oilQuantity: oilQuantity || 0,
        oilTotalValue: oilTotalValue || 0
      };

      // Call the service to update exchange pricing
      this.deliveryService.updatePricingAndCreatOilTransactionOut(exchangePricingDto).subscribe({
        next: () => {
          dialogRef.close();
          this.dashboard.refrechData();
          this.isLoading = false;
          this.snackBar.open('Prix d\'échange mis à jour avec succès.', 'Fermer', {
            duration: 3000,
            panelClass: ['mat-snack-bar-container-success']
          });
        },
        error: () => {
          this.snackBar.open('Erreur lors de l\'enregistrement du prix d\'échange.', 'Fermer', {
            duration: 4000,
            panelClass: ['mat-snack-bar-container-error']
          });
          this.isLoading = false;
        }
      });
    } else {
      // Handle standard delivery pricing
      this.deliveryService.updatePricing(this.selectedRow.id!, this.selectedRow.unitPrice || 0).subscribe({
        next: () => {
          dialogRef.close();
          this.dashboard.refrechData();
          this.isLoading = false;
          this.snackBar.open('Prix mis à jour avec succès.', 'Fermer', {
            duration: 3000,
            panelClass: ['mat-snack-bar-container-success']
          });
        },
        error: () => {
          this.snackBar.open('Erreur lors de l\'enregistrement du prix.', 'Fermer', {
            duration: 4000,
            panelClass: ['mat-snack-bar-container-error']
          });
          this.isLoading = false;
        }
      });
    }
  }

  private getOilTypes(): void {
    // This method is no longer needed as oilTypes is now static
  }

  private createOilTransactionFromExchange = (row: UnifiedDelivery) => {
    this.deliveryService
      .createOilTransactionFromExchange(row?.id)
      .pipe(
        tap((response: ApiResponse<unknown>) => {
          console.log(response);
         })
      )
      .subscribe();
  };

  protected readonly OperationType = OperationType;
}
