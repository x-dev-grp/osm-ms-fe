import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ArticleService } from '../../../services/article.service';
import { StockService } from '../../../services/stock.service';
import { Article } from '../../../models/article.model';
import { Stock } from '../../../models/stock.model';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, NgClass, FormsModule],
  templateUrl: './article-detail.component.html',
  styleUrls: ['./article-detail.component.scss']
})
export class ArticleDetailComponent implements OnInit {

  article!: Article;
  stock: Stock | null = null;
  loading = true;
  Actif = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private articleService: ArticleService,
    private stockService: StockService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];

    if (!id) {
      console.error('ID article manquant');
      this.router.navigate(['/stock/articles']);
      return;
    }
    this.loadArticle(id);
  }

  loadArticle(id: string): void {
    this.loading = true;
    this.articleService.getArticleById(id).subscribe({
      next: (article) => {
        this.article = article;
        this.loadStock(id);
      },
      error: (err) => {
        console.error('Erreur chargement article', err);
        this.loading = false;
        this.router.navigate(['/stock/articles']);
      }
    });
  }

  loadStock(articleId: string): void {
    this.stockService.getStockByArticle(articleId).subscribe({
      next: (stock) => {
        this.stock = stock;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement stock', err);
        this.stock = null;
        this.loading = false;
      }
    });
  }



  toActif(): void {
    if (!this.article?.id) return;

    const action = this.article.actif ? 'désactiver' : 'activer';
    const message = `Voulez-vous vraiment ${action} cet article ?`;

    if (confirm(message)) {
      this.Actif = true;

      const request = this.article.actif
        ? this.articleService.desactiverArticle(this.article.id)
        : this.articleService.activerArticle(this.article.id);

      request.subscribe({
        next: (updatedArticle) => {
          this.article = updatedArticle;
          this.Actif = false;
          const successMessage = `Article ${action} avec succès`;
          console.log(successMessage);
        },
        error: (err) => {
          console.error(`Erreur lors de la ${action} de l'article`, err);
          this.Actif = false;
          alert(`Erreur lors de l'${action} de l'article`);
        }
      });
    }
  }

  getStockStatus(): string {
    if (!this.stock || !this.article) return '';

    const quantite = Number(this.stock.quantiteActuelle ?? 0);
    const stockMin = Number(this.article.stockMinimum ?? 0);

    if (quantite <= 0) return 'low';
    if (quantite <= stockMin) return 'medium';

    return 'high';
  }}



































/*
ajouter les variables
 mouvements: MouvementStock[] = [];
  loadingMouvements = false;
    showMouvementForm = false;
  mouvementType: TypeMouvement = TypeMouvement.ENTREE;

  quantite = 0;
  motif = '';

  TypeMouvement = TypeMouvement;
 this.loadMouvements(); ajouter dans le load article pour load les mouvement
  onMouvement(): void {

    if (this.quantite <= 0) {
      alert('La quantité doit être positive');
      return;
    }

    if (this.mouvementType === TypeMouvement.ENTREE) {

      this.stockService.entreeStock(this.article.id!, this.quantite, this.motif).subscribe({
        next: (updatedStock) => {

          this.stock = updatedStock;
          this.showMouvementForm = false;

          this.quantite = 0;
          this.motif = '';

          this.loadMouvements();
        },
        error: (err) => {
          console.error('Erreur entrée stock', err);
          alert('Erreur lors de l\'entrée en stock');
        }
      });

    } else if (this.mouvementType === TypeMouvement.SORTIE) {

      this.stockService.sortieStock(this.article.id!, this.quantite, this.motif).subscribe({
        next: (updatedStock) => {

          this.stock = updatedStock;
          this.showMouvementForm = false;

          this.quantite = 0;
          this.motif = '';

          this.loadMouvements();
        },
        error: (err) => {
          console.error('Erreur sortie stock', err);

          if (err.error?.message) {
            alert(err.error.message);
          } else {
            alert('Erreur lors de la sortie de stock');
          }
        }
      });

    }
  }
  loadMouvements(): void {
    if (!this.article?.id) return;

    this.loadingMouvements = true;

    this.stockService.getMouvementsByArticle(this.article.id).subscribe({
      next: (mouvements) => {

        this.mouvements = mouvements.sort((a, b) =>
          new Date(b.dateMouvement ?? '').getTime() -
          new Date(a.dateMouvement ?? '').getTime()
        );

        this.loadingMouvements = false;
      },
      error: (err) => {
        console.error('Erreur chargement mouvements', err);
        this.loadingMouvements = false;
      }
    });
  }

  onDelete(): void {
    if (confirm('Voulez-vous vraiment supprimer cet article ?')) {
      this.articleService.deleteArticle(this.article.id!).subscribe({
        next: () => this.router.navigate(['/stock/articles']),
        error: (err) => {
          console.error('Erreur suppression', err);
          alert('Erreur lors de la suppression');
        }
      });
    }
  }

}*/
