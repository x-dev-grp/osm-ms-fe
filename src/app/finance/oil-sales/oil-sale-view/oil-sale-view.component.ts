import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';

import { MatIconModule } from '@angular/material/icon';

import { MatChipsModule } from '@angular/material/chips';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatTooltipModule } from '@angular/material/tooltip';

import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { OilSaleService } from '../../service/oil-sale.service';

import { OilContainerSaleLine, OilSale, OilSaleStatus } from '../../models/oil-sale.model';

import { DocumentGenerationService } from '../../../shared/services/document-generation.service';

import { ToastService } from '../../../shared/services/toast.service';

import { CardComponent } from '../../../theme/components/card/card.component';

import { OilSaleActionsService } from '../../service/oil-sale-actions.service';

import { ConfirmationDialogService, ConfirmationType } from '../../../shared/services/confirmation-dialog.service';

import { filter, switchMap, take } from 'rxjs';
import { buildTransactionsQueryParams } from '../../utils/finance-resource-links.util';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { openQrDialog } from '../../../shared/utils/open-qr-dialog.util';
import { TranslateService } from '@ngx-translate/core';
import { AuthenticationService } from '../../../auth/services/authentication.service';
import { OOSMModule, FinanceEntity } from '../../../theme/types/permissions';
import { canRegenerateQr } from '../../../shared/utils/qr-permission.util';

@Component({
  selector: 'app-oil-sale-view',

  standalone: true,

  templateUrl: './oil-sale-view.component.html',

  styleUrls: ['./oil-sale-view.component.scss'],

  imports: [
    MatDialogModule,
    CommonModule,

    MatButtonModule,

    MatIconModule,

    MatChipsModule,

    MatProgressSpinnerModule,

    MatTooltipModule,

    TranslateModule,

    CardComponent,

      ]
})
export class OilSaleViewComponent implements OnInit {
  oilSale?: OilSale;

  loading = false;

  oilSaleId?: string;

  generatingQr = false;

  constructor(
    private auth: AuthenticationService,
    
    private dialog: MatDialog,
    
    private oilSaleService: OilSaleService,

    private oilSaleActions: OilSaleActionsService,

    private route: ActivatedRoute,

    private router: Router,

    private toast: ToastService,

    private documentGenerationService: DocumentGenerationService,

    private confirmationDialog: ConfirmationDialogService,

    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.oilSaleId = this.route.snapshot.paramMap.get('id') || undefined;

    if (this.oilSaleId) {
      this.loadOilSale(this.oilSaleId);
    } else {
      this.toast.error('AUTO.NO_OIL_SALE_ID_PROVIDED');

      this.router.navigate(['/finance/oil-sales']);
    }
  }

