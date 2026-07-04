import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { take } from 'rxjs/operators';

import { UnifiedDeliveryService } from '../../shared/services/delivery.service';
import { UnifiedDelivery } from '../../shared/models/UnifiedDelivery';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ToastService } from '../../shared/services/toast.service';
import { OliveLotStatus } from '../../shared/models/OliveLotStatus';
import { MatChip, MatChipListbox } from '@angular/material/chips';
import { deliveryType } from '../../shared/models/deleveryType';
import { QrDialogComponent } from '../../shared/components/qr-dialog/qr-dialog.component';
import { ConfirmationDialogService, ConfirmationType } from '../../shared/services/confirmation-dialog.service';
import { buildTransactionsQueryParams } from '../../finance/utils/finance-resource-links.util';

@Component({
  selector: 'app-details-reception-olive',
  standalone: true,
  templateUrl: './details-reception.component.html',
  styleUrls: ['./details-reception.component.scss'],
  imports: [
    CommonModule,
    DatePipe,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule,
    TranslateModule,
    MatProgressSpinner,
    MatChipListbox,
    MatChip
  ]
})
export class DetailsReceptionComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly deliveryService = inject(UnifiedDeliveryService);
  private readonly translate = inject(TranslateService);
  private readonly dialog = inject(MatDialog);
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  private readonly router = inject(Router);

  receptionId!: string | null;
  deliveryData: UnifiedDelivery | null = null;
  associatedCounterpart: UnifiedDelivery | null = null;
  loading = true;
  errorMessage: string | null = null;
  generatingQr = false;

  ngOnInit(): void {
    this.receptionId = this.route.snapshot.paramMap.get('id');
    this.loadReceptionById(this.receptionId);
  }

  openCounterpart(): void {
    const id = this.associatedCounterpart?.id;
    if (!id) return;
    this.loadReceptionById(id);
  }

  isOliveReception(): boolean {
    return (this.deliveryData?.deliveryType || '').toUpperCase() === 'OLIVE';
  }

  isOilReception(): boolean {
    return (this.deliveryData?.deliveryType || '').toUpperCase() === 'OIL';
  }

  hasPositiveNumber(value: number | null | undefined): boolean {
    return Number(value ?? 0) > 0;
  }

  getSupplierDisplayName(): string {
    const supplier = this.deliveryData?.supplier;
    return [supplier?.name, supplier?.lastname].filter(Boolean).join(' ').trim();
  }

  getOilVarietyName(): string {
    return this.deliveryData?.oilVariety?.name || this.deliveryData?.oliveVariety?.name || '';
  }

  getPaymentStatusTranslatePath(): string {
    const paid = Number(this.deliveryData?.paidAmount ?? 0);
    const unpaid = Number(this.deliveryData?.unpaidAmount ?? 0);

    if (unpaid <= 0 && paid > 0) return 'PDF.PAID';
    if (paid > 0 && unpaid > 0) return 'PDF.PARTIALLY_PAID';
    return 'PDF.UNPAID';
  }

  openFinancialTransactions(): void {
    this.router.navigate(['/finance/transactions'], {
      queryParams: buildTransactionsQueryParams({
        externalTransactionId: this.deliveryData?.id,
        lotNumber: this.deliveryData?.lotNumber
      })
    });
  }

  openOilTransactions(): void {
    const lotNumber = this.deliveryData?.lotNumber;
    this.router.navigate(['/storage/oil-transactions'], {
      queryParams: lotNumber ? { lotNumber } : undefined
    });
  }

  openSupplierDetails(): void {
    const supplierId = this.deliveryData?.supplier?.id;
    if (!supplierId) return;
    this.router.navigate(['/reception/fournisseur/details', supplierId]);
  }

  openSupplierFinance(): void {
    const supplierId = this.deliveryData?.supplier?.id;
    if (!supplierId) return;
    this.router.navigate(['/reception/fournisseur/details', supplierId], { queryParams: { tab: 'finance' } });
  }

  openSupplierPayments(): void {
    const supplierId = this.deliveryData?.supplier?.id;
    if (!supplierId) return;
    this.router.navigate(['/reception/fournisseur/payments', supplierId]);
  }

  openStorageUnit(): void {
    const storageUnitId = this.deliveryData?.storageUnit?.id;
    if (!storageUnitId) return;
    this.router.navigate(['/storage', storageUnitId, 'view']);
  }

  openQualityControl(): void {
    const deliveryId = this.deliveryData?.id;
    if (!deliveryId) return;
    this.router.navigate(['/reception/quality', deliveryId]);
  }

  getQrCodeText(): string {
    return this.deliveryData?.publicCode?.trim() || this.deliveryData?.qrHex?.trim() || '';
  }

  hasQrCode(): boolean {
    return !!this.getQrCodeText();
  }

  hasCompleteQrMetadata(): boolean {
    return !!this.getQrCodeText() && !!this.deliveryData?.qrImageBase64?.trim();
  }

  openExistingQrDialog(): void {
    if (!this.hasCompleteQrMetadata() || !this.deliveryData) return;

    this.dialog.open(QrDialogComponent, {
      width: '400px',
      data: {
        qrText: this.getQrCodeText(),
        qrImageBase64: this.deliveryData.qrImageBase64 || '',
        encrypted: true,
        payloadType: 'UNIFIEDDELIVERY',
        payloadMode: 'PUBLIC_CODE'
      }
    });
  }

  generateQr(): void {
    if (this.generatingQr || !this.deliveryData?.id) return;

    this.confirmQrRegeneration((confirmed) => {
      if (!confirmed) return;

      this.generatingQr = true;
      this.deliveryService.generateQr(this.deliveryData!.id).subscribe({
        next: (response) => {
          this.generatingQr = false;
          this.deliveryData = {
            ...this.deliveryData!,
            publicCode: response.publicCode,
            qrHex: response.publicCode,
            qrUrl: response.qrUrl,
            qrImageBase64: response.qrImageBase64
          };

          this.dialog.open(QrDialogComponent, {
            width: '400px',
            data: {
              qrText: response.publicCode,
              qrImageBase64: response.qrImageBase64,
              encrypted: true,
              payloadType: 'UNIFIEDDELIVERY',
              payloadMode: 'PUBLIC_CODE'
            }
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
        cancelText: this.translate.instant('ADMIN.CANCEL'),
        showIcon: true,
        destructive: true,
        requiredText: this.translate.instant('AUTO.OKAY'),
        requiredTextHint: this.translate.instant('AUTO.TO_CONTINUE_TYPE_OKAY_IN_THE_FIELD_BELOW'),
        requiredTextPlaceholder: this.translate.instant('AUTO.TYPE_OKAY')
      })
      .pipe(take(1))
      .subscribe((result) => {
        onResolved(!!result?.confirmed);
      });
  }

  private normalizeDelivery(delivery: UnifiedDelivery): UnifiedDelivery {
    const normalized = { ...delivery };
    if (!normalized.publicCode && normalized.qrHex) {
      normalized.publicCode = normalized.qrHex;
    }
    if (!normalized.qrHex && normalized.publicCode) {
      normalized.qrHex = normalized.publicCode;
    }
    return normalized;
  }

  private loadReceptionById(id: string | null): void {
    if (!id) {
      this.errorMessage = this.translate.instant('DELIVERIES.DETAILS.MESSAGES.INVALID_ID');
      this.toast.error(this.errorMessage!);
      this.loading = false;
      return;
    }

    this.loading = true;
    this.errorMessage = null;
    this.associatedCounterpart = null;
    this.receptionId = id;

    this.deliveryService.getUnifiedDelivery(id).subscribe({
      next: (response) => {
        if (response?.success && response?.data) {
          const raw = Array.isArray(response.data) ? response.data[0] : response.data;
          this.deliveryData = this.normalizeDelivery(raw);

          const lot = this.deliveryData?.lotNumber;
          const curType = (this.deliveryData?.deliveryType || '').toUpperCase();
          const targetType = curType === 'OIL' ? deliveryType.OLIVE : curType === 'OLIVE' ? deliveryType.OIL : null;

          if (lot && targetType) {
            this.loadAssociatedCounterpart(lot, targetType);
          } else {
            this.loading = false;
          }
        } else {
          this.deliveryData = null;
          this.errorMessage = this.translate.instant('DELIVERIES.DETAILS.MESSAGES.LOAD_ERROR');
          this.toast.error(this.errorMessage!);
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading delivery:', error);
        this.deliveryData = null;
        this.errorMessage = this.translate.instant('DELIVERIES.DETAILS.MESSAGES.DATA_ERROR');
        this.toast.error(this.errorMessage!);
        this.loading = false;
      }
    });
  }

  private loadAssociatedCounterpart(lotNumber: string, type: deliveryType): void {
    this.deliveryService.getDeliveryByLotNumberAndType(lotNumber, type).subscribe({
      next: (response) => {
        if (response?.success && response?.data) {
          const raw = Array.isArray(response.data) ? response.data[0] : response.data;
          this.associatedCounterpart = this.normalizeDelivery(raw);
        } else {
          this.associatedCounterpart = null;
        }
        this.loading = false;
      },
      error: () => {
        this.associatedCounterpart = null;
        this.loading = false;
      }
    });
  }

  onBack(): void {
    window.history.back();
  }

  protected readonly OliveLotStatus = OliveLotStatus;
}
