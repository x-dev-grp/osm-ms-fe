import { Component, inject, OnInit } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
import { ToastService } from '../../../../shared/services/toast.service';
import { mergeStockIntoArticle, stockFromArticle } from '../../../utils/article-stock.util';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [TranslateModule, CommonModule, DatePipe, RouterLink, NgClass, FormsModule],
  templateUrl: './article-detail.component.html',
  styleUrls: ['./article-detail.component.scss']
})
export class ArticleDetailComponent implements OnInit {
  private readonly i18n = inject(TranslateService);

  article!: Article;
  stock: Stock | null = null;
  loading = true;
  Actif = false;
  mouvements: MouvementStock[] = [];
  movementPage = 1;
  movementPageSize = 10;
  movementPageSizeOptions = [5, 10, 25, 50];
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
    private emplacementService: EmplacementStockService,
    private toast: ToastService
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
        this.applyArticle(article);
        this.loadMouvements();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/stock/articles']);
      }
    });
  }

  private applyArticle(article: Article): void {
    this.article = article;
    this.stock = stockFromArticle(article);
  }

  private reloadArticle(): void {
    if (!this.article?.id) {
      return;
    }

    this.articleService.getArticleById(this.article.id).subscribe({
      next: (article) => this.applyArticle(article)
    });
  }

  private applyStockMutation(updatedStock: Stock): void {
    this.stock = updatedStock;
    this.article = mergeStockIntoArticle(this.article, updatedStock);
  }

  loadMouvements(): void {
    if (!this.article?.id) return;
    this.loadingMouvements = true;
    this.stockService.getMouvementsByArticle(this.article.id).subscribe({
      next: (mouvements) => {
        this.mouvements = mouvements.sort((a, b) => new Date(b.dateMouvement ?? '').getTime() - new Date(a.dateMouvement ?? '').getTime());
        this.movementPage = 1;
        this.loadingMouvements = false;
      },
      error: () => {
        this.loadingMouvements = false;
      }
    });
  }

  get pagedMouvements(): MouvementStock[] {
    const start = (this.movementPage - 1) * this.movementPageSize;
    return this.mouvements.slice(start, start + this.movementPageSize);
  }

  get movementTotalPages(): number {
    return Math.max(1, Math.ceil(this.mouvements.length / this.movementPageSize));
  }

  get movementPaginationStart(): number {
    return this.mouvements.length ? (this.movementPage - 1) * this.movementPageSize + 1 : 0;
  }

  get movementPaginationEnd(): number {
    return Math.min(this.movementPage * this.movementPageSize, this.mouvements.length);
  }

  onMovementPageSizeChange(size: number): void {
    this.movementPageSize = Number(size);
    this.movementPage = 1;
  }

  goToMovementPage(page: number): void {
    this.movementPage = Math.min(Math.max(page, 1), this.movementTotalPages);
  }

  onMouvement(): void {
    if (this.quantite <= 0) {
      this.toast.warning('AUTO.LA_QUANTITE_DOIT_ETRE_POSITIVE');
      return;
    }

    if (this.mouvementType === TypeMouvement.ENTREE) {
      this.stockService.entreeStock(this.article.id!, this.quantite, this.motif).subscribe({
        next: (updatedStock) => {
          this.applyStockMutation(updatedStock);
          this.showMouvementForm = false;
          this.quantite = 0;
          this.motif = '';
          this.loadMouvements();
          this.reloadArticle();
        },
        error: (err) => {
          this.toast.error(err?.error?.error || err?.error?.message || 'AUTO.ERREUR_LORS_DE_L_ENTREE_EN_STOCK');
        }
      });
      return;
    }

    this.stockService.sortieStock(this.article.id!, this.quantite, this.motif).subscribe({
      next: (updatedStock) => {
        this.applyStockMutation(updatedStock);
        this.showMouvementForm = false;
        this.quantite = 0;
        this.motif = '';
        this.loadMouvements();
        this.reloadArticle();
      },
      error: (err) => {
        this.toast.error(err?.error?.error || err?.error?.message || 'AUTO.ERREUR_LORS_DE_LA_SORTIE_DE_STOCK');
      }
    });
  }

  onAjustement(): void {
    if (this.ajustementQuantite === 0) {
      this.toast.warning('AUTO.LA_QUANTITE_D_AJUSTEMENT_NE_PEUT_PAS_ETRE_NULLE');
      return;
    }
    this.stockService.ajusterStock(this.article.id!, this.ajustementQuantite, this.ajustementMotif).subscribe({
      next: (updatedStock) => {
        this.applyStockMutation(updatedStock);
        this.showAjustementForm = false;
        this.ajustementQuantite = 0;
        this.ajustementMotif = '';
        this.loadMouvements();
        this.reloadArticle();
      },
      error: (err) => {
        this.toast.error(err?.error?.error || err?.error?.message || 'AUTO.ERREUR_LORS_DE_L_AJUSTEMENT_DU_STOCK');
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
        this.applyArticle(updatedArticle);
        this.Actif = false;
      },
      error: (err) => {
        this.Actif = false;
      }
    });
  }

  getStockStatus(): string {
    if (!this.article) return '';
    const quantite = Number(this.article.quantiteActuelle ?? 0);
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
      next: (emplacements) => {
        this.emplacements = emplacements.filter(
          (emp) =>
            emp.actif !== false &&
            emp.disponible !== false &&
            emp.disponible !== ('false' as any) &&
            (!emp.categorieArticleStocke ||
              String(emp.categorieArticleStocke).toUpperCase() === String(this.article.categorie).toUpperCase())
        );
        this.loadingEmplacements = false;
      },
      error: () => {
        this.loadingEmplacements = false;
        this.toast.error('AUTO.IMPOSSIBLE_DE_CHARGER_LA_LISTE_DES_EMPLACEMENTS');
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
      this.toast.warning('AUTO.VEUILLEZ_SELECTIONNER_UN_EMPLACEMENT');
      return;
    }
    if (!this.stock?.id) {
      this.toast.error('AUTO.STOCK_INTROUVABLE_POUR_CET_ARTICLE_VEUILLEZ_RECHARGER_LA_PAGE');
      return;
    }

    this.stockService.assignerEmplacement(this.stock.id, selectedId).subscribe({
      next: (updatedStock) => {
        this.applyStockMutation(updatedStock);
        this.showEmplacementForm = false;
        this.selectedEmplacementId = null;
        this.toast.success('AUTO.EMPLACEMENT_ASSIGNE_AVEC_SUCCES');
        this.reloadArticle();
      },
      error: (err) => {
        this.toast.error(err?.error?.error || err?.error?.message || 'AUTO.ERREUR_LORS_DE_L_ASSIGNATION_DE_L_EMPLACEMENT');
      }
    });
  }

  retirerEmplacement(): void {
    if (!this.stock?.id) return;
    if (!confirm(this.i18n.instant('AUTO.VOULEZ_VOUS_VRAIMENT_RETIRER_L_EMPLACEMENT_ACTUEL'))) return;

    this.stockService.retirerEmplacement(this.stock.id).subscribe({
      next: (updatedStock) => {
        this.applyStockMutation(updatedStock);
        this.toast.success('AUTO.EMPLACEMENT_RETIRE_AVEC_SUCCES');
        this.reloadArticle();
      },
      error: (err) => {
        this.toast.error(err?.error?.error || err?.error?.message || 'AUTO.ERREUR_LORS_DU_RETRAIT_DE_L_EMPLACEMENT');
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
        this.toast.error('AUTO.ERREUR_LORS_DE_LA_GENERATION_DU_QR_CODE');
        this.generatingQr = false;
      }
    });
  }

  printQr(): void {
    if (!this.article.qrImageBase64) {
      this.toast.warning('AUTO.QR_CODE_NON_DISPONIBLE');
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
