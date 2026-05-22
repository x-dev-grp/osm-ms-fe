import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArticleService } from '../../../services/article.service';
import { StockService } from '../../../services/stock.service';
import { EmplacementStockService } from '../../../services/emplacement-stock.service';
import { Article } from '../../../models/article.model';
import { Stock } from '../../../models/stock.model';
import { EmplacementStock } from '../../../models/emplacement-stock.model';
import { MouvementStock, TypeMouvement } from '../../../models/mouvement-stock.model';

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
      error: () => {
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
      error: () => {
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
        this.mouvements = mouvements.sort(
          (a, b) =>
            new Date(b.dateMouvement ?? '').getTime() - new Date(a.dateMouvement ?? '').getTime()
        );
        this.loadingMouvements = false;
      },
      error: () => {
        this.loadingMouvements = false;
      }
    });
  }

  onMouvement(): void {
    if (this.quantite <= 0) {
      alert('La quantite doit etre positive');
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
        error: () => {
          alert("Erreur lors de l'entree en stock");
        }
      });
      return;
    }

    this.stockService.sortieStock(this.article.id!, this.quantite, this.motif).subscribe({
      next: (updatedStock) => {
        this.stock = updatedStock;
        this.showMouvementForm = false;
        this.quantite = 0;
        this.motif = '';
        this.loadMouvements();
      },
      error: (err) => {
        alert(err?.error?.error || err?.error?.message || 'Erreur lors de la sortie de stock');
      }
    });
  }

  onAjustement(): void {
    if (this.ajustementQuantite === 0) {
      alert("La quantite d'ajustement ne peut pas etre nulle");
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
        alert(err?.error?.error || "Erreur lors de l'ajustement du stock");
      }
    });
  }

  toActif(): void {
    if (!this.article?.id) return;
    const action = this.article.actif ? 'desactiver' : 'activer';
    if (!confirm(`Voulez-vous vraiment ${action} cet article ?`)) return;

    this.Actif = true;
    const request = this.article.actif
      ? this.articleService.desactiverArticle(this.article.id)
      : this.articleService.activerArticle(this.article.id);

    request.subscribe({
      next: (updatedArticle) => {
        this.article = updatedArticle;
        this.Actif = false;
      },
      error: () => {
        this.Actif = false;
        alert(`Erreur lors de l'action ${action}`);
      }
    });
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
    this.selectedEmplacementId = null;

    this.emplacementService.getAllEmplacements().subscribe({
      next: (response) => {
        let data: EmplacementStock[] = [];
        // Si le service renvoie un tableau directement
        if (Array.isArray(response)) {
          data = response;
        }
        // Si le service renvoie { data: EmplacementStock[] }
        else if (response && Array.isArray(response.data)) {
          // @ts-ignore
          data = response.data;
        }
        this.emplacements = data.filter(
          (emp) =>
            emp.actif === true &&
            emp.disponible === true &&
            (!emp.categorieArticleStocke || emp.categorieArticleStocke === this.article.categorie)
        );
        this.loadingEmplacements = false;
      },
      error: () => {
        this.loadingEmplacements = false;
        alert('Impossible de charger la liste des emplacements');
      }
    });
  }

  assignEmplacement(): void {
    let selectedId = (this.selectedEmplacementId ?? '').toString().trim();
    if (!selectedId || selectedId === 'null' || selectedId === 'undefined') {
      const selectEl = document.querySelector<HTMLSelectElement>('select.form-control');
      selectedId = (selectEl?.value ?? '').trim();
    }
    if (!selectedId || selectedId === 'null' || selectedId === 'undefined') {
      alert('Veuillez sélectionner un emplacement');
      return;
    }
    if (!this.stock?.id) {
      alert('Stock introuvable pour cet article, veuillez recharger la page');
      return;
    }

    this.stockService.assignerEmplacement(this.stock.id, selectedId).subscribe({
      next: (updatedStock) => {
        this.stock = updatedStock;
        this.showEmplacementForm = false;
        this.selectedEmplacementId = null;
        alert('Emplacement assigné avec succès');
      },
      error: (err) => {
        alert(err?.error?.error || "Erreur lors de l'assignation de l'emplacement");
      }
    });
  }

  retirerEmplacement(): void {
    if (!this.stock?.id) return;
    if (!confirm("Voulez-vous vraiment retirer l'emplacement actuel ?")) return;

    this.stockService.retirerEmplacement(this.stock.id).subscribe({
      next: (updatedStock) => {
        this.stock = updatedStock;
        alert('Emplacement retiré avec succès');
      },
      error: (err) => {
        alert(err?.error?.error || "Erreur lors du retrait de l'emplacement");
      }
    });
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
      error: () => {
        alert('Erreur lors de la generation du QR code');
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
      </div>
    `;

    const printWindow = window.open('', '_blank', 'width=600,height=600');
    printWindow?.document.write(`
      <html>
        <head>
          <title>QR Code - Article ${this.article.nom}</title>
          <style>body { font-family: Arial, sans-serif; }</style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    printWindow?.document.close();
    printWindow?.print();
  }
}
