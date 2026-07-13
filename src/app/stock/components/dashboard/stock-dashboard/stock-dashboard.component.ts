import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import Chart from 'chart.js/auto';

import { StatistiqueService } from '../../../services/statistique.service';
import { BonCommandeService } from '../../../services/bon-commande.service';
import { BonCommande, StatutBonCommande } from '../../../models/bon-commande.model';
import { StatistiquesStock } from '../../../models/statistiques.model';
import { ArticleCritique, MouvementRecent } from '../../../models/stock-dashboard-payload.model';
import { ToastService } from '../../../../shared/services/toast.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DashboardShellComponent } from '../../../../shared/components/dashboard/dashboard-shell.component';
import { createKpiSheet, DashboardExportPayload } from '../../../../shared/components/dashboard/dashboard-export.models';

interface DashboardLoadOptions {
  notifyThresholdCheck?: boolean;
  preserveContent?: boolean;
}

@Component({
  selector: 'app-stock-dashboard',
  standalone: true,
  templateUrl: './stock-dashboard.component.html',
  imports: [
    TranslateModule,
    CommonModule,
    DatePipe,
    DecimalPipe,
    RouterLink,
    NgClass,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DashboardShellComponent
  ],
  styleUrls: ['./stock-dashboard.component.scss']
})
export class StockDashboardComponent implements OnInit, OnDestroy {
  @ViewChild('stockChartCanvas') chartCanvas?: ElementRef<HTMLCanvasElement>;

  stats: StatistiquesStock | null = null;
  pourcentageAlerte = 0;
  articlesRupture = 0;

  bonsEnAttente: BonCommande[] = [];
  articlesCritiques: ArticleCritique[] = [];
  mouvementsRecents: MouvementRecent[] = [];

  loading = true;
  refreshingThresholds = false;
  loadError: string | null = null;
  lastUpdated: Date | null = null;

  private chart: Chart | null = null;

  constructor(
    private statistiqueService: StatistiqueService,
    private bonCommandeService: BonCommandeService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,
    private translate: TranslateService
  ) {}

