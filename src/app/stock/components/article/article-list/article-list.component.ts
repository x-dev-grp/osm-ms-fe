import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ArticleService } from '../../../services/article.service';
import { Article, CategorieArticle } from '../../../models/article.model';
import {
  articleBelowMinimum,
  articleQuantiteActuelle,
  articleQuantiteDisponible,
  articleQuantiteReservee
} from '../../../utils/article-stock.util';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
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
  dropdownPosition = { top: 0, left: 0 };
  currentPage = 1;
  pageSize = 10;
  readonly pageSizeOptions = [5, 10, 25, 50];
  searchCode = '';
  searchCodeError: string | null = null;
  searchingByCode = false;
  private listInitialized = false;

  filters = {
    nom: '',
    categorie: '',
    actif: ''
  };

  constructor(
    private articleService: ArticleService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadArticles();

    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      filter((event) => event.urlAfterRedirects === '/stock/articles'),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.listInitialized) {
        this.loadArticles();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadArticles(): void {
    this.loading = true;

    this.articleService.getAllArticles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (articles) => {
          this.articles = articles.sort((a, b) => {
            if (a.actif !== b.actif) {
              return a.actif ? -1 : 1;
            }
            const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
            const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
            return dateB - dateA;
          });
          this.applyFilters();
          this.loading = false;
          this.listInitialized = true;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erreur chargement articles:', err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  getArticleStock(article: Article): number {
    return articleQuantiteActuelle(article);
  }

  getArticleDisponible(article: Article): number {
    return articleQuantiteDisponible(article);
  }

  getArticleReserve(article: Article): number {
    return articleQuantiteReservee(article);
  }

  isBelowMinimum(article: Article): boolean {
    return articleBelowMinimum(article);
  }

  get stockAlertCount(): number {
    return this.filteredArticles.filter(a => this.isBelowMinimum(a)).length;
  }

  get pagedArticles(): Article[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredArticles.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredArticles.length / this.pageSize));
  }

  get paginationStart(): number {
    if (this.filteredArticles.length === 0) {
      return 0;
    }
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredArticles.length);
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
    this.currentPage = 1;
    this.activeDropdown = null;
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

  onPageSizeChange(pageSize: number | string): void {
    this.pageSize = Number(pageSize);
    this.goToPage(1);
  }

  goToPage(page: number): void {
    this.currentPage = Math.min(Math.max(page, 1), this.totalPages);
    this.activeDropdown = null;
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

  @HostListener('document:click')
  closeDropdown(): void {
    this.activeDropdown = null;
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  closeDropdownOnViewportChange(): void {
    this.activeDropdown = null;
  }

  toggleDropdown(article: Article, event: Event): void {
    event.stopPropagation();
    if (!article.id) return;

    if (this.activeDropdown === article.id) {
      this.activeDropdown = null;
      return;
    }

    this.dropdownPosition = this.getDropdownPosition(event.currentTarget as HTMLElement, article);
    this.activeDropdown = article.id;
  }

  private getDropdownPosition(trigger: HTMLElement, article: Article): { top: number; left: number } {
    const rect = trigger.getBoundingClientRect();
    const menuWidth = 176;
    const menuHeight = article.actif ? 138 : 50;
    const gap = 8;
    const padding = 12;

    const left = Math.min(
      Math.max(rect.right - menuWidth, padding),
      window.innerWidth - menuWidth - padding
    );
    let top = rect.bottom + gap;
    if (top + menuHeight > window.innerHeight - padding) {
      top = rect.top - menuHeight - gap;
    }

    return {
      top: Math.max(top, padding),
      left
    };
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
