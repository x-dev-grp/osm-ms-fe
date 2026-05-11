import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
  selector: 'app-sku-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './sku-list.component.html',
  styleUrls: ['./sku-list.component.scss']
})
export class SkuListComponent implements OnInit {
  skus: SKU[] = [];
  filteredSkus: SKU[] = [];
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;
  searchTerm: string = '';
  categoryFilter: string = '';
  typeFilter: ProductType | '' = '';
  readonly productTypes: ProductType[] = ['VRAC', 'NON_VRAC'];

  // Pour gérer le chargement pendant le toggle
  togglingId: string | null = null;

  constructor(private skuService: SKUService) {}

  ngOnInit(): void {
    this.loadSkus();
  }

  loadSkus(): void {
    this.loading = true;
    this.error = null;

    this.skuService.getAllProducts().subscribe({
      next: (response: any) => {
        const skus = response ?? [];
        // Tri : actifs d'abord (true > false) puis par date décroissante
        this.skus = skus.sort((a: SKU, b: SKU) => {
          if (a.actif !== b.actif) {
            return a.actif ? -1 : 1;
          }
          // Utilisez createdDate si disponible, sinon id
          const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
          const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
          return dateB - dateA;
        });
        this.resetFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error("Erreur chargement produits:", err);
        this.error = "Impossible de charger la liste des produits";
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.skus];
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(sku =>
        productDisplayName(sku).toLowerCase().includes(term) ||
        (sku.code && sku.code.toLowerCase().includes(term)) ||
        (sku.category && sku.category.toLowerCase().includes(term)) ||
        (sku.grade && sku.grade.toLowerCase().includes(term)) ||
        (sku.brand && sku.brand.toLowerCase().includes(term)) ||
        (sku.barcode && sku.barcode.toLowerCase().includes(term))
      );
    }
    if (this.categoryFilter) {
      filtered = filtered.filter(sku => sku.category === this.categoryFilter);
    }
    if (this.typeFilter) {
      filtered = filtered.filter(sku => sku.type === this.typeFilter);
    }
    this.filteredSkus = filtered;
  }

  onSearch(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.categoryFilter = '';
    this.typeFilter = '';
    this.applyFilters();
  }

  // Méthode toggle activée/désactivée
  toActif(sku: SKU, event: Event): void {
    event.stopPropagation();

    const action = sku.actif ? 'désactiver' : 'activer';
    const message = `Voulez-vous ${action} le produit "${productDisplayName(sku)}" ?`;

    if (confirm(message)) {
      this.togglingId = sku.id!;
      const request = sku.actif
        ? this.skuService.desactiverSku(sku.id!)
        : this.skuService.activerSku(sku.id!);

      request.subscribe({
        next: () => {
          // Mettre à jour le statut localement
          sku.actif = !sku.actif;
          // Re-trier la liste complète
          this.sortSkus();
          // Réappliquer les filtres
          this.applyFilters();
          this.togglingId = null;
          this.successMessage = `Produit ${action} avec succès`;
          setTimeout(() => this.successMessage = null, 3000);
        },
        error: (err) => {
          console.error(`Erreur lors de la ${action}`, err);
          this.error = `Erreur lors de ${action}`;
          this.togglingId = null;
          setTimeout(() => this.error = null, 3000);
        }
      });
    }
  }

  // Fonction de tri réutilisable
  private sortSkus(): void {
    this.skus.sort((a, b) => {
      if (a.actif !== b.actif) {
        return a.actif ? -1 : 1;
      }
      const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
      const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
      return dateB - dateA;
    });
  }

  getCategories(): string[] {
    const categories = this.skus
      .map(sku => sku.category)
      .filter((cat): cat is string => cat !== undefined && cat !== null && cat !== '');
    return [...new Set(categories)];
  }

  getProductName(sku: SKU): string {
    return productDisplayName(sku);
  }

  formatProductType(type?: ProductType): string {
    return productTypeLabel(type);
  }

  packagingSummary(sku: SKU): string {
    if (sku.type === 'VRAC') {
      return [sku.unitOfMeasure, sku.density ? `densite ${sku.density}` : '', sku.storageUnit]
        .filter(Boolean)
        .join(' / ') || '-';
    }

    const unitsPerCarton = productUnitsPerCarton(sku);
    const cartonsPerPallet = productCartonsPerPallet(sku);
    return [
      sku.volume ? `${sku.volume} ml` : '',
      sku.packagingType,
      unitsPerCarton ? `${unitsPerCarton} u/carton` : '',
      cartonsPerPallet ? `${cartonsPerPallet} c/palette` : ''
    ].filter(Boolean).join(' / ') || '-';
  }
}
