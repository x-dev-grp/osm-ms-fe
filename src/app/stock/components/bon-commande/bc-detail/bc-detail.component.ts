import { Component, inject, OnInit } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BonCommandeService } from '../../../services/bon-commande.service';
import { BonCommande, StatutBonCommande } from '../../../models/bon-commande.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { take } from 'rxjs/operators';
import { ApiResponse } from '../../../../shared/models/api-response';
import { QrDialogComponent } from '../../../../shared/components/qr-dialog/qr-dialog.component';
import { ConfirmationDialogService, ConfirmationType } from '../../../../shared/services/confirmation-dialog.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-bc-detail',
  standalone: true,
  imports: [TranslateModule, CommonModule, FormsModule, RouterLink, MatDialogModule, MatTooltipModule],
  templateUrl: './bc-detail.component.html',
  styleUrls: ['./bc-detail.component.scss']
})
export class BcDetailComponent implements OnInit {
  private readonly i18n = inject(TranslateService);
  bon: BonCommande | null = null;
  loading = true;
  generatingQr = false;
  error = '';
  materielSupplierName = '';
  showReception = false;
  receptionQuantities: { [key: string]: number } = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bonCommandeService: BonCommandeService,
    private dialog: MatDialog,
    private confirmationDialog: ConfirmationDialogService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadBon(id);
    else {
      this.error = 'ID du bon de commande manquant';
      this.loading = false;
    }
  }

  loadBon(id: string): void {
    this.loading = true;
    this.bonCommandeService.getBonCommandeById(id).subscribe({
      next: (bon) => {
        this.bon = this.normalizeQrFields(bon);
        if (this.bon.lignes?.length && this.bon.lignes[0].article?.materielSupplier?.nom) {
          this.materielSupplierName = this.bon.lignes[0].article.materielSupplier.nom;
        } else {
          this.materielSupplierName = 'Non spécifié';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement bon', err);
        this.error = 'Erreur lors du chargement du bon de commande';
        this.loading = false;
      }
    });
  }

  validerBon(): void {
    if (!this.bon?.id) return;
    if (!confirm(this.i18n.instant('AUTO.VALIDER_CE_BON_DE_COMMANDE'))) return;

    this.bonCommandeService.validerBonCommande(this.bon.id).subscribe({
      next: (response: ApiResponse<any>) => {
        if (response.success) {
          this.loadBon(this.bon!.id!);
          this.showSuccess('Bon validé avec succès');
        } else {
          this.error = response.message || 'Erreur lors de la validation';
        }
      },
      error: () => {
        this.error = 'Erreur serveur lors de la validation';
      }
    });
  }

  refuserBon(): void {
    if (!this.bon?.id) return;
    const motif = prompt(this.i18n.instant('AUTO.MOTIF_DE_REFUS'));
    if (!motif) return;

    this.bonCommandeService.refuserBonCommande(this.bon.id, motif).subscribe({
      next: (response: ApiResponse<any>) => {
        if (response.success) {
          this.loadBon(this.bon!.id!);
          this.showSuccess('Bon refusé');
        } else {
          this.error = response.message || 'Erreur lors du refus';
        }
      },
      error: () => {
        this.error = 'Erreur serveur lors du refus';
      }
    });
  }

  // Méthodes utilitaires
  getTotalArticles(): number {
    return this.bon?.lignes?.length || 0;
  }

  getQuantiteTotale(): number {
    return this.bon?.lignes?.reduce((s, l) => s + (l.quantiteCommandee || 0), 0) || 0;
  }

  getTotalPrix(): number {
    return this.bon?.lignes?.reduce((s, l) => s + l.quantiteCommandee * (l.prixUnitaire || 0), 0) || 0;
  }

  getStatutBadgeClass(statut: StatutBonCommande): string {
    const classes: any = {
      [StatutBonCommande.EN_ATTENTE]: 'bg-warning text-dark',
      [StatutBonCommande.VALIDE]: 'bg-success',
      [StatutBonCommande.RECU]: 'bg-primary',
      [StatutBonCommande.PARTIELLEMENT_RECU]: 'bg-info',
      [StatutBonCommande.REFUSE]: 'bg-danger'
    };
    return classes[statut] || 'bg-secondary';
  }

  private showSuccess(message: string): void {
    alert(message);
  }

  toggleReception(): void {
    if (this.bon?.lignes) {
      this.receptionQuantities = {};
      this.bon.lignes.forEach((ligne) => {
        if (ligne.id) {
          this.receptionQuantities[ligne.id] = 0;
        }
      });
      this.showReception = !this.showReception;
    }
  }

  receptionner(): void {
    if (!this.bon?.id) return;

    const payload = Object.entries(this.receptionQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([id, quantiteRecue]) => ({ id, quantiteRecue }));

    if (payload.length === 0) {
      alert(this.i18n.instant('AUTO.VEUILLEZ_SAISIR_AU_MOINS_UNE_QUANTITE_A_RECEPTIONNER'));
      return;
    }

    this.bonCommandeService.receptionnerCommande(this.bon.id, payload).subscribe({
      next: (bon) => {
        this.bon = this.normalizeQrFields(bon);
        this.showReception = false;
        this.showSuccess('Réception enregistrée avec succès');
      },
      error: (err) => {
        console.error(err);
        this.error = err.error?.error || 'Erreur serveur lors de la réception';
      }
    });
  }

  getQrCodeText(): string {
    return this.bon?.publicCode?.trim() || this.bon?.qrHex?.trim() || '';
  }

  hasQrCode(): boolean {
    return !!this.getQrCodeText();
  }

  hasCompleteQrMetadata(): boolean {
    return !!this.getQrCodeText() && !!this.bon?.qrImageBase64?.trim();
  }

  openExistingQrDialog(): void {
    if (!this.hasCompleteQrMetadata() || !this.bon) return;

    this.dialog.open(QrDialogComponent, {
      width: '400px',
      data: {
        qrText: this.getQrCodeText(),
        qrImageBase64: this.bon.qrImageBase64 || '',
        encrypted: true,
        payloadType: 'BONCOMMANDE',
        payloadMode: 'PUBLIC_CODE'
      }
    });
  }

  generateQr(): void {
    if (this.generatingQr || !this.bon?.id) return;

    this.confirmQrRegeneration((confirmed) => {
      if (!confirmed) return;
      this.generatingQr = true;
      this.bonCommandeService.generateQr(this.bon!.id!).subscribe({
        next: (response) => {
          this.generatingQr = false;
          this.bon = {
            ...this.bon!,
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
              payloadType: 'BONCOMMANDE',
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

  private normalizeQrFields(bon: BonCommande): BonCommande {
    const normalized = { ...bon };
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
