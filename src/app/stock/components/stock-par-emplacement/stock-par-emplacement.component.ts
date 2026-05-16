import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from "../../services/stock.service";
import { EmplacementStockService } from "../../services/emplacement-stock.service";
import { CategorieArticle } from "../../models/article.model";
import { EmplacementStock } from "../../models/emplacement-stock.model";
import { Stock } from "../../models/stock.model";

@Component({
  selector: 'app-stock-par-emplacement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock-par-emplacement.component.html',
  styleUrls: ['./stock-par-emplacement.component.scss']
})
export class StockParEmplacementComponent implements OnInit {

  emplacements: EmplacementStock[] = [];
  selectedEmplacementId: string = '';
  allStocks: Stock[] = [];
  loadingStocks = false;
  loadingEmplacements = false;
  error = '';
  searchTerm = '';
  categorieFilter = '';
  categories = Object.values(CategorieArticle);

  constructor(
    private emplacementService: EmplacementStockService,
    private stockService: StockService
  ) {}

  ngOnInit(): void {
    this.loadEmplacements();
    this.loadAllStocks();
  }

  loadEmplacements(): void {
    this.loadingEmplacements = true;
    this.emplacementService.getAllEmplacements().subscribe({
      next: (response: any) => {
        this.emplacements = (response?.data || []).flat();
        this.loadingEmplacements = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Erreur chargement emplacements';
        this.loadingEmplacements = false;
      }
    });
  }

  loadAllStocks(): void {
    this.loadingStocks = true;
    this.stockService.getAllStocks().subscribe({
      next: (stocks: Stock[]) => {
        this.allStocks = stocks;
        this.loadingStocks = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Erreur chargement stocks';
        this.loadingStocks = false;
      }
    });
  }

  get filteredStocks(): Stock[] {
    let filtered = this.allStocks;
    if (this.selectedEmplacementId) {
      filtered = filtered.filter(stock => stock.emplacement?.id === this.selectedEmplacementId);
    }
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(stock =>
        stock.article.nom.toLowerCase().includes(term) ||
        (stock.article.code && stock.article.code.toLowerCase().includes(term))
      );
    }
    if (this.categorieFilter) {
      filtered = filtered.filter(stock => stock.article.categorie === this.categorieFilter);
    }
    return filtered;
  }

  getCategorieLabel(categorie: string): string {
    const labels: Record<string, string> = {
      [CategorieArticle.CONSOMMABLE]: 'Consommable',
      [CategorieArticle.EMBALLAGE]: 'Emballage'
    };
    return labels[categorie] || categorie;
  }

  getCategorieClass(categorie: string): string {
    const map: Record<string, string> = {
      [CategorieArticle.CONSOMMABLE]: 'success',
      [CategorieArticle.EMBALLAGE]: 'info'
    };
    return map[categorie] || 'secondary';
  }

  getStockStatusClass(available: number, stockMin: number): string {
    if (available <= 0) return 'danger';
    if (available <= stockMin) return 'warning';
    return 'success';
  }

  getStockStatusText(available: number, stockMin: number): string {
    if (available <= 0) return 'Rupture / Réservé';
    if (available <= stockMin) return 'Alerte';
    return 'Normal';
  }
}
