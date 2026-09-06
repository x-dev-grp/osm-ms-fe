import { Component, inject, OnInit, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { take } from 'rxjs/operators';

import { LigneConditionnementService } from '../../../services/ligne-conditionnement.service';
import { LigneConditionnement, Statue } from '../../../models/ligne-conditionnement.model';
import { ToastService } from '../../../../shared/services/toast.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { openQrDialog } from '../../../../shared/utils/open-qr-dialog.util';
import { ConfirmationDialogService, ConfirmationType } from '../../../../shared/services/confirmation-dialog.service';
import { AuthenticationService } from '../../../../auth/services/authentication.service';
import { OOSMModule, InventoryEntity } from '../../../../theme/types/permissions';
import { canRegenerateQr } from '../../../../shared/utils/qr-permission.util';

@Component({
  selector: 'app-ligne-detail',
  standalone: true,
  imports: [
    MatDialogModule,
    TranslateModule,
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
      ],
  templateUrl: './ligne-detail.component.html',
  styleUrls: ['./ligne-detail.component.scss']
})
export class LigneDetailComponent implements OnInit {
  private readonly i18n = inject(TranslateService);
  ligne = signal<LigneConditionnement | null>(null);
  loading = signal<boolean>(false);
  generatingQr = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor(
    private auth: AuthenticationService,
    
    private dialog: MatDialog,
    
    private route: ActivatedRoute,
    private router: Router,
    private ligneService: LigneConditionnementService,
    private toast: ToastService,
    private confirmationDialog: ConfirmationDialogService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadLigne(id);
    } else {
      this.goBack();
    }
  }

  loadLigne(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.ligneService.getLigneById(id).subscribe({
      next: (data) => {
        this.ligne.set(this.normalizeQrFields(data));
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement detail', err);
        this.error.set('Impossible de charger les détails de la ligne');
        this.loading.set(false);
        this.toast.error('DELIVERIES.FORM.MESSAGES.LOAD_ERROR');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/stock/lignes']);
  }

  getEtatLabel(etat?: Statue): string {
    if (!etat) return '-';
    const labels: Record<string, string> = {
      [Statue.ACTIF]: 'Actif',
      [Statue.INACTIF]: 'Inactif',
      [Statue.EN_MAINTENANCE]: 'Maintenance',
      [Statue.EN_PANNE]: 'Panne'
    };
    return labels[etat] || etat;
  }

  getEtatClass(etat?: Statue): string {
    if (!etat) return 'bg-gray-100 text-gray-700';
    const classes: Record<string, string> = {
      [Statue.ACTIF]: 'bg-green-100 text-green-700 border-green-200',
      [Statue.INACTIF]: 'bg-gray-100 text-gray-700 border-gray-200',
      [Statue.EN_MAINTENANCE]: 'bg-amber-100 text-amber-700 border-amber-200',
      [Statue.EN_PANNE]: 'bg-red-100 text-red-700 border-red-200'
    };
    return classes[etat] || 'bg-gray-100 text-gray-700';
  }

  isMaintenanceDue(): boolean {
    const date = this.ligne()?.dateProchaineMaintenance;
    if (!date) return false;
    return new Date(date.toString()) < new Date();
  }

  getQrCodeText(): string {
    const current = this.ligne();
    return current?.publicCode?.trim() || current?.qrHex?.trim() || '';
  }

  hasQrCode(): boolean {
    return !!this.getQrCodeText();
  }

  hasCompleteQrMetadata(): boolean {
    return !!this.getQrCodeText() && !!this.ligne()?.qrImageBase64?.trim();
  }



  openExistingQrDialog(): void {
    if (!this.hasCompleteQrMetadata() || !this.ligne()) {
      return;
    }
    openQrDialog(this.dialog, {
      code: this.getQrCodeText(),
      qrImageBase64: this.ligne()?.qrImageBase64 || '',
      payloadType: 'LIGNECONDITIONNEMENT'
    });
  }


  canRegenerateExistingQr(): boolean {
    return canRegenerateQr(this.auth, OOSMModule.INVENTAIR, InventoryEntity.LIGNECONDITIONNEMENT);
  }

  generateQr(): void {
    if (this.hasQrCode() && !this.canRegenerateExistingQr()) {
      this.toast.error('QR.ERROR.NO_REGENERATE_PERMISSION');
      return;
    }
    const current = this.ligne();
    if (this.generatingQr() || !current?.id) return;

    this.confirmQrRegeneration((confirmed) => {
      if (!confirmed) return;
      this.generatingQr.set(true);
      this.ligneService.generateQr(current.id!).subscribe({
        next: (response) => {
          this.generatingQr.set(false);
          this.ligne.set({
            ...current,
            publicCode: response.publicCode,
            qrHex: response.publicCode,
            qrUrl: response.qrUrl,
            qrImageBase64: response.qrImageBase64
          });
          openQrDialog(this.dialog, {
            code: response.publicCode,
            qrImageBase64: response.qrImageBase64,
            payloadType: 'LIGNECONDITIONNEMENT'
          });
        },
        error: () => {
          this.generatingQr.set(false);
          this.toast.error('QR.ERROR.GENERATE');
        }
      });
    });
  }

  private normalizeQrFields(ligne: LigneConditionnement): LigneConditionnement {
    const normalized = { ...ligne };
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
