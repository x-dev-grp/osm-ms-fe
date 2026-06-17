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
import { FournisseurService } from '../../../services/fournisseur.service';
import { Fournisseur, CategorieFournisseur } from '../../../models/fournisseur.model';
import { QrDialogComponent } from '../../../../shared/components/qr-dialog/qr-dialog.component';
import { ConfirmationDialogService, ConfirmationType } from '../../../../shared/services/confirmation-dialog.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-fournisseur-detail',
  standalone: true,
  imports: [TranslateModule, CommonModule, RouterLink, MatButtonModule, MatDialogModule, MatIconModule, MatTooltipModule],
  templateUrl: './fournisseur-detail.component.html',
  styleUrls: ['./fournisseur-detail.component.scss']
})
export class FournisseurDetailComponent implements OnInit {
  private readonly i18n = inject(TranslateService);
  fournisseur?: Fournisseur;
  loading = true;
  generatingQr = false;
  activeTab: 'info' | 'contact' | 'commercial' | 'finance' | 'category' = 'info';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fournisseurService: FournisseurService,
    private dialog: MatDialog,
    private confirmationDialog: ConfirmationDialogService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadFournisseur();
  }

  loadFournisseur(): void {
    const id = this.route.snapshot.params['id'];
    this.fournisseurService.getFournisseurById(id).subscribe({
      next: (data) => {
        this.fournisseur = this.normalizeQrFields(data);
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement fournisseur:', error);
        this.router.navigate(['/stock/fournisseurs']);
      }
    });
  }

  getQrCodeText(): string {
    return this.fournisseur?.publicCode?.trim() || this.fournisseur?.qrHex?.trim() || '';
  }

  hasQrCode(): boolean {
    return !!this.getQrCodeText();
  }

  hasCompleteQrMetadata(): boolean {
    return !!this.getQrCodeText() && !!this.fournisseur?.qrImageBase64?.trim();
  }

  openExistingQrDialog(): void {
    if (!this.hasCompleteQrMetadata() || !this.fournisseur) return;

    this.dialog.open(QrDialogComponent, {
      width: '400px',
      data: {
        qrText: this.getQrCodeText(),
        qrImageBase64: this.fournisseur.qrImageBase64 || '',
        encrypted: true,
        payloadType: 'FOURNISSEUR',
        payloadMode: 'PUBLIC_CODE'
      }
    });
  }

  generateQr(): void {
    if (this.generatingQr || !this.fournisseur?.id) return;

    this.confirmQrRegeneration((confirmed) => {
      if (!confirmed) return;
      this.generatingQr = true;
      this.fournisseurService.generateQr(this.fournisseur!.id!).subscribe({
        next: (response) => {
          this.generatingQr = false;
          this.fournisseur = {
            ...this.fournisseur!,
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
              payloadType: 'FOURNISSEUR',
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

  Actif(): void {
    if (!this.fournisseur) return;

    const action = this.fournisseur.actif ? 'désactiver' : 'activer';
    const message = `Voulez-vous ${action} le fournisseur "${this.fournisseur.nom}" ?`;

    if (confirm(message)) {
      const serviceCall = this.fournisseur.actif
        ? this.fournisseurService.desactiverFournisseur(this.fournisseur.id!)
        : this.fournisseurService.activerFournisseur(this.fournisseur.id!);

      serviceCall.subscribe({
        next: (updated) => {
          this.fournisseur = this.normalizeQrFields(updated);
        },
        error: (error) => {
          console.error('Erreur changement statut:', error);
        }
      });
    }
  }

  showDeliveryFields(): boolean {
    const cat = this.fournisseur?.categorieFournisseur;
    return cat === CategorieFournisseur.MATIERES_PREMIERES
      || cat === CategorieFournisseur.PRODUITS_FINIS
      || cat === CategorieFournisseur.TRANSPORT;
  }

  showPackagingFields(): boolean {
    const cat = this.fournisseur?.categorieFournisseur;
    return cat === CategorieFournisseur.EMBALLAGES
      || cat === CategorieFournisseur.ETIQUETTES
      || cat === CategorieFournisseur.BOUCHONS
      || cat === CategorieFournisseur.CAPSULES
      || cat === CategorieFournisseur.OPERCULES
      || cat === CategorieFournisseur.FILMS
      || cat === CategorieFournisseur.CARTONS
      || cat === CategorieFournisseur.PALETTES;
  }

  showServiceFields(): boolean {
    return this.fournisseur?.categorieFournisseur === CategorieFournisseur.SERVICES;
  }

  private normalizeQrFields(fournisseur: Fournisseur): Fournisseur {
    const normalized = { ...fournisseur };
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
    }).pipe(take(1))
      .subscribe((result) => onResolved(!!result?.confirmed));
  }
}
