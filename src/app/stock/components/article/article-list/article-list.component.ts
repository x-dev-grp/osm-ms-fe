import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ArticleService } from '../../../services/article.service';
import { StockService } from '../../../services/stock.service';
import { Article, CategorieArticle } from '../../../models/article.model';
import { ArticleStockSummary } from '../../../models/article-stock-summary.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { QrResolveResponse } from '../../../../shared/models/qr-models';

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
  stockSummaryMap: Record<string, ArticleStockSummary> = {};
  searchCode = '';
  searchCodeError: string | null = null;
  searchingByCode = false;

  filters = {
    nom: '',
    categorie: '',
    actif: ''
  };

  constructor(
    private articleService: ArticleService,
    private stockService: StockService,
    private router: Router
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
          this.loadStockQuantities();
          this.applyFilters();
          this.loading = false;
        },
        error: (err) => {
          console.error('Erreur chargement articles:', err);
          this.loading = false;
        }
      });
  }

  private loadStockQuantities(): void {
    this.stockService.getStockSummary()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (summaries) => {
          const map: Record<string, ArticleStockSummary> = {};
          summaries.forEach((s) => {
            if (s.articleId) {
              map[s.articleId] = s;
            }
          });
          this.stockSummaryMap = map;
        },
        error: () => {
          this.stockSummaryMap = {};
        }
      });
  }

  getArticleStock(articleId?: string): number {
    if (!articleId) return 0;
    return this.stockSummaryMap[articleId]?.quantiteActuelle ?? 0;
  }

  getArticleDisponible(articleId?: string): number {
    if (!articleId) return 0;
    return this.stockSummaryMap[articleId]?.quantiteDisponible ?? 0;
  }

  getArticleReserve(articleId?: string): number {
    if (!articleId) return 0;
    return this.stockSummaryMap[articleId]?.quantiteReservee ?? 0;
  }

  isBelowMinimum(article: Article): boolean {
    if (!article.id) return false;
    if (this.stockSummaryMap[article.id]?.belowMinimum) {
      return true;
    }
    const qty = this.getArticleStock(article.id);
    const min = Number(article.stockMinimum ?? 0);
    return min > 0 && qty <= min;
  }

  get stockAlertCount(): number {
    return this.filteredArticles.filter(a => this.isBelowMinimum(a)).length;
  }

  applyFilters(): void {
    this.filteredArticles = this.articles.filter(article => {
      let match = true;

      if (this.filters.nom) {
        const term = this.filters.nom.toLowerCase();
        match = match && (
          article.nom.toLowerCase().includes(term) ||
          Boolean(article.code?.toLowerCase().includes(term)) ||
          Boolean(article.publicCode?.toLowerCase().includes(term)) ||
          Boolean(article.qrHex?.toLowerCase().includes(term))
        );
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
    this.searchCode = '';
    this.searchCodeError = null;
    this.applyFilters();
  }

  searchByPublicCode(): void {
    const code = this.searchCode.trim().toUpperCase();
    if (!code || this.searchingByCode) {
      return;
    }

    this.searchCode = code;
    this.searchCodeError = null;
    this.searchingByCode = true;

    this.articleService.searchByCode(code)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.searchingByCode = false;
          const targetRoute = this.resolveTargetRoute(response);
          if (targetRoute) {
            this.router.navigateByUrl(targetRoute);
            return;
          }

          this.searchCodeError = `Aucun article trouvé pour le code ${code}`;
        },
        error: (err) => {
          console.error('Erreur recherche code public', err);
          this.searchingByCode = false;
          this.searchCodeError =
            err?.error?.error ||
            err?.error ||
            `Aucun article trouvé pour le code ${code}`;
        }
      });
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

  private resolveTargetRoute(response: QrResolveResponse | null | undefined): string | null {
    const route = response?.webRoute?.trim();
    if (route) {
      return route.startsWith('/') ? route : `/${route}`;
    }

    if (response?.entityId) {
      return `/stock/articles/${response.entityId}`;
    }

    return null;
  }
}
