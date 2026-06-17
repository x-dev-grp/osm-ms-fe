import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { ActivatedRoute, Data, ParamMap, Router } from '@angular/router';
import { Subscription, tap } from 'rxjs';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';
import { DashboardConfig } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { UnifiedDelivery } from '../../shared/models/UnifiedDelivery';
import { UnifiedDeliveryService } from '../../shared/services/delivery.service';

import { OLIVE_DELIVERY_DASHBOARD } from './OLIVE_DELIVERY_DASHBOARD';
import { PdfGeneratorService } from '../../shared/services/pdf-generator.service';
import { ApiResponse } from '../../shared/models/api-response';
import { OliveLotStatus } from '../../shared/models/OliveLotStatus';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OperationType } from '../../shared/models/operation-type.enum';
import { ExchangePricingDto } from '../../shared/models/ExchangePricingDto';
import { ToastService } from '../../shared/services/toast.service';
import { SharedModule } from '../../shared/shared.module';
import { getControlQualitePdfConfig } from '../pdf-config/controlQualite.config';
import { getOlivePdfConfig } from '../pdf-config/reception-olive-pdf.config';

const LS_OP_KEY = 'OSM_RECEPTION_SELECTED_OP';

// small helpers (safe for SSR/testing)
function setOpToLS(opKey?: string) {
  try {
    if (opKey) localStorage.setItem(LS_OP_KEY, opKey);
  } catch {}
}

