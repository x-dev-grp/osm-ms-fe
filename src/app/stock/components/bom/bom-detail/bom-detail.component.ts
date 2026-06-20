import { Component, inject, OnInit } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { take } from 'rxjs/operators';
import { BomService } from '../../../services/BomService';
import { Bom } from '../../../models/Bom';
import { ToastService } from '../../../../shared/services/toast.service';
import { MaterialNeedsPreviewComponent } from '../../../../shared/components/material-needs-preview/material-needs-preview.component';
import { QrDialogComponent } from '../../../../shared/components/qr-dialog/qr-dialog.component';
import { ConfirmationDialogService, ConfirmationType } from '../../../../shared/services/confirmation-dialog.service';

@Component({
  selector: 'app-bom-detail',
  standalone: true,
  imports: [TranslateModule, CommonModule, RouterLink, FormsModule, MaterialNeedsPreviewComponent, MatDialogModule, MatTooltipModule],
  templateUrl: './bom-detail.component.html',
  styleUrls: ['./bom-detail.component.scss']
})
export class BomDetailComponent implements OnInit {
  private readonly i18n = inject(TranslateService);
  bom: Bom | null = null;
  loading = true;
  activating = false;
  generatingQr = false;
  previewQuantity = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bomService: BomService,
    private toast: ToastService,
    private dialog: MatDialog,
    private confirmationDialog: ConfirmationDialogService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/stock/boms']);
      return;
    }
    this.loadBom(id);
  }

  loadBom(id: string): void {
    this.bomService.getById(id).subscribe({
      next: (data) => {
        this.bom = this.normalizeQrFields(data);
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement des Nomenclatures', err);
        this.loading = false;
        this.router.navigate(['/stock/boms']);
      }
    });
  }

  activateBom(): void {
    if (!this.bom?.id || this.bom.active) {
      return;
    }
    this.activating = true;
    this.bomService.activate(this.bom.id).subscribe({
      next: (updated) => {
        this.bom = updated;
        this.activating = false;
        this.toast.success('AUTO.NOMENCLATURE_DEFINIE_COMME_ACTIVE');
      },
      error: (err) => {
        this.activating = false;
        this.toast.error(err?.error?.error || err?.error?.message || 'AUTO.IMPOSSIBLE_D_ACTIVER_LA_NOMENCLATURE');
      }
    });
  }

  getQrCodeText(): string {
    return this.bom?.publicCode?.trim() || this.bom?.qrHex?.trim() || '';
  }

  hasQrCode(): boolean {
    return !!this.getQrCodeText();
  }

  hasCompleteQrMetadata(): boolean {
    return !!this.getQrCodeText() && !!this.bom?.qrImageBase64?.trim();
  }

  openExistingQrDialog(): void {
    if (!this.hasCompleteQrMetadata() || !this.bom) return;

    this.dialog.open(QrDialogComponent, {
      width: '400px',
      data: {
        qrText: this.getQrCodeText(),
        qrImageBase64: this.bom.qrImageBase64 || '',
        encrypted: true,
        payloadType: 'BOM',
        payloadMode: 'PUBLIC_CODE'
      }
    });
  }

  generateQr(): void {
    if (this.generatingQr || !this.bom?.id) return;

    this.confirmQrRegeneration((confirmed) => {
      if (!confirmed) return;
      this.generatingQr = true;
      this.bomService.generateQr(this.bom!.id!).subscribe({
        next: (response) => {
          this.generatingQr = false;
          this.bom = {
            ...this.bom!,
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
              payloadType: 'BOM',
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

  private normalizeQrFields(bom: Bom): Bom {
    const normalized = { ...bom };
    if (!normalized.publicCode && normalized.qrHex) {
      normalized.publicCode = normalized.qrHex;
    }
    if (!normalized.qrHex && normalized.publicCode) {
      normalized.qrHex = normalized.publicCode;
    }
    return normalized;
  }

  private confirmQrRegeneration(onResolved: (confirmed: boolean) => void): void {
    if (!this.hasQrCode()) {
      onResolved(true);
      return;
    }

    this.confirmationDialog
      .confirm({
        title: this.i18n.instant('AUTO.REGENERATE_QR_CODE'),
        message: this.i18n.instant('AUTO.THIS_WILL_REGENERATE_THE_QR_CODE_AND_MAY_INVALIDATE_ALREADY_PRIN'),
        type: ConfirmationType.WARNING,
        confirmText: this.i18n.instant('AUTO.REGENERATE'),
        cancelText: this.i18n.instant('ADMIN.CANCEL'),
        showIcon: true,
        destructive: true,
        requiredText: this.i18n.instant('AUTO.OKAY'),
        requiredTextHint: this.i18n.instant('AUTO.TO_CONTINUE_TYPE_OKAY_IN_THE_FIELD_BELOW'),
        requiredTextPlaceholder: this.i18n.instant('AUTO.TYPE_OKAY')
      })
      .pipe(take(1))
      .subscribe((result) => {
        onResolved(!!result?.confirmed);
      });
  }
}
