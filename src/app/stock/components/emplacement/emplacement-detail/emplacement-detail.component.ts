import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { take } from 'rxjs/operators';
import { EmplacementStockService } from '../../../services/emplacement-stock.service';
import { EmplacementStock, TypeEmplacement } from '../../../models/emplacement-stock.model';
import {CategorieArticle} from "../../../models/article.model";
import { QrDialogComponent } from '../../../../shared/components/qr-dialog/qr-dialog.component';
import { ConfirmationDialogService, ConfirmationType } from '../../../../shared/services/confirmation-dialog.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-emplacement-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatDialogModule, MatIconModule, MatTooltipModule],
  templateUrl: './emplacement-detail.component.html',
  styleUrls: ['./emplacement-detail.component.scss']
})
export class EmplacementDetailComponent implements OnInit {

  emplacement: EmplacementStock | null = null;
  loading: boolean = true;
  generatingQr = false;
  error: string = '';
  successMessage: string = '';
  actionEnCours = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private emplacementService: EmplacementStockService,
    private dialog: MatDialog,
    private confirmationDialog: ConfirmationDialogService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadEmplacement(id);
      }
    });
  }

  loadEmplacement(id: string): void {
    this.loading = true;
    this.emplacementService.getEmplacementById(id).subscribe({
      next: (response: any) => {
        if (Array.isArray(response?.data)) {
          this.emplacement = this.normalizeQrFields(response.data[0] ?? null);
        } else {
          this.emplacement = this.normalizeQrFields(response?.data ?? null);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement', err);
        this.error = "Impossible de charger l'emplacement";
        this.loading = false;
      }
    });
  }

  getQrCodeText(): string {
    return this.emplacement?.publicCode?.trim() || this.emplacement?.qrHex?.trim() || '';
  }

  hasQrCode(): boolean {
    return !!this.getQrCodeText();
  }

  hasCompleteQrMetadata(): boolean {
    return !!this.getQrCodeText() && !!this.emplacement?.qrImageBase64?.trim();
  }

  openExistingQrDialog(): void {
    if (!this.hasCompleteQrMetadata() || !this.emplacement) return;

    this.dialog.open(QrDialogComponent, {
      width: '400px',
      data: {
        qrText: this.getQrCodeText(),
        qrImageBase64: this.emplacement.qrImageBase64 || '',
        encrypted: true,
        payloadType: 'EMPLACEMENTSTOCK',
        payloadMode: 'PUBLIC_CODE'
      }
    });
  }

  generateQr(): void {
    if (this.generatingQr || !this.emplacement?.id) return;

    this.confirmQrRegeneration((confirmed) => {
      if (!confirmed) return;
      this.generatingQr = true;
      this.emplacementService.generateQr(this.emplacement!.id!).subscribe({
        next: (response) => {
          this.generatingQr = false;
          this.emplacement = {
            ...this.emplacement!,
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
              payloadType: 'EMPLACEMENTSTOCK',
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

  goBack(): void {
    this.router.navigate(['/stock/emplacements']).then(() => {});
  }

  getTypeLabel(type: TypeEmplacement): string {
    const labels: Record<TypeEmplacement, string> = {
      [TypeEmplacement.CHAMBRE_FROIDE]: 'Chambre froide',
      [TypeEmplacement.CONGELATEUR]: 'Congélateur',
      [TypeEmplacement.ZONE_DANGEREUSE]: 'Zone dangereuse',
      [TypeEmplacement.ZONE_SECURISEE]: 'Zone sécurisée',
      [TypeEmplacement.QUAI_RECEPTION]: 'Quai réception',
      [TypeEmplacement.QUAI_EXPEDITION]: 'Quai expédition',
      [TypeEmplacement.ZONE_CONTROLE]: 'Zone contrôle',
      [TypeEmplacement.ZONE_RECONDITIONNEMENT]: 'Zone reconditionnement'
    };
    return labels[type] ?? type;
  }

  getTypeIcon(type: TypeEmplacement): string {
    const icons: Record<TypeEmplacement, string> = {
      [TypeEmplacement.CHAMBRE_FROIDE]: 'fa-snowflake',
      [TypeEmplacement.CONGELATEUR]: 'fa-temperature-low',
      [TypeEmplacement.ZONE_DANGEREUSE]: 'fa-exclamation-triangle',
      [TypeEmplacement.ZONE_SECURISEE]: 'fa-shield-alt',
      [TypeEmplacement.QUAI_RECEPTION]: 'fa-truck-loading',
      [TypeEmplacement.QUAI_EXPEDITION]: 'fa-truck',
      [TypeEmplacement.ZONE_CONTROLE]: 'fa-clipboard-check',
      [TypeEmplacement.ZONE_RECONDITIONNEMENT]: 'fa-boxes'
    };
    return icons[type] ?? 'fa-map-marker-alt';
  }

  getTypeColor(type: TypeEmplacement): string {
    const colors: Record<TypeEmplacement, string> = {
      [TypeEmplacement.CHAMBRE_FROIDE]: 'info',
      [TypeEmplacement.CONGELATEUR]: 'primary',
      [TypeEmplacement.ZONE_DANGEREUSE]: 'danger',
      [TypeEmplacement.ZONE_SECURISEE]: 'success',
      [TypeEmplacement.QUAI_RECEPTION]: 'warning',
      [TypeEmplacement.QUAI_EXPEDITION]: 'warning',
      [TypeEmplacement.ZONE_CONTROLE]: 'secondary',
      [TypeEmplacement.ZONE_RECONDITIONNEMENT]: 'purple'
    };
    return colors[type] ?? 'secondary';
  }

  getDisponibiliteBadge(): string {
    if (!this.emplacement) return 'badge-secondary';
    if (this.emplacement.disponible) return 'badge-success';
    if (this.emplacement.reservePour) return 'badge-warning';
    return 'badge-danger';
  }

  getDisponibiliteLabel(): string {
    if (!this.emplacement) return '';
    if (this.emplacement.disponible) return 'Disponible';
    if (this.emplacement.reservePour) {
      return `Réservé pour ${this.emplacement.reservePour}`;
    }
    return 'Occupé';
  }

  getCapacitePercentage(): number {
    if (!this.emplacement) return 0;

    const actuelle = parseFloat(this.emplacement.capaciteActuelle ?? '0');
    const max = parseFloat(this.emplacement.capaciteMaximale ?? '0');

    if (isNaN(actuelle) || isNaN(max) || max === 0) return 0;

    return Math.min(100, (actuelle / max) * 100);
  }

  hasTemperature(): boolean {
    if (!this.emplacement) return false;
    return !!(this.emplacement.temperatureMin || this.emplacement.temperatureMax);
  }

  reserverEmplacement(): void {
    if (!this.emplacement?.id) return;

    const client = prompt('Nom du client ou destination :');

    if (client) {
      this.emplacementService.reserverEmplacement(this.emplacement.id, client).subscribe({
        next: (response: any) => {
          if (Array.isArray(response?.data)) {
            this.emplacement = this.normalizeQrFields(response.data[0] ?? null);
          } else {
            this.emplacement = this.normalizeQrFields(response?.data ?? null);
          }
          this.successMessage = 'Emplacement réservé avec succès';
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (err) => {
          console.error('Erreur réservation', err);
          alert('Erreur lors de la réservation');
        }
      });
    }
  }

  libererEmplacement(): void {
    if (!this.emplacement?.id) return;

    if (confirm(`Libérer l'emplacement "${this.emplacement.code}" ?`)) {
      this.emplacementService.libererEmplacement(this.emplacement.id).subscribe({
        next: (response: any) => {
          if (Array.isArray(response?.data)) {
            this.emplacement = this.normalizeQrFields(response.data[0] ?? null);
          } else {
            this.emplacement = this.normalizeQrFields(response?.data ?? null);
          }
          this.successMessage = 'Emplacement libéré avec succès';
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (err) => {
          console.error('Erreur libération', err);
          alert('Erreur lors de la libération');
        }
      });
    }
  }

  getCategorieLabel(categorie: CategorieArticle): string {
    const labels: Record<CategorieArticle, string> = {
      [CategorieArticle.EMBALLAGE]: 'Emballage',
      [CategorieArticle.CONSOMMABLE]: 'Consommable',
      [CategorieArticle.UNITE]: 'Unité',
      [CategorieArticle.COLIS]: 'Colis',
      [CategorieArticle.PALETTE]: 'Palette'
    };
    return labels[categorie] || categorie;
  }

  private normalizeQrFields(emplacement: EmplacementStock | null): EmplacementStock | null {
    if (!emplacement) return null;
    const normalized = { ...emplacement };
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
      .subscribe((result) => onResolved(!!result?.confirmed));
  }
}