@Component({
  selector: 'app-olive-reception',
  standalone: true,
  imports: [TranslateModule,
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatCardModule,
    MatSortModule,
    SharedModule,
    OsmDashboard
  ],
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
  isLoading: boolean = false;
  qualityGrade: { id: string; name: string }[] = [
    { id: 'vierge_extra', name: 'Extra Vierge' },
    { id: 'vierge', name: 'Vierge' },
    { id: 'lampante', name: 'Lampante' }
  ];
  /** Operation type forced by the route (e.g. EXCHANGE, SIMPLE_RECEPTION, BASE, OLIVE_PURCHASE) */
  forcedOp?: OperationType;
  currentOpKey?: string;
  protected readonly OperationType = OperationType;
  private subs = new Subscription();

  constructor(
    private deliveryService: UnifiedDeliveryService,
    private toast: ToastService,
    private router: Router,
    private pdfService: PdfGeneratorService,
    private translate: TranslateService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.route.data.subscribe((d: Data) => {
        const op = (d?.['op'] ?? '').toString().toUpperCase();
        if (op) {
          const i18n = `DELIVERIES.OPERATION_TYPE.${op}`;
          this.dashboardConfig = {
            ...this.dashboardConfig,
            addNewItemUrl: `reception/reception-olive/${op.toLowerCase()}/new`,
            titleTranslatePath: `${this.translate.instant('DELIVERIES.OLIVE_TITLE')} — ${this.translate.instant(i18n)}`,
            defaultSearchData: {
              ...this.dashboardConfig.defaultSearchData,
              searchData: {
                ...this.dashboardConfig.defaultSearchData?.searchData,
                search: {
                  ...this.dashboardConfig.defaultSearchData?.searchData?.search,
                  operationType: { equalValue: op }
                }
              }
            }
          };
        } else {
          this.dashboardConfig = {
            ...this.dashboardConfig,
            addNewItemUrl: 'reception/reception-olive/new',
            titleTranslatePath: 'DELIVERIES.OLIVE_TITLE',
            title: this.translate.instant('DELIVERIES.OLIVE_TITLE')
          };
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  /**
   * Create/edit navigation
   * - If an id exists -> go to op-specific edit route: /reception-olive/<op>/<id>
   * - Else (new) -> go to op-specific create route with 'new' id: /reception-olive/<op>/new
   * - Fallback to legacy routes if no op available
   */
  selectReception(d?: UnifiedDelivery): void {
    // Prefer the row's operationType (when editing from list); otherwise use forcedOp from the route
    const op = this.normalizeOp(d?.operationType ?? this.forcedOp);
    const opSeg = this.opToPath(op);

    if (d?.id) {
      if (opSeg) {
        this.router.navigate(['/reception/reception-olive', opSeg, d.id]);
      } else {
        // Legacy fallback
        this.router.navigate(['/reception/reception-olive', d.id]);
      }
    } else {
      if (opSeg) {
        this.router.navigate(['/reception/reception-olive', opSeg, 'new']);
      } else {
        this.router.navigate(['/reception/reception-olive', 'new']);
      }
    }
  }

  viewDelivery(d: UnifiedDelivery): void {
    this.router.navigate(['reception/reception-details', d.id]);
  }

  QualityControl(d: UnifiedDelivery): void {
    this.router.navigate(['reception/quality', d.id]);
  }



  cancelDelivery(d: UnifiedDelivery): void {
    if (d.id) {
      const updatedDelivery = { ...d, status: OliveLotStatus.CANCELLED };
      this.subs.add(
        this.deliveryService.updateUnifiedDelivery(updatedDelivery).subscribe(
          (res: ApiResponse<UnifiedDelivery>) => {
            if (res.success) {
              this.toast.success(this.translate.instant('DELIVERIES.MESSAGES.CANCELLED_SUCCESS'));
            } else {
              this.toast.error(this.translate.instant('DELIVERIES.MESSAGES.CANCELLED_ERROR'));
            }
          },
          () => this.toast.warning(this.translate.instant('DELIVERIES.MESSAGES.CANCELLED_ERROR'))
        )
      );
    }
  }

  generateBonReception(delivery: UnifiedDelivery): void {
    const config = getOlivePdfConfig(delivery);
    this.pdfService.generatePdfDocument(config);
  }

  onRowAction(e: { row: UnifiedDelivery; action: string }): void {
    switch (e.action) {
      case 'READ':
        this.viewDelivery(e.row);
        break;
      case 'UPDATE':
        this.selectReception(e.row); // will navigate with the row's operationType if present
        break;

      case 'GEN_PDF':
        if (e.row) {
          this.generateBonReception(e.row);
        }
        break;
      case 'SET_PRICE':
        this.setPrice(e.row);
        break;

      case 'OIL_OUT_TRANSACTION':
        this.createOilTransactionFromExchange(e.row);
        break;
      case 'OLIVE_QUALITY':
      case 'QUALITY':
        this.QualityControl(e.row);
        break;
      case 'GEN_PDF_QC_OIL':
        if (e.row.qualityControlResults) {
          const deliveryType = e.row.deliveryType?.toUpperCase() || '';
          const config = getControlQualitePdfConfig(e.row, deliveryType);
          this.pdfService.generatePdf(config);
        } else {
          this.toast.error('AUTO.NO_QUALITY_CONTROL_FOR_OIL');
        }
        break;
      case 'GEN_PDF_QC_OLIVE':
        if (e.row.qualityControlResults) {
          const deliveryType = e.row.deliveryType?.toUpperCase() || '';
          const config = getControlQualitePdfConfig(e.row, deliveryType);
          this.pdfService.generatePdf(config);
        } else {
          this.toast.error('AUTO.NO_QUALITY_CONTROL_FOR_OLIVE');
        }
        break;
      case 'CANCEL':
        this.cancelDelivery(e.row);
        break;
    }
  }

  confirmPrice(dialogRef: MatDialogRef<unknown>): void {
    if (!this.setPriceForm.valid || !this.selectedRow) return;

    this.isLoading = true;

    // Always update standard fields
    this.selectedRow.unitPrice = this.setPriceForm.get('unitPrice')?.value;
    this.selectedRow.price = this.setPriceForm.get('price')?.value;

    if (this.selectedRow.operationType === OperationType.EXCHANGE) {
      const oilQuantity = this.setPriceForm.get('oilQuantity')?.value;
      const oilUnitPrice = this.setPriceForm.get('oilUnitPrice')?.value;
      const oilTotalValue = this.setPriceForm.get('oilTotalValue')?.value;
      const qualityGrade = this.setPriceForm.get('qualityGrade')?.value;

      const exchangePricingDto: ExchangePricingDto = {
        deliveryId: this.selectedRow.id!,
        unitPrice: this.selectedRow.unitPrice || 0,
        price: this.selectedRow.price || 0,
        qualityGrade: qualityGrade,
        oilUnitPrice: oilUnitPrice || 0,
        oilQuantity: oilQuantity || 0,
        oilTotalValue: oilTotalValue || 0
      };

      this.deliveryService.updatePricingAndCreatOilTransactionOut(exchangePricingDto).subscribe({
        next: () => {
          dialogRef.close();
          this.dashboard.refrechData();
          this.isLoading = false;
          this.toast.open("Prix d'échange mis à jour avec succès.", 'Fermer', {
            duration: 3000,
            panelClass: ['mat-snack-bar-container-success']
          });
        },
        error: () => {
          this.toast.error('AUTO.ERREUR_LORS_DE_L_ENREGISTREMENT_DU_PRIX_D_ECHANGE');
          this.isLoading = false;
        }
      });
    } else {
      this.deliveryService.updatePricing(this.selectedRow.id!, this.selectedRow.unitPrice || 0).subscribe({
        next: () => {
          dialogRef.close();
          this.dashboard.refrechData();
          this.isLoading = false;
          this.toast.open('Prix mis à jour avec succès.', 'Fermer', {
            duration: 3000,
            panelClass: ['mat-snack-bar-container-success']
          });
        },
        error: () => {
          this.toast.open("Erreur lors de l'enregistrement du prix.", 'Fermer', {
            duration: 4000,
            panelClass: ['mat-snack-bar-container-error']
          });
          this.isLoading = false;
        }
      });
    }
  }

  /** Translate enum/string to OperationType if possible */
  private normalizeOp(v: string | OperationType | undefined | null): OperationType | undefined {
    if (!v) return undefined;
    if (typeof v !== 'string') return v;
    const key = v.toUpperCase().trim();
    return (OperationType as any)[key] as OperationType | undefined;
  }

  /** Map OperationType to route path segment */
  private opToPath(op?: OperationType): string | undefined {
    switch (op) {
      case OperationType.EXCHANGE:
        return 'exchange';
      case OperationType.SIMPLE_RECEPTION:
        return 'simple_reception';
      case OperationType.BASE:
        return 'base';
      case OperationType.OLIVE_PURCHASE:
        return 'olive_purchase';
      default:
        return undefined;
    }
  }



  private setPrice(row: UnifiedDelivery): void {
    this.selectedRow = row;
    const poidsNet = row.poidsNet || 0;
    const initialUnitPrice = row.unitPrice || 0;
    const initialPrice = initialUnitPrice * poidsNet;

    if (row.operationType === OperationType.EXCHANGE) {
      const initialOilQuantity = row.oilQuantity || 0;
      const initialOilTotalValue = initialPrice;
      const initialOilUnitPrice = initialOilQuantity > 0 ? initialOilTotalValue / initialOilQuantity : 0;
      const initialQualityGrade = row.oilType || this.qualityGrade[0]?.id || '';

      this.setPriceForm = this.fb.group({
        unitPrice: [initialUnitPrice, Validators.required],
        price: [initialPrice, Validators.required],
        qualityGrade: [initialQualityGrade, Validators.required],
        oilUnitPrice: [initialOilUnitPrice, Validators.required],
        oilQuantity: [initialOilQuantity, Validators.required],
        oilTotalValue: [initialOilTotalValue, Validators.required]
      });

      this.setPriceForm.get('unitPrice')?.valueChanges.subscribe((unitPrice: string) => {
        const price = (parseFloat(unitPrice) || 0) * poidsNet;
        this.setPriceForm.get('price')?.setValue(+price.toFixed(3), { emitEvent: false });
        this.setPriceForm.get('oilTotalValue')?.setValue(+price.toFixed(3), { emitEvent: false });

        const oilQuantity = this.setPriceForm.get('oilQuantity')?.value || 0;
        if (oilQuantity > 0) {
          const newOilUnitPrice = price / oilQuantity;
          this.setPriceForm.get('oilUnitPrice')?.setValue(+newOilUnitPrice.toFixed(3), { emitEvent: false });
        }
      });

      this.setPriceForm.get('oilQuantity')?.valueChanges.subscribe((oilQuantity: number) => {
        const oliveTotalPrice = this.setPriceForm.get('price')?.value || 0;
        this.setPriceForm.get('oilTotalValue')?.setValue(+oliveTotalPrice.toFixed(3), { emitEvent: false });

        if (parseFloat(oilQuantity.toString()) > 0) {
          const newOilUnitPrice = oliveTotalPrice / parseFloat(oilQuantity.toString());
          this.setPriceForm.get('oilUnitPrice')?.setValue(+newOilUnitPrice.toFixed(3), { emitEvent: false });
        }
      });

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

  private createOilTransactionFromExchange = (row: UnifiedDelivery) => {
    this.deliveryService
      .createOilTransactionFromExchange(row?.id)
      .pipe(tap((response: ApiResponse<unknown>) => console.log(response)))
      .subscribe();
  };
}
