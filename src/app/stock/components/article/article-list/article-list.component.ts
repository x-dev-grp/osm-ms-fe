import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ArticleService } from '../../../services/article.service';
import { StockService } from '../../../services/stock.service';
import { Article, CategorieArticle } from '../../../models/article.model';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-article-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './article-list.component.html',
  styleUrls: ['./article-list.component.scss']
})
export class ArticleListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  articles: Article[] = [];
  filteredArticles: Article[] = [];
  categories = Object.values(CategorieArticle);
  loading = false;
  togglingId: string | null = null;
  activeDropdown: string | null = null;
  articleStockMap: Record<string, number> = {};

  filters = {
    nom: '',
    categorie: '',
    actif: ''
  };

  constructor(
    private articleService: ArticleService,
    private stockService: StockService
  ) {}

  ngOnInit(): void {
    this.loadArticles();
  }

  ngOnDestroy(): void {
    // Fixed as part of TICKET-009: Unsubscribe to prevent memory leaks
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadArticles(): void {
    this.loading = true;
    this.articleService.getAllArticles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.articles = data.sort((a, b) => {
            if (a.actif !== b.actif) {
              return a.actif ? -1 : 1;
            }
            const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
            const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
            return dateB - dateA;
          });
          this.loadStockQuantities(this.articles);
          this.applyFilters();
          this.loading = false;
        },
        error: (err) => {
          console.error('Erreur chargement articles:', err);
          this.loading = false;
        }
      });
  }

  private loadStockQuantities(articles: Article[]): void {
    const calls = articles
      .filter((a) => !!a.id)
      .map((article) =>
        this.stockService.getStockByArticle(article.id!).pipe(
          catchError(() => of(null))
        )
      );

    if (!calls.length) {
      this.articleStockMap = {};
      return;
    }

    forkJoin(calls)
      .pipe(takeUntil(this.destroy$))
      .subscribe((stocks) => {
        const map: Record<string, number> = {};
        let idx = 0;
        for (const article of articles) {
          if (!article.id) continue;
          const stock = stocks[idx++];
          map[article.id] = stock?.quantiteActuelle ?? 0;
        }
        this.articleStockMap = map;
      });
  }

  getArticleStock(articleId?: string): number {
    if (!articleId) return 0;
    return this.articleStockMap[articleId] ?? 0;
  }

  applyFilters(): void {
    this.filteredArticles = this.articles.filter(article => {
      let match = true;

      if (this.filters.nom) {
        match = match && article.nom.toLowerCase().includes(this.filters.nom.toLowerCase());
      }
      if (this.filters.categorie) {
        match = match && article.categorie === this.filters.categorie;
      }
      if (this.filters.actif !== '') {
        const actif = this.filters.actif === 'true';
        match = match && article.actif === actif;
      }
      return match;
    });
  }

  resetFilters(): void {
    this.filters = { nom: '', categorie: '', actif: '' };
    this.applyFilters();
  }

  toActif(article: Article, event: Event): void {
    event.stopPropagation();
    if (!article.id) return;

    const action = article.actif ? 'désactiver' : 'activer';
    if (confirm(`Voulez-vous vraiment ${action} l'article "${article.nom}" ?`)) {
      this.togglingId = article.id;

      const request = article.actif
        ? this.articleService.desactiverArticle(article.id)
        : this.articleService.activerArticle(article.id);

      request
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedArticle) => {
            const index = this.articles.findIndex(a => a.id === updatedArticle.id);
            if (index !== -1) {
              this.articles[index] = updatedArticle;
            }
            this.sortArticles();
            this.togglingId = null;
          },
          error: (err) => {
            console.error(err);
            this.togglingId = null;
            alert(`Erreur lors de l'${action} de l'article`);
          }
        });
    }
  }

  sortArticles(): void {
    this.articles.sort((a, b) => {
      if (a.actif !== b.actif) {
        return a.actif ? -1 : 1;
      }
      const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
      const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
      return dateB - dateA;
    });
    this.applyFilters();
  }

  getCategoryBadgeClass(categorie: CategorieArticle): string {
    const classes: Record<CategorieArticle, string> = {
      [CategorieArticle.EMBALLAGE]: 'bg-primary',
      [CategorieArticle.CONSOMMABLE]: 'bg-warning text-dark',
      [CategorieArticle.UNITE]: 'bg-dark',
      [CategorieArticle.COLIS]: 'bg-success',
      [CategorieArticle.PALETTE]: 'bg-danger'
    };
    return classes[categorie] || 'bg-light text-dark';
  }

  getCategoryIcon(categorie: CategorieArticle): string {
    const icons = {
      [CategorieArticle.UNITE]: 'fas fa-cube',
      [CategorieArticle.COLIS]: 'fas fa-boxes',
      [CategorieArticle.PALETTE]: 'fas fa-pallet',
      [CategorieArticle.EMBALLAGE]: 'fas fa-box',
      [CategorieArticle.CONSOMMABLE]: 'fas fa-wine-bottle'
    };
    return icons[categorie] || 'fas fa-tag';
  }

  toggleDropdown(id: string | undefined, event: Event): void {
    event.stopPropagation();
    this.activeDropdown = this.activeDropdown === id ? null : id!;
  }
}
