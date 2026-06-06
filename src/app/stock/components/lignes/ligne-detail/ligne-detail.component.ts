import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { take } from 'rxjs/operators';

import { LigneConditionnementService } from '../../../services/ligne-conditionnement.service';
import { LigneConditionnement, Statue } from '../../../models/ligne-conditionnement.model';
import { ToastService } from '../../../../shared/services/toast.service';
import { QrDialogComponent } from '../../../../shared/components/qr-dialog/qr-dialog.component';
import { ConfirmationDialogService, ConfirmationType } from '../../../../shared/services/confirmation-dialog.service';

@Component({
  selector: 'app-ligne-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './ligne-detail.component.html',
  styleUrls: ['./ligne-detail.component.scss']
})
export class LigneDetailComponent implements OnInit {
  ligne = signal<LigneConditionnement | null>(null);
  loading = signal<boolean>(false);
  generatingQr = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ligneService: LigneConditionnementService,
    private toast: ToastService,
    private dialog: MatDialog,
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
        this.toast.error('Erreur lors du chargement des données');
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
    const current = this.ligne();
    if (!this.hasCompleteQrMetadata() || !current) return;

    this.dialog.open(QrDialogComponent, {
      width: '400px',
      data: {
        qrText: this.getQrCodeText(),
        qrImageBase64: current.qrImageBase64 || '',
        encrypted: true,
        payloadType: 'LIGNECONDITIONNEMENT',
        payloadMode: 'PUBLIC_CODE'
      }
    });
  }

  generateQr(): void {
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
          this.dialog.open(QrDialogComponent, {
            width: '400px',
            data: {
              qrText: response.publicCode,
              qrImageBase64: response.qrImageBase64,
              encrypted: true,
              payloadType: 'LIGNECONDITIONNEMENT',
              payloadMode: 'PUBLIC_CODE'
            }
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

    this.confirmationDialog.confirm({
      title: 'Regenerate QR Code',
      message: 'This will regenerate the QR code and may invalidate already printed physical QR labels.',
      type: ConfirmationType.WARNING,
      confirmText: 'Regenerate',
      cancelText: 'Cancel',
      showIcon: true,
      destructive: true,
      requiredText: 'OKAY',
      requiredTextHint: 'To continue, type OKAY in the field below.',
      requiredTextPlaceholder: 'Type OKAY'
    }).pipe(take(1))
      .subscribe((result) => {
        onResolved(!!result?.confirmed);
      });
  }
}