  onConfirm(): void {
    if (!this.oilSaleId || !this.oilSale) {
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

        switchMap(() => this.oilSaleService.confirmOilSale(this.oilSaleId!))
      )

      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toast.success('OIL_SALES.MESSAGES.SUCCESS.CONFIRM');

            this.loadOilSale(this.oilSaleId!);
          } else {
            this.toast.error(response.message || 'AUTO.ERROR_CONFIRMING_OIL_SALE');
          }
        },

        error: () => this.toast.error('AUTO.ERROR_CONFIRMING_OIL_SALE')
      });
  }

  onCancel(): void {
    if (!this.oilSaleId || !this.oilSale) {
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

        switchMap(() => this.oilSaleService.cancelOilSale(this.oilSaleId!))
      )

      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toast.success('OIL_SALES.MESSAGES.SUCCESS.CANCEL');

            this.loadOilSale(this.oilSaleId!);
          } else {
            this.toast.error(response.message || 'AUTO.ERROR_CANCELLING_OIL_SALE');
          }
        },

        error: () => this.toast.error('AUTO.ERROR_CANCELLING_OIL_SALE')
      });
  }

  onDeliver(): void {
    if (!this.oilSaleId || !this.canDeliver()) {
      return;
    }

    this.oilSaleActions.openDeliverDialog(this.oilSale?.supplier?.address).subscribe({
      next: (delivery) => {
        this.oilSaleService.deliverOilSale(this.oilSaleId!, delivery).subscribe({
          next: (response) => {
            if (response.success) {
              this.toast.success('OIL_SALES.MESSAGES.SUCCESS.DELIVER');

              this.loadOilSale(this.oilSaleId!);
            } else {
              this.toast.error(response.message || 'AUTO.ERROR_DELIVERING_OIL_SALE');
            }
          },

          error: () => this.toast.error('AUTO.ERROR_DELIVERING_OIL_SALE')
        });
      }
    });
  }

  getStatusClass(status?: OilSaleStatus): string {
    return status ? `status-badge status-${status.toLowerCase()}` : 'status-badge';
  }

  getSupplierDisplay(): string {
    if (this.oilSale?.supplier?.fullName) {
      return this.oilSale.supplier.fullName;
    }

    if (this.oilSale?.supplier) {
      return `${this.oilSale.supplier.name ?? ''} ${this.oilSale.supplier.lastname ?? ''}`.trim();
    }

    return '—';
  }

  getStorageUnitDisplay(): string {
    return this.oilSale?.storageUnit?.name?.trim() || '—';
  }

  hasDeliveryInfo(): boolean {
    return !!(this.oilSale?.deliveryDate || this.oilSale?.deliveryAddress || this.oilSale?.deliveryNotes);
  }

  canEdit(): boolean {
    return this.oilSale?.status === OilSaleStatus.PENDING;
  }

  canConfirm(): boolean {
    return this.oilSale?.status === OilSaleStatus.PENDING;
  }

  canCancel(): boolean {
    return this.oilSale?.status === OilSaleStatus.PENDING || this.oilSale?.status === OilSaleStatus.CONFIRMED;
  }

  canDownloadBonCommande(): boolean {
    return !!this.oilSaleId && this.oilSale?.status !== OilSaleStatus.CANCELLED;
  }

  canDownloadInvoice(): boolean {
    return this.oilSale?.status === OilSaleStatus.CONFIRMED || this.oilSale?.status === OilSaleStatus.DELIVERED;
  }

  canDownloadBonLivraison(): boolean {
    return this.oilSale?.status === OilSaleStatus.DELIVERED;
  }

  canDeliver(): boolean {
    return this.oilSale?.status === OilSaleStatus.CONFIRMED;
  }

  hasContainerSales(): boolean {
    return !!this.oilSale?.containerSales?.length;
  }

  containerLineTotal(line: OilContainerSaleLine): number {
    if (line.lineTotal != null) {
      return line.lineTotal;
    }
    return (line.unitPrice ?? 0) * (line.count ?? 0);
  }

  onBack(): void {
    this.router.navigate(['/finance/oil-sales']);
  }

  onEdit(): void {
    if (this.oilSaleId && this.canEdit()) {
      this.router.navigate(['/finance/oil-sales', this.oilSaleId, 'edit']);
    }
  }

  onDownloadBonCommande(): void {
    if (this.oilSaleId && this.canDownloadBonCommande()) {
      this.documentGenerationService.downloadOilSaleBonCommandePdf(this.oilSaleId);
    }
  }

  onDownloadInvoice(): void {
    if (this.oilSaleId && this.canDownloadInvoice()) {
      this.documentGenerationService.downloadOilSaleInvoicePdf(this.oilSaleId);
    }
  }

  onPreviewInvoice(): void {
    if (this.oilSaleId && this.canDownloadInvoice()) {
      this.router.navigate(['/finance/oil-sales', this.oilSaleId, 'invoice-preview']);
    }
  }

  onDownloadBonLivraison(): void {
    if (this.oilSaleId && this.canDownloadBonLivraison()) {
      this.documentGenerationService.downloadOilSaleBonLivraisonPdf(this.oilSaleId);
    }
  }

  openFinancialTransactions(): void {
    if (!this.oilSaleId) {
      return;
    }
    this.router.navigate(['/finance/transactions'], {
      queryParams: buildTransactionsQueryParams({ externalTransactionId: this.oilSaleId })
    });
  }

  openSupplierFinance(): void {
    const supplierId = this.oilSale?.supplier?.id;
    if (!supplierId) {
      return;
    }
    this.router.navigate(['/reception/fournisseur/details', supplierId], { queryParams: { tab: 'finance' } });
  }

  openStorageUnit(): void {
    const storageUnitId = this.oilSale?.storageUnit?.id;
    if (!storageUnitId) {
      return;
    }
    this.router.navigate(['/storage', storageUnitId, 'view']);
  }


  getQrCodeText(): string {
    return this.oilSale?.publicCode?.trim() || this.oilSale?.qrHex?.trim() || '';
  }

  hasQrCode(): boolean {
    return !!this.getQrCodeText();
  }

  hasCompleteQrMetadata(): boolean {
    return !!this.getQrCodeText() && !!this.oilSale?.qrImageBase64?.trim();
  }


  openExistingQrDialog(): void {
    if (!this.hasCompleteQrMetadata() || !this.oilSale) {
      return;
    }
    openQrDialog(this.dialog, {
      code: this.getQrCodeText(),
      qrImageBase64: this.oilSale.qrImageBase64 || '',
      payloadType: 'OILSALE'
    });
  }


  canRegenerateExistingQr(): boolean {
    return canRegenerateQr(this.auth, OOSMModule.FINANCE, FinanceEntity.OILSALE);
  }

  generateQr(): void {
    if (this.hasQrCode() && !this.canRegenerateExistingQr()) {
      this.toast.error('QR.ERROR.NO_REGENERATE_PERMISSION');
      return;
    }
    if (this.generatingQr || !this.oilSale?.id) {
      return;
    }

    this.confirmQrRegeneration((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.generatingQr = true;
      this.oilSaleService.generateQr(this.oilSale!.id!).subscribe({
        next: (response) => {
          this.generatingQr = false;
          this.oilSale = {
            ...this.oilSale!,
            publicCode: response.publicCode,
            qrHex: response.publicCode,
            qrUrl: response.qrUrl,
            qrImageBase64: response.qrImageBase64
          };
          openQrDialog(this.dialog, {
            code: response.publicCode,
            qrImageBase64: response.qrImageBase64,
            payloadType: 'OILSALE'
          });
        },
        error: () => {
          this.generatingQr = false;
          this.toast.error('QR.ERROR.GENERATE');
        }
      });
    });
  }

  private confirmQrRegeneration(onResolved: (confirmed: boolean) => void): void {
    if (!this.hasQrCode()) {
      onResolved(true);
      return;
    }

    this.confirmationDialog
      .confirm({
        title: this.translate.instant('AUTO.REGENERATE_QR_CODE'),
        message: this.translate.instant('AUTO.THIS_WILL_REGENERATE_THE_QR_CODE_AND_MAY_INVALIDATE_ALREADY_PRIN'),
        type: ConfirmationType.WARNING,
        confirmText: this.translate.instant('AUTO.REGENERATE'),
        cancelText: this.translate.instant('COMMON.CANCEL'),
        showIcon: true,
        destructive: true,
        requiredText: this.translate.instant('AUTO.OKAY'),
        requiredTextHint: this.translate.instant('AUTO.TO_CONTINUE_TYPE_OKAY_IN_THE_FIELD_BELOW'),
        requiredTextPlaceholder: this.translate.instant('AUTO.TYPE_OKAY')
      })
      .pipe(take(1))
      .subscribe((result) => onResolved(!!result?.confirmed));
  }

  private loadOilSale(id: string): void {
    this.loading = true;

    this.oilSaleService.getOilSale(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.oilSale = Array.isArray(response.data) ? response.data[0] : response.data;
        } else {
          this.toast.error('AUTO.OIL_SALE_NOT_FOUND');

          this.router.navigate(['/finance/oil-sales']);
        }

        this.loading = false;
      },

      error: () => {
        this.toast.error('AUTO.ERROR_LOADING_OIL_SALE');

        this.router.navigate(['/finance/oil-sales']);

        this.loading = false;
      }
    });
  }
}
