import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SKUService } from '../../../services/sku.service';
import { SKU } from '../../../models/sku.model';

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
      this.error = 'ID du SKU manquant';
      this.loading = false;
    }
  }

  loadSku(id: string): void {
    this.loading = true;
    this.error = null;

    this.skuService.getSkuById(id).subscribe({
      next: (data) => {
        this.sku = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement SKU', err);
        this.error = 'Impossible de charger le SKU';
        this.loading = false;
      }
    });
  }
  toActif(): void {
    if (!this.sku?.id) return;

    const action = this.sku.actif ? 'désactiver' : 'activer';
    const message = `Voulez-vous ${action} le SKU "${this.sku.code}" ?`;

    if (confirm(message)) {
      const request = this.sku.actif
        ? this.skuService.desactiverSku(this.sku.id)
        : this.skuService.activerSku(this.sku.id);

      request.subscribe({
        next: () => {
          if (this.sku) {
            this.sku.actif = !this.sku.actif;
          }
          this.successMessage = `SKU ${action} avec succès`;
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
    this.router.navigate(['/stock/skus']);
  }

  getVolumeParPalette(): number | null {
    if (!this.sku) return null;
    if (!this.sku.volume || !this.sku.colisParPalette || !this.sku.unitesParCols) return null;

    return this.sku.volume * this.sku.unitesParCols * this.sku.colisParPalette;
  }

  getUnitesParPalette(): number | null {
    if (!this.sku) return null;
    if (!this.sku.colisParPalette || !this.sku.unitesParCols) return null;

    return this.sku.colisParPalette * this.sku.unitesParCols;
  }
}
