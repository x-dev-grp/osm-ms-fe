import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { UnifiedDelivery } from '../../shared/models/UnifiedDelivery';
import { UnifiedDeliveryService } from '../../shared/services/delivery.service';
import { DocumentGenerationService } from '../../shared/services/document-generation.service';
import { ToastService } from '../../shared/services/toast.service';
import { OliveLotStatus } from '../../shared/models/OliveLotStatus';
import { SupplierPaymentHistoryComponent } from '../suppliers/supplier-payment-history/supplier-payment-history.component';
import { SupplierPaymentHistoryMobileComponent } from '../suppliers/supplier-payment-history-mobile/supplier-payment-history-mobile.component';
import { PaymentSourceType } from '../suppliers/supplier-details/supplier-details.component';
import { ConfirmationDialogService, ConfirmationType } from '../../shared/services/confirmation-dialog.service';
import { PaymentDetailsDialogComponent } from './payment-details-dialog/payment-details-dialog.component';
import { filter, switchMap } from 'rxjs';
import { deliveryType } from '../../shared/models/deleveryType';

export interface OilReceptionActionContext {
  onRefresh?: () => void;
  onEdit?: (row: UnifiedDelivery) => void;
  onSetPrice?: (row: UnifiedDelivery) => void;
}

@Injectable({ providedIn: 'root' })
export class OilReceptionActionsService {
  constructor(
    private deliveryService: UnifiedDeliveryService,
    private documentGenerationService: DocumentGenerationService,
    private toast: ToastService,
    private router: Router,
    private dialog: MatDialog,
    private breakpointObserver: BreakpointObserver,
    private confirmationDialog: ConfirmationDialogService
  ) {}

  handleAction(action: string, row: UnifiedDelivery, ctx: OilReceptionActionContext = {}): void {
    const normalized = action.toUpperCase();

    switch (normalized) {
      case 'READ':
        this.view(row);
        break;
      case 'UPDATE':
        ctx.onEdit ? ctx.onEdit(row) : this.edit(row);
        break;
      case 'QUALITY':
      case 'OIL_QUALITY':
      case 'UPDATE_OIL_QUALITY':
        this.openOilQc(row);
        break;
      case 'SET_PRICE':
        ctx.onSetPrice?.(row);
        break;
      case 'COMPLETE_PAYMENT_DETAILS':
        this.completePaymentDetails(row, ctx.onRefresh);
        break;
      case 'GEN_PDF':
        this.downloadReceptionPdf(row);
        break;
      case 'GEN_PDF_QC_OIL':
        this.downloadQcPdf(row);
        break;
      case 'GEN_PDF_PRODUCTION':
        this.downloadProductionPdf(row);
        break;
      case 'PAY':
        this.openPaymentDialog(row, ctx.onRefresh);
        break;
      case 'GEN_INVOICE':
        this.downloadCommercialInvoice(row);
        break;
      case 'CANCEL':
        this.cancel(row, ctx.onRefresh);
        break;
      default:
        this.toast.info('AUTO.ACTION_NON_RECONNUE', { value0: action });
    }
  }

  view(row: UnifiedDelivery): void {
    if (row?.id) {
      this.router.navigate(['/reception/reception-details', row.id]);
    }
  }

  edit(row: UnifiedDelivery): void {
    if (row?.id) {
      this.router.navigate(['/reception/reception-huile', row.id]);
    }
  }

  openOilQc(row: UnifiedDelivery): void {
    if (row?.id) {
      this.router.navigate(['/reception/quality', row.id]);
    }
  }

  downloadReceptionPdf(row: UnifiedDelivery): void {
    if (row?.id) {
      this.documentGenerationService.downloadReceptionPdf(row.id);
    }
  }

  downloadQcPdf(row: UnifiedDelivery): void {
    if (row?.qualityControlResults?.length && row.id) {
      this.documentGenerationService.downloadQualityControlPdf(row.id);
      return;
    }
    this.toast.error('AUTO.NO_QUALITY_CONTROL_FOR_OLIVE');
  }

  downloadProductionPdf(row: UnifiedDelivery): void {
    if (row?.id) {
      this.documentGenerationService.downloadProductionPdf(row.id);
    }
  }

