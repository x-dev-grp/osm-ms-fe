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

import { OilSale, OilContainerSaleLine, OilSaleStatus } from '../../models/oil-sale.model';

import { DocumentGenerationService } from '../../../shared/services/document-generation.service';

import { ToastService } from '../../../shared/services/toast.service';

import { CardComponent } from '../../../theme/components/card/card.component';

import { OilSaleActionsService } from '../../service/oil-sale-actions.service';

import { ConfirmationDialogService, ConfirmationType } from '../../../shared/services/confirmation-dialog.service';

import { filter, switchMap } from 'rxjs';



@Component({

  selector: 'app-oil-sale-view',

  standalone: true,

  templateUrl: './oil-sale-view.component.html',

  styleUrls: ['./oil-sale-view.component.scss'],

  imports: [

    CommonModule,

    MatButtonModule,

    MatIconModule,

    MatChipsModule,

    MatProgressSpinnerModule,

    MatTooltipModule,

    TranslateModule,

    CardComponent

  ]

})

export class OilSaleViewComponent implements OnInit {

  oilSale?: OilSale;

  loading = false;

  oilSaleId?: string;



  constructor(

    private oilSaleService: OilSaleService,

    private oilSaleActions: OilSaleActionsService,

    private route: ActivatedRoute,

    private router: Router,

    private toast: ToastService,

    private documentGenerationService: DocumentGenerationService,

    private confirmationDialog: ConfirmationDialogService

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

    return this.oilSale?.status === OilSaleStatus.PENDING

      || this.oilSale?.status === OilSaleStatus.CONFIRMED;

  }



  canDownloadBonCommande(): boolean {

    return !!this.oilSaleId && this.oilSale?.status !== OilSaleStatus.CANCELLED;

  }



  canDownloadInvoice(): boolean {

    return this.oilSale?.status === OilSaleStatus.CONFIRMED

      || this.oilSale?.status === OilSaleStatus.DELIVERED;

  }



  canDownloadBonLivraison(): boolean {

    return this.oilSale?.status === OilSaleStatus.DELIVERED;

  }



  canDeliver(): boolean {

    return this.oilSale?.status === OilSaleStatus.CONFIRMED;

  }

  hasContainerSales(): boolean {
    return !!(this.oilSale?.containerSales?.length);
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



  onDownloadBonLivraison(): void {

    if (this.oilSaleId && this.canDownloadBonLivraison()) {

      this.documentGenerationService.downloadOilSaleBonLivraisonPdf(this.oilSaleId);

    }

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

