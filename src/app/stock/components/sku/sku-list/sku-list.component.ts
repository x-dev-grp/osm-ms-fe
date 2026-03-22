import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SKUService } from '../../../services/sku.service';
import { SKU } from '../../../models/sku.model';

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

  constructor(private skuService: SKUService) {}

  ngOnInit(): void {
    this.loadSkus();
  }

  loadSkus(): void {
    this.loading = true;
    this.error = null;

    this.skuService.getAllSkus().subscribe({
      next: (response: any) => {
        console.log("API RESPONSE:", response);
        this.skus = response ?? [];
        this.resetFilters();
        console.log("SKUS LIST:", this.skus);
        this.loading = false;
      },
      error: (err) => {
        console.error("Erreur chargement SKUs:", err);
        this.error = "Impossible de charger la liste des SKUs";
        this.loading = false;
      },
      complete: () => {
        console.log("Chargement terminé");
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.skus];
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(sku =>
        sku.code.toLowerCase().includes(term) ||
        (sku.category && sku.category.toLowerCase().includes(term))
      );
    }
    if (this.categoryFilter) {
      filtered = filtered.filter(sku => sku.category === this.categoryFilter);
    }
    this.filteredSkus = filtered;
  }

  onSearch(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.categoryFilter = '';
    this.applyFilters();
  }

  toActif(sku: SKU, event: Event): void {
    event.stopPropagation();

    const action = sku.actif ? 'désactiver' : 'activer';
    const message = `Voulez-vous ${action} le SKU "${sku.code}" ?`;

    if (confirm(message)) {
      const request = sku.actif
        ? this.skuService.desactiverSku(sku.id!)
        : this.skuService.activerSku(sku.id!);

      request.subscribe({
        next: () => {
          this.successMessage = `SKU ${action} avec succès`;
          sku.actif = !sku.actif;
          setTimeout(() => this.successMessage = null, 3000);
        },
        error: (err) => {
          console.error(`Erreur lors de la ${action}`, err);
          this.error = `Erreur lors de ${action}`;
          setTimeout(() => this.error = null, 3000);
        }
      });
    }
  }

  getCategories(): string[] {
    const categories = this.skus
      .map(sku => sku.category)
      .filter((cat): cat is string => cat !== undefined && cat !== null && cat !== '');
    return [...new Set(categories)];
  }
}
