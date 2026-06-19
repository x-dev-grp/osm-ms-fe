import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { filter, switchMap } from 'rxjs';
import { OilSaleService } from './oil-sale.service';
import { OilSale } from '../models/oil-sale.model';
import { DocumentGenerationService } from '../../shared/services/document-generation.service';
import { ConfirmationDialogService, ConfirmationType } from '../../shared/services/confirmation-dialog.service';
import { ToastService } from '../../shared/services/toast.service';
import {
  OilSaleDeliverDialogComponent,
  OilSaleDeliverDialogData
} from '../oil-sales/oil-sale-deliver-dialog/oil-sale-deliver-dialog.component';
import { OilSaleDeliveryRequest } from '../oil-sales/oil-sale-delivery.request';

@Injectable({ providedIn: 'root' })
export class OilSaleActionsService {
  constructor(
    private oilSaleService: OilSaleService,
    private documentGenerationService: DocumentGenerationService,
    private confirmationDialog: ConfirmationDialogService,
    private dialog: MatDialog,
    private toast: ToastService,
    private router: Router
  ) {}

  handleAction(action: string, row: OilSale, onSuccess?: () => void): void {
    const normalized = action.toUpperCase();

    switch (normalized) {
      case 'READ':
        if (row.id) {
          this.router.navigate(['/finance/oil-sales', row.id, 'view']);
        }
        break;

      case 'UPDATE':
        if (row.id) {
          this.router.navigate(['/finance/oil-sales', row.id, 'edit']);
        }
        break;

      case 'CONFIRM':
        this.confirmOilSale(row, onSuccess);
        break;

      case 'CANCEL':
        this.cancelOilSale(row, onSuccess);
        break;

      case 'DELIVER':
        this.deliverOilSale(row, onSuccess);
        break;

      case 'GEN_PDF_BON_COMMANDE':
        if (row.id) {
          this.documentGenerationService.downloadOilSaleBonCommandePdf(row.id);
        }
        break;

      case 'GEN_INVOICE':
        if (row.id) {
          this.documentGenerationService.downloadOilSaleInvoicePdf(row.id);
        }
        break;

      case 'GEN_PDF_BON_LIVRAISON':
        if (row.id) {
          this.documentGenerationService.downloadOilSaleBonLivraisonPdf(row.id);
        }
        break;
    }
  }

  openDeliverDialog(defaultAddress?: string) {
    return this.dialog
      .open(OilSaleDeliverDialogComponent, {
        width: '480px',
        maxWidth: '95vw',
        disableClose: true,
        data: { defaultAddress } satisfies OilSaleDeliverDialogData
      })
      .afterClosed()
      .pipe(filter((result): result is OilSaleDeliveryRequest => !!result));
  }

  deliverOilSale(oilSale: OilSale, onSuccess?: () => void): void {
    if (!oilSale.id) {
      return;
    }

    const defaultAddress = oilSale.supplier?.address;
    this.openDeliverDialog(defaultAddress).subscribe({
      next: (delivery) => {
        this.oilSaleService.deliverOilSale(oilSale.id!, delivery).subscribe({
          next: (response) => {
            if (response.success) {
              this.toast.success('OIL_SALES.MESSAGES.SUCCESS.DELIVER');
              onSuccess?.();
            } else {
              this.toast.error(response.message || 'AUTO.ERROR_DELIVERING_OIL_SALE');
            }
          },
          error: (error) => {
            console.error('Error delivering oil sale:', error);
            this.toast.error('AUTO.ERROR_DELIVERING_OIL_SALE');
          }
        });
      }
    });
  }

  private confirmOilSale(oilSale: OilSale, onSuccess?: () => void): void {
    if (!oilSale.id) {
      return;
    }

    this.confirmationDialog
      .confirm({
        title: 'OIL_SALES.CONFIRMATIONS.CONFIRM_TITLE',
        message: 'OIL_SALES.CONFIRMATIONS.CONFIRM_MESSAGE',
        type: ConfirmationType.INFO,
        confirmText: 'OIL_SALES.CONFIRM',
        cancelText: 'COMMON.CANCEL',
        showIcon: true
      })
      .pipe(
        filter((result) => result.confirmed),
        switchMap(() => this.oilSaleService.confirmOilSale(oilSale.id!))
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toast.success('OIL_SALES.MESSAGES.SUCCESS.CONFIRM');
            onSuccess?.();
          } else {
            this.toast.error(response.message || 'AUTO.ERROR_CONFIRMING_OIL_SALE');
          }
        },
        error: (error) => {
          console.error('Error confirming oil sale:', error);
          this.toast.error('AUTO.ERROR_CONFIRMING_OIL_SALE');
        }
      });
  }

  private cancelOilSale(oilSale: OilSale, onSuccess?: () => void): void {
    if (!oilSale.id) {
      return;
    }

    this.confirmationDialog
      .confirm({
        title: 'OIL_SALES.CONFIRMATIONS.CANCEL_TITLE',
        message: 'OIL_SALES.CONFIRMATIONS.CANCEL_MESSAGE',
        type: ConfirmationType.WARNING,
        confirmText: 'OIL_SALES.CANCEL',
        cancelText: 'COMMON.CANCEL',
        showIcon: true,
        destructive: true
      })
      .pipe(
        filter((result) => result.confirmed),
        switchMap(() => this.oilSaleService.cancelOilSale(oilSale.id!))
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toast.success('OIL_SALES.MESSAGES.SUCCESS.CANCEL');
            onSuccess?.();
          } else {
            this.toast.error(response.message || 'AUTO.ERROR_CANCELLING_OIL_SALE');
          }
        },
        error: (error) => {
          console.error('Error cancelling oil sale:', error);
          this.toast.error('AUTO.ERROR_CANCELLING_OIL_SALE');
        }
      });
  }
}
