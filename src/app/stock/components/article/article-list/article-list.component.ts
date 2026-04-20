import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ArticleService } from '../../../services/article.service';
import { Article, CategorieArticle } from '../../../models/article.model';

@Component({
  selector: 'app-article-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './article-list.component.html',
  styleUrls: ['./article-list.component.scss']
})
export class ArticleListComponent implements OnInit {
  articles: Article[] = [];
  filteredArticles: Article[] = [];
  categories = Object.values(CategorieArticle);
  loading = false;
  togglingId: string | null = null;
  activeDropdown: string | null = null;

  filters = {
    nom: '',
    categorie: '',
    actif: ''
  };

  constructor(private articleService: ArticleService) {}

  ngOnInit(): void {
    this.loadArticles();
  }

  loadArticles(): void {
    this.loading = true;
    this.articleService.getAllArticles().subscribe({
      next: (data) => {
        this.articles = data.sort((a, b) => {
          if (a.actif !== b.actif) {
            return a.actif ? -1 : 1;
          }
          const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
          const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
          return dateB - dateA;
        });
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement articles:', err);
        this.loading = false;
      }
    });
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

      request.subscribe({
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
    const classes = {
      [CategorieArticle.UNITE]: 'bg-primary',
      [CategorieArticle.COLIS]: 'bg-success',
      [CategorieArticle.PALETTE]: 'bg-info',
      [CategorieArticle.EMBALLAGE]: 'bg-primary',
      [CategorieArticle.CONSOMMABLE]: 'bg-warning text-dark',
      [CategorieArticle.MATIERE_PREMIERE]: 'bg-info',
      [CategorieArticle.ACCESSOIRE]: 'bg-secondary'
    };
    return classes[categorie] || 'bg-light text-dark';
  }

  getCategoryIcon(categorie: CategorieArticle): string {
    const icons = {
      [CategorieArticle.UNITE]: 'fas fa-cube',
      [CategorieArticle.COLIS]: 'fas fa-boxes',
      [CategorieArticle.PALETTE]: 'fas fa-pallet',
      [CategorieArticle.EMBALLAGE]: 'fas fa-box',
      [CategorieArticle.CONSOMMABLE]: 'fas fa-wine-bottle',
      [CategorieArticle.MATIERE_PREMIERE]: 'fas fa-cubes',
      [CategorieArticle.ACCESSOIRE]: 'fas fa-microchip'
    };
    return icons[categorie] || 'fas fa-tag';
  }

  toggleDropdown(id: string | undefined, event: Event): void {
    event.stopPropagation();
    this.activeDropdown = this.activeDropdown === id ? null : id!;
  }
}
