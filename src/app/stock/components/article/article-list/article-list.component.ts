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
        console.log("DATA API :", data);
        this.articles = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement articles:', error);
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
    this.filters = {
      nom: '',
      categorie: '',
      actif: ''
    };
    this.applyFilters();
  }

  getCategoryBadgeClass(categorie: CategorieArticle): string {
    const classes = {
      [CategorieArticle.EMBALLAGE]: 'bg-primary',
      [CategorieArticle.CONSOMMABLE]: 'bg-warning text-dark',
      [CategorieArticle.MATIERE_PREMIERE]: 'bg-info',
      [CategorieArticle.ACCESSOIRE]: 'bg-secondary'
    };
    return classes[categorie] || 'bg-light text-dark';
  }
}
