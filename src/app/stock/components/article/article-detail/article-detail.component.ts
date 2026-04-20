import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ArticleService } from '../../../services/article.service';
import { StockService } from '../../../services/stock.service';
import { EmplacementStockService } from '../../../services/emplacement-stock.service'; // <-- NOUVEAU
import { Article } from '../../../models/article.model';
import { Stock } from '../../../models/stock.model';
import { EmplacementStock } from '../../../models/emplacement-stock.model'; // <-- NOUVEAU
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MouvementStock, TypeMouvement } from "../../../models/mouvement-stock.model";

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
  mouvements: MouvementStock[] = [];
  loadingMouvements = false;
  showMouvementForm = false;
  mouvementType: TypeMouvement = TypeMouvement.ENTREE;
  showAjustementForm = false;
  ajustementQuantite = 0;
  ajustementMotif = '';
  quantite = 0;
  motif = '';
  generatingQr = false;
  showEmplacementForm = false;
  emplacements: EmplacementStock[] = [];
  selectedEmplacementId: string | null = null;
  loadingEmplacements = false;
  TypeMouvement = TypeMouvement;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private articleService: ArticleService,
    private stockService: StockService,
    private emplacementService: EmplacementStockService
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
        this.loadMouvements();
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
  onAjustement(): void {
    if (this.ajustementQuantite === 0) {
      alert('La quantité d’ajustement ne peut pas être nulle');
      return;
    }
    this.stockService.ajusterStock(this.article.id!, this.ajustementQuantite, this.ajustementMotif).subscribe({
      next: (updatedStock) => {
        this.stock = updatedStock;
        this.showAjustementForm = false;
        this.ajustementQuantite = 0;
        this.ajustementMotif = '';
        this.loadMouvements();
      },
      error: (err) => {
        console.error('Erreur lors de l’ajustement', err);
        alert('Erreur lors de l’ajustement du stock');
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
  }
  openAssignEmplacement(): void {
    this.showEmplacementForm = true;
    this.loadingEmplacements = true;
    this.emplacementService.getAllEmplacements().subscribe({
      next: (response) => {
        if (response && response.data) {
          // @ts-ignore
          this.emplacements = response.data.filter(e => e.actif === true && e.disponible === true);
        } else {
          this.emplacements = [];
        }
        this.loadingEmplacements = false;
      },
      error: (err) => {
        console.error('Erreur chargement emplacements', err);
        this.loadingEmplacements = false;
        alert('Impossible de charger la liste des emplacements');
      }
    });
  }

  assignEmplacement(): void {
    if (!this.stock?.id || !this.selectedEmplacementId) {
      alert('Veuillez sélectionner un emplacement');
      return;
    }
    this.stockService.assignerEmplacement(this.stock.id, this.selectedEmplacementId).subscribe({
      next: (updatedStock) => {
        this.stock = updatedStock;
        this.showEmplacementForm = false;
        this.selectedEmplacementId = null;
        alert('Emplacement assigné avec succès');
      },
      error: (err) => {
        console.error('Erreur assignation emplacement', err);
        alert('Erreur lors de l’assignation de l’emplacement');
      }
    });
  }

  retirerEmplacement(): void {
    if (!this.stock?.id) return;

    if (confirm('Voulez-vous vraiment retirer l’emplacement actuel ?')) {
      this.stockService.retirerEmplacement(this.stock.id).subscribe({
        next: (updatedStock) => {
          this.stock = updatedStock;
          alert('Emplacement retiré avec succès');
        },
        error: (err) => {
          console.error('Erreur retrait emplacement', err);
          alert('Erreur lors du retrait de l’emplacement');
        }
      });
    }
  }
  transfererEmplacement(): void {
    this.openAssignEmplacement();
  }


  generateQr(): void {
    if (this.generatingQr || !this.article?.id) return;
    this.generatingQr = true;
    this.articleService.generateQr(this.article.id).subscribe({
      next: (qrInfo) => {
        this.article = {
          ...this.article,
          publicCode: qrInfo.publicCode,
          qrUrl: qrInfo.qrUrl,
          qrImageBase64: qrInfo.qrImageBase64
        };
        this.generatingQr = false;
      },
      error: (err) => {
        console.error(err);
        alert('Erreur lors de la génération du QR code');
        this.generatingQr = false;
      }
    });
  }

  printQr(): void {
    if (!this.article.qrImageBase64) {
      alert('QR code non disponible');
      return;
    }

    const printContent = `
      <div style="text-align: center; padding: 20px; font-family: sans-serif;">
        <h2>Article ${this.article.nom}</h2>
        <img src="data:image/png;base64,${this.article.qrImageBase64}"
             style="width: 200px; height: 200px; margin: 20px 0;" />
        <p style="font-size: 16px;">Code manuel : <strong>${this.article.publicCode}</strong></p>
        <p style="margin-top: 20px; font-size: 12px; color: gray;">Scannez le QR code ou saisissez le code manuel</p>
      </div>
    `;

    const printWindow = window.open('', '_blank', 'width=600,height=600');
    printWindow?.document.write(`
      <html>
        <head>
          <title>QR Code - Article ${this.article.nom}</title>
          <style>
            body { font-family: Arial, sans-serif; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    printWindow?.document.close();
    printWindow?.print();
  }
}
