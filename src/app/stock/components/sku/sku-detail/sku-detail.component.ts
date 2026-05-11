import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SKUService } from '../../../services/sku.service';
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
  loading = true;
  error: string | null = null;
  successMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private skuService: SKUService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadSku(id);
    } else {
      this.error = 'ID du produit manquant';
      this.loading = false;
    }
  }

  loadSku(id: string): void {
    this.loading = true;
    this.error = null;

    this.skuService.getProductById(id).subscribe({
      next: (data) => {
        this.sku = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement produit', err);
        this.error = 'Impossible de charger le produit';
        this.loading = false;
      }
    });
  }
  toActif(): void {
    if (!this.sku?.id) return;

    const action = this.sku.actif ? 'désactiver' : 'activer';
    const message = `Voulez-vous ${action} le produit "${this.getProductName()}" ?`;

    if (confirm(message)) {
      const request = this.sku.actif
        ? this.skuService.desactiverSku(this.sku.id)
        : this.skuService.activerSku(this.sku.id);

      request.subscribe({
        next: () => {
          if (this.sku) {
            this.sku.actif = !this.sku.actif;
          }
          this.successMessage = `Produit ${action} avec succès`;
        },
        error: (err) => {
          console.error(`Erreur lors de la ${action}`, err);
          this.error = `Erreur lors de ${action}`;
          setTimeout(() => this.error = null, 3000);
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/stock/products']);
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
}