  get exportPayload(): DashboardExportPayload | null {
    if (!this.stats) {
      return null;
    }

    return {
      fileName: 'stock-dashboard',
      title: this.translate.instant('AUTO.TABLEAU_DE_BORD_STOCK'),
      sheets: [
        createKpiSheet(this.translate.instant('AUTO.APERCU_GENERAL_DES_STOCKS_ET_ALERTES'), [
          { label: this.translate.instant('AUTO.TOTAL_STOCK'), value: this.stats.valeurTotaleStock },
          { label: 'Articles actifs', value: this.stats.totalArticles },
          { label: this.translate.instant('AUTO.ARTICLES_EN_ALERTE'), value: this.stats.articlesEnAlerte },
          { label: 'Taux de rupture', value: `${Number(this.stats.tauxRupture ?? 0).toFixed(1)}%` },
          { label: 'Bons en attente', value: this.stats.bonsEnAttente },
          { label: 'Délai moyen de validation (h)', value: this.stats.delaiValidationMoyen }
        ]),
        {
          name: 'Articles critiques',
          columns: [
            { key: 'sku', label: 'SKU' },
            { key: 'nom', label: 'Nom' },
            { key: 'stockActuel', label: 'Stock actuel' },
            { key: 'stockMinimum', label: 'Stock minimum' },
            { key: 'stockDisponible', label: 'Stock disponible' },
            { key: 'categorie', label: 'Catégorie' }
          ],
          rows: this.articlesCritiques.map((article) => ({
            sku: article.sku,
            nom: article.nom,
            stockActuel: article.stockActuel,
            stockMinimum: article.stockMinimum,
            stockDisponible: article.stockDisponible,
            categorie: article.categorie
          }))
        },
        {
          name: 'Mouvements récents',
          columns: [
            { key: 'sku', label: 'SKU' },
            { key: 'article', label: 'Article' },
            { key: 'type', label: 'Type' },
            { key: 'quantite', label: 'Quantité' },
            { key: 'unite', label: 'Unité' },
            { key: 'date', label: 'Date' }
          ],
          rows: this.mouvementsRecents.map((mvt) => ({
            sku: this.movementArticleSku(mvt),
            article: this.movementArticleName(mvt),
            type: mvt.typeMouvement,
            quantite: mvt.quantite,
            unite: this.movementUnit(mvt),
            date: this.formatExportDate(mvt.dateMouvement)
          }))
        },
        {
          name: 'Bons en attente',
          columns: [
            { key: 'numero', label: 'Numéro' },
            { key: 'statut', label: 'Statut' },
            { key: 'fournisseur', label: 'Fournisseur' },
            { key: 'date', label: 'Date' },
            { key: 'progression', label: 'Progression' }
          ],
          rows: this.bonsEnAttente.map((bon) => ({
            numero: bon.numeroBC,
            statut: bon.status,
            fournisseur: bon.materielSupplierName || 'Non spécifié',
            date: this.formatExportDate(bon.createdDate),
            progression: `${this.getReceptionProgress(bon)}%`
          }))
        }
      ].filter((sheet) => sheet.rows.length > 0)
    };
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  refresh(): void {
    this.loadDashboardData();
  }

  loadDashboardData(options: DashboardLoadOptions = {}): void {
    const preserveContent = !!options.preserveContent && !!this.stats;

    this.loading = !preserveContent;
    this.refreshingThresholds = preserveContent;
    this.loadError = null;

    this.statistiqueService.getDashboardPayload(10).subscribe({
      next: (payload) => {
        this.stats = payload.statistiques;
        this.articlesCritiques = payload.articlesCritiques ?? [];
        this.mouvementsRecents = payload.mouvementsRecents ?? [];
        this.computeDerivedStats();
        this.loadBonsEnAttente(options);
      },
      error: (err) => {
        console.error('Dashboard payload failed', err);
        this.loadError = 'Impossible de joindre le service statistiques. Vérifiez que le service inventaire (osm-pack) est démarré.';

        if (!preserveContent) {
          this.stats = null;
          this.articlesCritiques = [];
          this.mouvementsRecents = [];
        }

        this.finishLoading(options, false);
      }
    });
  }

  private loadBonsEnAttente(options: DashboardLoadOptions): void {
    this.bonCommandeService.getAllBonsCommande().subscribe({
      next: (bons) => {
        this.bonsEnAttente = this.extractPendingBons(bons);
        if (this.stats) {
          this.stats = { ...this.stats, bonsEnAttente: this.bonsEnAttente.length };
        }
        this.finishLoading(options, true);
      },
      error: () => {
        this.bonsEnAttente = [];
        this.finishLoading(options, true);
      }
    });
  }

  private finishLoading(options: DashboardLoadOptions, thresholdCheckSucceeded: boolean): void {
    this.loading = false;
    this.refreshingThresholds = false;
    if (thresholdCheckSucceeded && this.stats) {
      this.lastUpdated = new Date();
    }
    this.cdr.detectChanges();

    if (options.notifyThresholdCheck) {
      if (thresholdCheckSucceeded && this.stats) {
        this.showThresholdCheckResult();
      } else {
        this.toastService.error('Impossible de vérifier les seuils pour le moment.');
      }
    }

    if (this.stats) {
      setTimeout(() => this.initChartFromStats(), 0);
    }
  }

  private extractPendingBons(bons: BonCommande[] | null): BonCommande[] {
    if (!bons) {
      return [];
    }

    return bons.filter((bon) => bon.status === StatutBonCommande.EN_ATTENTE).slice(0, 5);
  }

  private computeDerivedStats(): void {
    const total = Number(this.stats?.totalArticles ?? 0);
    const alerte = Number(this.stats?.articlesEnAlerte ?? 0);
    const tauxRupture = Number(this.stats?.tauxRupture ?? 0);

    this.pourcentageAlerte = total > 0 ? Math.round((alerte / total) * 100) : 0;
    this.articlesRupture = total > 0 ? Math.round((tauxRupture / 100) * total) : 0;
  }

  private showThresholdCheckResult(): void {
    const alertCount = Math.max(Number(this.stats?.articlesEnAlerte ?? 0), this.articlesCritiques.length);

    if (alertCount > 0) {
      this.toastService.warning(
        `${alertCount} article${alertCount > 1 ? 's' : ''} sous seuil critique détecté${alertCount > 1 ? 's' : ''}.`
      );
      return;
    }

    this.toastService.success('Aucun article sous seuil critique.');
  }

  chartHasData(): boolean {
    const map = this.stats?.mouvementsParMois;
    return !!map && Object.keys(map).length > 0;
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  private initChartFromStats(): void {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas || !this.chartHasData()) {
      return;
    }

    const mouvementsParMois = this.stats?.mouvementsParMois ?? {};
    const labels = Object.keys(mouvementsParMois);
    const values = Object.values(mouvementsParMois);

    this.destroyChart();

    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Mouvements',
            data: values,
            tension: 0.35,
            fill: true,
            borderColor: '#4361ee',
            backgroundColor: 'rgba(67, 97, 238, 0.12)',
            pointBackgroundColor: '#4361ee'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  getStatutClass(statut: string): string {
    const classes: Record<string, string> = {
      EN_ATTENTE: 'warning',
      VALIDE: 'success',
      REFUSE: 'danger',
      RECU: 'info',
      PARTIELLEMENT_RECU: 'info'
    };
    return classes[statut] || 'secondary';
  }

  getStockPercentage(article: ArticleCritique): number {
    const min = Number(article?.stockMinimum || 0);
    const act = Number(article?.stockActuel || 0);
    if (!min || min <= 0) {
      return 0;
    }
    return Math.min((act / min) * 100, 100);
  }

  getReceptionProgress(bon: BonCommande): number {
    if (!bon?.lignes || bon.lignes.length === 0) {
      return 0;
    }

    const totalCommandee = bon.lignes.reduce((sum, l) => sum + Number(l.quantiteCommandee || 0), 0);
    const totalRecue = bon.lignes.reduce((sum, l) => sum + Number(l.quantiteRecue || 0), 0);
    return totalCommandee > 0 ? Math.round((totalRecue / totalCommandee) * 100) : 0;
  }

  commanderArticle(article: ArticleCritique): void {
    alert(`Création d'un bon de commande pour ${article?.nom}`);
  }

  verifierSeuils(): void {
    if (this.loading || this.refreshingThresholds) {
      return;
    }

    this.loadDashboardData({
      notifyThresholdCheck: true,
      preserveContent: true
    });
  }

  movementArticleSku(mvt: MouvementRecent): string {
    return mvt.articleSku || mvt.articleId || '—';
  }

  movementArticleName(mvt: MouvementRecent): string {
    return mvt.articleNom || '—';
  }

  movementArticleLabel(mvt: MouvementRecent): string {
    return mvt.articleNom || mvt.articleSku || mvt.articleId || '—';
  }

  movementUnit(mvt: MouvementRecent): string {
    return mvt.uniteMesure || '';
  }

  private buildExportContent(): string {
    const rows: string[][] = [
      ['Section', 'Clé', 'Valeur'],
      ['Indicateurs', 'Total stock', this.formatExportNumber(this.stats?.valeurTotaleStock)],
      ['Indicateurs', 'Articles actifs', this.formatExportNumber(this.stats?.totalArticles)],
      ['Indicateurs', 'Articles en alerte', this.formatExportNumber(this.stats?.articlesEnAlerte)],
      ['Indicateurs', 'Taux de rupture', `${Number(this.stats?.tauxRupture ?? 0).toFixed(1)}%`],
      ['Indicateurs', 'Bons en attente', this.formatExportNumber(this.stats?.bonsEnAttente)],
      ['Indicateurs', 'Délai moyen de validation (h)', this.formatExportNumber(this.stats?.delaiValidationMoyen)],
      [],
      ['Articles critiques', 'SKU', 'Nom', 'Stock actuel', 'Stock minimum', 'Stock disponible', 'Catégorie'],
      ...this.buildCriticalArticleRows(),
      [],
      ['Mouvements récents', 'SKU', 'Article', 'Type', 'Quantité', 'Unité', 'Date'],
      ...this.buildRecentMovementRows(),
      [],
      ['Bons de commande en attente', 'Numéro', 'Statut', 'Fournisseur', 'Date', 'Progression'],
      ...this.buildPendingOrderRows()
    ];

    return `\uFEFF${rows.map((row) => row.map((cell) => this.escapeCsvCell(cell)).join(';')).join('\n')}`;
  }

  private buildCriticalArticleRows(): string[][] {
    if (this.articlesCritiques.length === 0) {
      return [['', 'Aucun article critique', '', '', '', '', '']];
    }

    return this.articlesCritiques.map((article) => [
      '',
      article.sku || '',
      article.nom || '',
      this.formatExportNumber(article.stockActuel),
      this.formatExportNumber(article.stockMinimum),
      this.formatExportNumber(article.stockDisponible),
      article.categorie || ''
    ]);
  }

  private buildRecentMovementRows(): string[][] {
    if (this.mouvementsRecents.length === 0) {
      return [['', 'Aucun mouvement récent', '', '', '', '', '']];
    }

    return this.mouvementsRecents.map((mvt) => [
      '',
      this.movementArticleSku(mvt),
      this.movementArticleName(mvt),
      mvt.typeMouvement || '',
      this.formatExportNumber(mvt.quantite),
      this.movementUnit(mvt),
      this.formatExportDate(mvt.dateMouvement)
    ]);
  }

  private buildPendingOrderRows(): string[][] {
    if (this.bonsEnAttente.length === 0) {
      return [['', 'Aucun bon en attente', '', '', '', '']];
    }

    return this.bonsEnAttente.map((bon) => [
      '',
      bon.numeroBC || '',
      bon.status || '',
      bon.materielSupplierName || 'Non spécifié',
      this.formatExportDate(bon.createdDate),
      `${this.getReceptionProgress(bon)}%`
    ]);
  }

  private formatExportDate(value?: string): string {
    if (!value) {
      return '';
    }

    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? value : parsedDate.toLocaleString('fr-FR');
  }

  private formatExportNumber(value: number | string | undefined): string {
    if (value == null || value === '') {
      return '';
    }

    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? String(value) : new Intl.NumberFormat('fr-FR').format(numericValue);
  }

  private escapeCsvCell(value: unknown): string {
    const text = value == null ? '' : String(value);
    return /[;"\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  }
}
