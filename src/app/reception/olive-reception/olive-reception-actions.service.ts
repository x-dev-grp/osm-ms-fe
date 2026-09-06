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
import { filter, switchMap, take } from 'rxjs';
import { CompletionDetailsDialogComponent } from '../planning/completion-details-dialog/completion-details-dialog.component';
import { PlanItemType, PlanningItem } from '../../shared/models/planningDTOS';
import { PlanningService } from '../../shared/services/planning.service';
import { TranslateService } from '@ngx-translate/core';
import { MillMachine } from '../../shared/models/millMachine';
import { MillPlanningConfigService } from '../../shared/services/mill-planning-config.service';

export interface OliveReceptionActionContext {
  onRefresh?: () => void;
  onEdit?: (row: UnifiedDelivery) => void;
  onSetPrice?: (row: UnifiedDelivery) => void;
}

@Injectable({ providedIn: 'root' })
export class OliveReceptionActionsService {
  constructor(
    private deliveryService: UnifiedDeliveryService,
    private documentGenerationService: DocumentGenerationService,
    private toast: ToastService,
    private router: Router,
    private dialog: MatDialog,
    private breakpointObserver: BreakpointObserver,
    private confirmationDialog: ConfirmationDialogService,
    private planningService: PlanningService,
    private translate: TranslateService,
    private millPlanningConfig: MillPlanningConfigService
  ) {}

  handleAction(action: string, row: UnifiedDelivery, ctx: OliveReceptionActionContext = {}): void {
    const normalized = action.toUpperCase();

    switch (normalized) {
      case 'READ':
        this.view(row);
        break;
      case 'UPDATE':
        ctx.onEdit ? ctx.onEdit(row) : this.view(row);
        break;
      case 'GEN_PDF':
        this.downloadReceptionPdf(row);
        break;
      case 'GEN_PDF_QC_OLIVE':
      case 'GEN_PDF_QC_OIL':
        this.downloadQcPdf(row);
        break;
      case 'GEN_PDF_PRODUCTION':
        this.downloadProductionPdf(row);
        break;
      case 'OLIVE_QUALITY':
      case 'QUALITY':
        this.openOliveQc(row);
        break;
      case 'OIL_QUALITY':
        this.openOilQcFromOlive(row);
        break;
      case 'SET_PRICE':
        ctx.onSetPrice?.(row);
        break;
      case 'PAY':
        this.openPaymentDialog(row, ctx.onRefresh);
        break;
      case 'OIL_RECEPTION':
        this.createOilReceptionFromOlive(row, ctx.onRefresh);
        break;
      case 'COMPLETE':
        this.completeLot(row, ctx.onRefresh);
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

  openOliveQc(row: UnifiedDelivery): void {
    if (row?.id) {
      this.router.navigate(['/reception/quality', row.id]);
    }
  }

  openOilQcFromOlive(row: UnifiedDelivery): void {
    if (row?.id) {
      this.router.navigate(['/reception/quality/oilFromOlive', row.id]);
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

  createOilReceptionFromOlive(row: UnifiedDelivery, onRefresh?: () => void): void {
    if (!row?.id) {
      return;
    }

    this.deliveryService.createOilDeliveryFromOlive(row.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success('DELIVERIES.MESSAGES.SENT_TO_PRODUCTION_SUCCESS');
          onRefresh?.();
          const oil = Array.isArray(res.data) ? res.data[0] : res.data;
          if (oil?.id) {
            this.router.navigate(['/reception/reception-huile', oil.id]);
          }
        } else {
          this.toast.error(res.message || 'DELIVERIES.MESSAGES.SENT_TO_PRODUCTION_ERROR');
        }
      },
      error: () => this.toast.error('DELIVERIES.MESSAGES.SENT_TO_PRODUCTION_ERROR')
    });
  }

  completeLot(row: UnifiedDelivery, onRefresh?: () => void): void {
    if (!row?.lotNumber) {
      return;
    }

    this.millPlanningConfig
      .isEnabled()
      .pipe(take(1))
      .subscribe((planningEnabled) => {
        if (planningEnabled) {
          this.toast.info('RECEPTION.PLANNING.USE_BOARD_HINT');
          void this.router.navigate(['/reception/mill-schedules']);
          return;
        }
        this.openDirectCompletionDialog(row, onRefresh);
      });
  }

  private openDirectCompletionDialog(row: UnifiedDelivery, onRefresh?: () => void): void {
    const item = this.toPlanningItem(row);
    const isMobile = this.breakpointObserver.isMatched([Breakpoints.Handset, Breakpoints.TabletPortrait]);
    this.dialog
      .open(CompletionDetailsDialogComponent, {
        data: { item, itemType: PlanItemType.LOT, requireMillSelection: true },
        width: isMobile ? '100vw' : 'min(960px, 92vw)',
        height: isMobile ? '100vh' : undefined,
        maxWidth: isMobile ? '100vw' : '960px',
        maxHeight: isMobile ? '100vh' : 'auto',
        panelClass: isMobile ? 'mobile-fullscreen-dialog' : 'completion-dialog-panel',
        autoFocus: false
      })
      .afterClosed()
      .pipe(
        filter((r) => !!r?.confirmed),
        switchMap((r) =>
          this.planningService.completeLotWithDetails(
            row.lotNumber,
            Number(r.oilQuantity ?? 0),
            Number(r.rendement ?? 0),
            Number(r.totalTriturationPrice ?? 0),
            !!r.autoSetStorage,
            r.triturationDurationInMinutes == null || r.triturationDurationInMinutes === ''
              ? 0
              : Number(r.triturationDurationInMinutes),
            r.trtDate,
            r.finalObservation,
            r.millMachineId
          )
        )
      )
      .subscribe({
        next: (msg) => {
          this.toast.success(msg || this.translate.instant('RECEPTION.PLANNING.COMPLETE_LOT'));
          onRefresh?.();
        },
        error: (err) => {
          this.toast.error(err?.error || err?.message || 'AUTO.ERREUR_LORS_DE_LA_FINALISATION');
        }
      });
  }

  private toPlanningItem(d: UnifiedDelivery): PlanningItem {
    const mill = (d as UnifiedDelivery & { millMachine?: MillMachine }).millMachine;
    return {
      id: d.id,
      lotNumber: d.lotNumber,
      deliveryDate: d.deliveryDate ? new Date(d.deliveryDate) : new Date(),
      deliveryNumber: d.deliveryNumber,
      oliveQuantity: d.poidsNet ?? d.oliveQuantity ?? 0,
      globalLotNumber: d.globalLotNumber ?? null,
      completed: d.status === OliveLotStatus.COMPLETED,
      millMachineId: mill?.id,
      supplier: d.supplier ?? undefined,
      region: d.region?.name ?? undefined,
      oliveVariety: d.oliveVariety?.name ?? undefined,
      oliveType: d.oliveType ?? undefined,
      poidsBrute: d.poidsBrute ?? undefined,
      operationType: d.operationType ?? undefined,
      poidsNet: d.poidsNet ?? undefined,
      sackCount: d.sackCount ?? undefined,
      parcel: d.parcel?.name ?? undefined,
      matriculeCamion: d.matriculeCamion ?? undefined,
      description: d.description ?? undefined,
      oilQuantity: d.oilQuantity ?? null,
      rendement: d.rendement ?? null
    };
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
