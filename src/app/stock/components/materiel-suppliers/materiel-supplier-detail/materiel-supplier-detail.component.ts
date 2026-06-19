import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { take } from 'rxjs/operators';
import { MaterielSupplierService } from '../../../services/materiel-supplier.service';
import {
  MaterielSupplier,
  MaterielSupplierCategory,
  materielSupplierCategoryLabels
} from '../../../models/materiel-supplier.model';
import { QrDialogComponent } from '../../../../shared/components/qr-dialog/qr-dialog.component';
import { ConfirmationDialogService, ConfirmationType } from '../../../../shared/services/confirmation-dialog.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-materiel-supplier-detail',
  standalone: true,
  imports: [TranslateModule, CommonModule, RouterLink, MatButtonModule, MatDialogModule, MatIconModule, MatTooltipModule],
  templateUrl: './materiel-supplier-detail.component.html',
  styleUrls: ['./materiel-supplier-detail.component.scss']
})
export class MaterielSupplierDetailComponent implements OnInit {
  private readonly i18n = inject(TranslateService);
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  private readonly toastService = inject(ToastService);

  supplier?: MaterielSupplier;
  categoryLabels = materielSupplierCategoryLabels;
  loading = true;
  generatingQr = false;
  activeTab: 'info' | 'contact' | 'commercial' | 'finance' | 'category' = 'info';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private materielSupplierService: MaterielSupplierService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadSupplier();
  }

  loadSupplier(): void {
    const id = this.route.snapshot.params['id'];
    this.materielSupplierService.getById(id).subscribe({
      next: (data) => {
        this.supplier = this.normalizeQrFields(data);
        this.loading = false;
      },
      error: () => {
        this.toastService.error('MATERIEL_SUPPLIER.ERRORS.LOAD_FAILED');
        void this.router.navigate(['/stock/materiel-suppliers']);
      }
    });
  }

  getCategoryLabel(category?: MaterielSupplierCategory): string {
    if (!category) {
      return this.i18n.instant('MATERIEL_SUPPLIER.DETAIL.CATEGORY_UNDEFINED');
    }
    return this.i18n.instant(this.categoryLabels[category]);
  }

  getQrCodeText(): string {
    return this.supplier?.publicCode?.trim() || this.supplier?.qrHex?.trim() || '';
  }

  hasQrCode(): boolean {
    return !!this.getQrCodeText();
  }

  hasCompleteQrMetadata(): boolean {
    return !!this.getQrCodeText() && !!this.supplier?.qrImageBase64?.trim();
  }

  openExistingQrDialog(): void {
    if (!this.hasCompleteQrMetadata() || !this.supplier) return;
    this.dialog.open(QrDialogComponent, {
      width: '400px',
      data: {
        qrText: this.getQrCodeText(),
        qrImageBase64: this.supplier.qrImageBase64 || '',
        encrypted: true,
        payloadType: 'MATERIEL_SUPPLIER',
        payloadMode: 'PUBLIC_CODE'
      }
    });
  }

  generateQr(): void {
    if (this.generatingQr || !this.supplier?.id) return;
    this.confirmQrRegeneration((confirmed) => {
      if (!confirmed) return;
      this.generatingQr = true;
      this.materielSupplierService.generateQr(this.supplier!.id!).subscribe({
        next: (response) => {
          this.generatingQr = false;
          this.supplier = {
            ...this.supplier!,
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
              payloadType: 'MATERIEL_SUPPLIER',
              payloadMode: 'PUBLIC_CODE'
            }
          });
        },
        error: () => {
          this.generatingQr = false;
          this.toastService.error('QR.ERROR.GENERATE');
        }
      });
    });
  }

  toggleActive(): void {
    if (!this.supplier?.id) return;

    const activating = !this.supplier.actif;
    this.confirmationDialog.confirm({
      title: this.i18n.instant(activating
        ? 'MATERIEL_SUPPLIER.CONFIRM.ACTIVATE_TITLE'
        : 'MATERIEL_SUPPLIER.CONFIRM.DEACTIVATE_TITLE'),
      message: this.i18n.instant(activating
        ? 'MATERIEL_SUPPLIER.CONFIRM.ACTIVATE_MESSAGE'
        : 'MATERIEL_SUPPLIER.CONFIRM.DEACTIVATE_MESSAGE', { name: this.supplier.nom }),
      type: ConfirmationType.WARNING,
      confirmText: this.i18n.instant(activating
        ? 'MATERIEL_SUPPLIER.ACTIONS.ACTIVATE'
        : 'MATERIEL_SUPPLIER.ACTIONS.DEACTIVATE'),
      cancelText: this.i18n.instant('ADMIN.CANCEL'),
      showIcon: true
    }).pipe(take(1)).subscribe((result) => {
      if (!result?.confirmed) return;

      const serviceCall = activating
        ? this.materielSupplierService.activate(this.supplier!.id!)
        : this.materielSupplierService.deactivate(this.supplier!.id!);

      serviceCall.subscribe({
        next: (updated) => {
          this.supplier = this.normalizeQrFields(updated);
          this.toastService.success(activating
            ? 'MATERIEL_SUPPLIER.MESSAGES.ACTIVATED'
            : 'MATERIEL_SUPPLIER.MESSAGES.DEACTIVATED');
        },
        error: () => this.toastService.error('MATERIEL_SUPPLIER.ERRORS.STATUS_UPDATE_FAILED')
      });
    });
  }

  showDeliveryFields(): boolean {
    const cat = this.supplier?.category;
    return cat === MaterielSupplierCategory.MATIERES_PREMIERES
      || cat === MaterielSupplierCategory.PRODUITS_FINIS
      || cat === MaterielSupplierCategory.TRANSPORT;
  }

  showPackagingFields(): boolean {
    const cat = this.supplier?.category;
    return cat === MaterielSupplierCategory.EMBALLAGES
      || cat === MaterielSupplierCategory.ETIQUETTES
      || cat === MaterielSupplierCategory.BOUCHONS
      || cat === MaterielSupplierCategory.CAPSULES
      || cat === MaterielSupplierCategory.OPERCULES
      || cat === MaterielSupplierCategory.FILMS
      || cat === MaterielSupplierCategory.CARTONS
      || cat === MaterielSupplierCategory.PALETTES;
  }

  showServiceFields(): boolean {
    return this.supplier?.category === MaterielSupplierCategory.SERVICES;
  }

  private normalizeQrFields(supplier: MaterielSupplier): MaterielSupplier {
    const normalized = { ...supplier };
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
    this.confirmationDialog.confirm({
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
    }).pipe(take(1)).subscribe((result) => onResolved(!!result?.confirmed));
  }
}
