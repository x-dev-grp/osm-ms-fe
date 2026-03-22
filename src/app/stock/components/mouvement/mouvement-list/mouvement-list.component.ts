import { Component, OnInit, OnDestroy } from '@angular/core';
import { StockService } from '../../../services/stock.service';
import { MouvementStock, TypeMouvement } from '../../../models/mouvement-stock.model';
import { CommonModule, DatePipe } from "@angular/common";
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { UniteMesure } from "../../../models/article.model";

@Component({
  selector: 'app-mouvement-list',
  templateUrl: './mouvement-list.component.html',
  styleUrls: ['./mouvement-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule
  ]
})
export class MouvementListComponent implements OnInit, OnDestroy {
  // Données
  mouvements: MouvementStock[] = [];
  filteredMouvements: MouvementStock[] = [];

  // États
  loading = false;
  error: string | null = null;
  totalMouvements = 0;

  // Filtres
  typeFilter: string = '';
  searchTerm: string = '';
  startDate: string = '';
  endDate: string = '';
  showFilters: boolean = true; // Initialisé à true

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  // Statistiques
  stats = {
    totalEntrees: 0,
    totalSorties: 0,
    quantiteTotale: 0
  };

  // Pour le debounce de la recherche
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Options pour les filtres
  typeOptions = [
    { value: '', label: 'Tous les types' },
    { value: TypeMouvement.ENTREE, label: 'Entrées' },
    { value: TypeMouvement.SORTIE, label: 'Sorties' }
  ];

  constructor(private stockService: StockService) {
    // Configuration du debounce pour la recherche
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  ngOnInit(): void {
    this.loadMouvements();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMouvements(): void {
    this.loading = true;
    this.error = null;

    this.stockService.getAllMouvements().subscribe({
      next: (data) => {
        this.mouvements = data;
        this.totalMouvements = data.length;
        this.calculateStats();
        this.applyFilters();
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des mouvements', err);
        this.error = 'Impossible de charger les mouvements. Veuillez réessayer plus tard.';
        this.loading = false;
      }
    });
  }

  calculateStats(): void {
    this.stats = {
      totalEntrees: this.mouvements.filter(m => m.typeMouvement === TypeMouvement.ENTREE).length,
      totalSorties: this.mouvements.filter(m => m.typeMouvement === TypeMouvement.SORTIE).length,
      quantiteTotale: this.mouvements.reduce((sum, m) => sum + m.quantite, 0)
    };
  }

  applyFilters(): void {
    let filtered = [...this.mouvements];

    // Filtre par type
    if (this.typeFilter) {
      filtered = filtered.filter(mvt => mvt.typeMouvement === this.typeFilter);
    }

    // Filtre par recherche (article)
    if (this.searchTerm && this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(mvt => {
        if (!mvt.article) return false;

        // Utiliser les propriétés disponibles
        const nom = mvt.article.nom?.toLowerCase() || '';
        // Remplacer 'sku' par 'code' ou 'reference' selon votre modèle
        const code = (mvt.article as any).code || (mvt.article as any).sku || '';
        const motif = mvt.motif?.toLowerCase() || '';

        return nom.includes(term) ||
          code.toString().toLowerCase().includes(term) ||
          motif.includes(term);
      });
    }

    // Filtre par dates
    if (this.startDate) {
      const start = new Date(this.startDate);
      start.setHours(0, 0, 0);
      filtered = filtered.filter(mvt => {
        if (!mvt.dateMouvement) return true;
        return new Date(mvt.dateMouvement) >= start;
      });
    }

    if (this.endDate) {
      const end = new Date(this.endDate);
      end.setHours(23, 59, 59);
      filtered = filtered.filter(mvt => {
        if (!mvt.dateMouvement) return true;
        return new Date(mvt.dateMouvement) <= end;
      });
    }

    this.filteredMouvements = filtered;
    this.totalPages = Math.ceil(this.filteredMouvements.length / this.itemsPerPage);
    this.currentPage = 1;
  }

  resetFilters(): void {
    this.typeFilter = '';
    this.searchTerm = '';
    this.startDate = '';
    this.endDate = '';
    this.applyFilters();
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  getPaginatedMouvements(): MouvementStock[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredMouvements.slice(start, end);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getTypeClass(type: string): { class: string; icon: string } {
    switch(type) {
      case TypeMouvement.ENTREE:
        return { class: 'success', icon: 'arrow-down' };
      case TypeMouvement.SORTIE:
        return { class: 'danger', icon: 'arrow-up' };
      default:
        return { class: 'secondary', icon: 'circle' };
    }
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getArticleCode(article: any): string {
    if (!article) return '-';
    // Essayer différentes propriétés possibles
    return article.code || article.sku || article.reference?.code || '-';
  }

  getArticleNom(article: any): string {
    return article?.nom || 'Article inconnu';
  }

  getUniteMesure(article: any): string {
    if (!article) return '';
    // Essayer différentes propriétés possibles
    return article.um || article.uniteMesure || '';
  }

  exportToCSV(): void {
    const headers = ['Date', 'Code', 'Article', 'Type', 'Quantité', 'Unité', 'Motif'];
    const csvData = this.filteredMouvements.map(m => [
      this.formatDate(m.dateMouvement),
      this.getArticleCode(m.article),
      this.getArticleNom(m.article),
      m.typeMouvement,
      m.quantite,
      this.getUniteMesure(m.article),
      m.motif || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `mouvements_stock_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
