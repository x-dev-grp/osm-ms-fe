import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SKUService } from '../../../services/sku.service';
import { LabelService } from '../../../../labels/services/label.service';
import { LabelContentDto } from '../../../../labels/models/label.model';
import { ToastService } from '../../../../shared/services/toast.service';
import {
  ConfirmationDialogService,
  ConfirmationType
} from '../../../../shared/services/confirmation-dialog.service';
import {
  ProductType,
  SKU,
  productCartonsPerPallet,
  productDisplayName,
  productTypeLabel,
  productUnitsPerCarton
} from '../../../models/sku.model';

@Component({
  selector: 'app-sku-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sku-detail.component.html',
  styleUrls: ['./sku-detail.component.scss']
})
export class SkuDetailComponent implements OnInit {
  sku: SKU | null = null;
  relatedLabels: LabelContentDto[] = [];
  loading = true;
  labelsLoading = false;
  deleting = false;
  generatingQr = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private skuService: SKUService,
    private labelService: LabelService,
    private toast: ToastService,
    private confirmationDialog: ConfirmationDialogService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadSku(id);
    } else {
      this.toast.error('ID du produit manquant');
      this.loading = false;
      this.router.navigate(['/stock/products']);
    }
  }

  loadSku(id: string): void {
    this.loading = true;
    this.labelsLoading = true;

    forkJoin({
      sku: this.skuService.getProductById(id),
      labels: this.labelService.getByProductId(id)
    }).subscribe({
      next: ({ sku, labels }) => {
        this.sku = sku;
        this.relatedLabels = [...(labels ?? [])].sort((left, right) =>
          (right.packagingDate || right.finalizedAt || '').localeCompare(left.packagingDate || left.finalizedAt || '')
        );
        this.loading = false;
        this.labelsLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement produit', err);
        this.toast.error('Impossible de charger le produit');
        this.loading = false;
        this.labelsLoading = false;
        this.router.navigate(['/stock/products']);
      }
    });
  }
  toActif(): void {
    if (!this.sku?.id) return;

    const isCurrentlyActif = this.sku.actif === true;
    const action = isCurrentlyActif ? 'desactiver' : 'activer';

    this.confirmationDialog.confirm({
      title: 'Confirmation',
      message: `Voulez-vous vraiment ${action} le produit "${this.getProductName()}" ?`,
      type: ConfirmationType.WARNING,
      confirmText: isCurrentlyActif ? 'Desactiver' : 'Activer',
      cancelText: 'Annuler',
      showIcon: true,
      destructive: isCurrentlyActif
    }).subscribe((result) => {
      if (!result?.confirmed || !this.sku?.id) {
        return;
      }

      const request = this.sku.actif
        ? this.skuService.desactiverSku(this.sku.id)
        : this.skuService.activerSku(this.sku.id);

      request.subscribe({
        next: () => {
          if (this.sku) {
            this.sku.actif = !this.sku.actif;
          }
          this.toast.success(`Produit ${action} avec succes`);
        },
        error: (err) => {
          console.error(`Erreur lors de ${action}`, err);
        }
      });
    });
  }

  goBack(): void {
    this.router.navigate(['/stock/products']);
  }

  deleteSku(): void {
    if (!this.sku?.id) {
      return;
    }

    const productName = this.getProductName();
    this.confirmationDialog.confirmDelete(productName, `Voulez-vous vraiment supprimer le produit "${productName}" ?`)
      .subscribe((result) => {
        if (!result?.confirmed || !this.sku?.id) {
          return;
        }

        this.deleting = true;
        this.skuService.deleteSku(this.sku.id).subscribe({
          next: () => {
            this.toast.success('Produit supprime avec succes');
            this.router.navigate(['/stock/products']);
          },
          error: (err) => {
            console.error('Erreur suppression produit', err);
            this.deleting = false;
          }
        });
      });
  }

  getProductName(): string {
    return productDisplayName(this.sku);
  }

  formatProductType(type?: ProductType): string {
    return productTypeLabel(type);
  }

  getVolumeParPalette(): number | null {
    if (!this.sku) return null;
    const unitsPerCarton = this.getUnitsPerCarton();
    const cartonsPerPallet = this.getCartonsPerPallet();
    if (!this.sku.volume || !cartonsPerPallet || !unitsPerCarton) return null;

    return (this.sku.volume * unitsPerCarton * cartonsPerPallet) / 1000;
  }

  getUnitesParPalette(): number | null {
    if (!this.sku) return null;
    const unitsPerCarton = this.getUnitsPerCarton();
    const cartonsPerPallet = this.getCartonsPerPallet();
    if (!cartonsPerPallet || !unitsPerCarton) return null;

    return cartonsPerPallet * unitsPerCarton;
  }

  getUnitsPerCarton(): number | undefined {
    return productUnitsPerCarton(this.sku);
  }

  getCartonsPerPallet(): number | undefined {
    return productCartonsPerPallet(this.sku);
  }

  isVrac(): boolean {
    return this.sku?.type === 'VRAC';
  }

  hasPackagingInfo(): boolean {
    return !!this.sku && !!(
      this.sku.volume ||
      this.sku.packagingType ||
      this.sku.barcode ||
      this.sku.brand ||
      this.getUnitsPerCarton() ||
      this.getCartonsPerPallet() ||
      this.sku.netWeight ||
      this.sku.grossWeight
    );
  }

  hasBulkInfo(): boolean {
    return !!this.sku && !!(
      this.sku.density ||
      this.sku.storageUnit ||
      this.sku.unitOfMeasure
    );
  }

  relatedLabelsCount(): number {
    return this.relatedLabels.length;
  }

  labelStatusLabel(status?: string): string {
    switch (status) {
      case 'FINALIZED':
        return 'Finalisee';
      case 'DRAFT':
        return 'Brouillon';
      case 'VALIDATED':
        return 'Validee';
      case 'EXPORTED_JSON':
        return 'Exportee';
      default:
        return status || 'Inconnue';
    }
  }

  labelDate(label: LabelContentDto): string {
    return label.packagingDate || label.finalizedAt || '-';
  }

  generateQr(): void {
    if (this.generatingQr || !this.sku?.id) {
      return;
    }

    this.generatingQr = true;
    this.skuService.generateQr(this.sku.id).subscribe({
      next: (qrInfo) => {
        if (this.sku) {
          this.sku = {
            ...this.sku,
            publicCode: qrInfo.publicCode,
            qrHex: qrInfo.publicCode,
            qrUrl: qrInfo.qrUrl,
            qrImageBase64: qrInfo.qrImageBase64
          };
        }
        this.generatingQr = false;
      },
      error: () => {
        this.toast.error('Erreur lors de la generation du QR code');
        this.generatingQr = false;
      }
    });
  }

  printQr(): void {
    if (!this.sku?.qrImageBase64) {
      this.toast.warning('QR code non disponible');
      return;
    }

    const productName = this.getProductName();
    const printContent = `
      <div style="text-align: center; padding: 20px; font-family: sans-serif;">
        <h2>Produit ${productName}</h2>
        <img src="data:image/png;base64,${this.sku.qrImageBase64}"
             style="width: 200px; height: 200px; margin: 20px 0;" />
        <p style="font-size: 16px;">Code manuel : <strong>${this.sku.publicCode}</strong></p>
      </div>
    `;

    const printWindow = window.open('', '_blank', 'width=600,height=600');
    printWindow?.document.write(`
      <html>
        <head>
          <title>QR Code - Produit ${productName}</title>
          <style>body { font-family: Arial, sans-serif; }</style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    printWindow?.document.close();
    printWindow?.print();
  }
}