  downloadCommercialInvoice(row: UnifiedDelivery): void {
    if (row?.id) {
      this.documentGenerationService.downloadCommercialPdf(row.id);
    }
  }

  openPaymentDialog(row: UnifiedDelivery, onRefresh?: () => void): void {
    if (!row) {
      return;
    }

    const isMobile = this.breakpointObserver.isMatched([Breakpoints.Handset, Breakpoints.TabletPortrait]);
    const component = isMobile ? SupplierPaymentHistoryMobileComponent : SupplierPaymentHistoryComponent;
    const dialogRef = this.dialog.open(component, {
      width: isMobile ? '100vw' : '41vw',
      height: isMobile ? '70vh' : '100vh',
      data: { row, sourceType: PaymentSourceType.DELIVERY_prc },
      autoFocus: false,
      disableClose: true,
      panelClass: isMobile ? 'mobile-bottom-sheet' : 'desktop-payment-dialog',
      hasBackdrop: true
    });

    if (!isMobile) {
      dialogRef.updatePosition({ right: '0px', top: '0px' });
    }

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.ok) {
        this.toast.success(result.message || 'AUTO.PAIEMENT_REUSSI');
        onRefresh?.();
      } else if (result) {
        this.toast.error(result.message || 'AUTO.ECHEC_DU_PAIEMENT');
      }
    });
  }

  completePaymentDetails(row: UnifiedDelivery, onRefresh?: () => void): void {
    if (!row?.id || !row.lotOliveNumber) {
      this.toast.error('AUTO.ERREUR_LORS_DU_TRAITEMENT_DU_PAIEMENT');
      return;
    }

    this.deliveryService.getDeliveryByLotNumberAndType(row.lotOliveNumber, deliveryType.OLIVE).subscribe({
      next: (res) => {
        if (!res.success || !res.data) {
          this.toast.error('AUTO.ERREUR_LORS_DU_CHARGEMENT_DE_LA_RECEPTION');
          return;
        }

        const originalOlive = res.data as UnifiedDelivery;
        const maxQty = Number(originalOlive?.oilQuantity ?? 0);
        const maxTotal = Math.max(0, Number(originalOlive?.unpaidAmount ?? 0));

        const ref = this.dialog.open(PaymentDetailsDialogComponent, {
          width: '720px',
          autoFocus: false,
          restoreFocus: false,
          data: {
            maxQty,
            maxTotal,
            initialUnitPrice: Number(row.unitPrice) || null,
            initialQuantity: Number(row.oilQuantity) || null
          }
        });

        ref.afterClosed().subscribe((result) => {
          if (!result) {
            return;
          }

          const dto = {
            deliveryId: row.id!,
            unitPrice: result.unitPrice,
            price: result.total,
            qualityGrade: row.categoryOliveOil || '',
            oilUnitPrice: result.unitPrice,
            oilQuantity: result.quantity,
            oilTotalValue: result.total
          };

          this.deliveryService.updatePrincingForPaymentreception(dto).subscribe({
            next: () => {
              this.toast.success();
              onRefresh?.();
            },
            error: () => this.toast.error('AUTO.ERREUR_LORS_DU_TRAITEMENT_DU_PAIEMENT')
          });
        });
      },
      error: () => this.toast.error('AUTO.ERREUR_LORS_DU_CHARGEMENT_DE_LA_RECEPTION')
    });
  }

  cancel(row: UnifiedDelivery, onRefresh?: () => void): void {
    if (!row?.id) {
      return;
    }

    this.confirmationDialog
      .confirm({
        type: ConfirmationType.DANGER,
        title: 'PLANNING.CANCEL_TITLE',
        message: 'PLANNING.CANCEL_PROMPT',
        confirmText: 'COMMON.YES',
        cancelText: 'COMMON.CANCEL',
        destructive: true
      })
      .pipe(
        filter((result) => result.confirmed),
        switchMap(() => this.deliveryService.updateStatus(row.id!, OliveLotStatus.CANCELLED))
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.toast.success('DELIVERIES.MESSAGES.CANCELLED_SUCCESS');
            onRefresh?.();
          } else {
            this.toast.error(res.message || 'DELIVERIES.MESSAGES.CANCELLED_ERROR');
          }
        },
        error: () => this.toast.error('DELIVERIES.MESSAGES.CANCELLED_ERROR')
      });
  }
}
