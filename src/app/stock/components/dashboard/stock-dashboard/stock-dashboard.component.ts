import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef
} from '@angular/core';
import { StatistiqueService } from '../../../services/statistique.service';
import { BonCommandeService } from '../../../services/bon-commande.service';
import { CommonModule, DatePipe, DecimalPipe, NgClass, KeyValuePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import Chart from 'chart.js/auto';
import { catchError, of } from 'rxjs';
import { ApiResponse } from '../../../../shared/models/api-response';
import { BonCommande, StatutBonCommande } from '../../../models/bon-commande.model';
import { StatistiquesStock } from '../../../models/statistiques.model';
import { ArticleCritique, MouvementRecent } from '../../../models/stock-dashboard-payload.model';

@Component({
  selector: 'app-stock-dashboard',
  templateUrl: './stock-dashboard.component.html',
  imports: [CommonModule, DatePipe, DecimalPipe, RouterLink, NgClass, KeyValuePipe],
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
  loadError: string | null = null;

  private chart: Chart | null = null;

  constructor(
    private statistiqueService: StatistiqueService,
    private bonCommandeService: BonCommandeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.loadError = null;

    this.statistiqueService.getDashboardPayload(10).subscribe({
      next: (payload) => {
        this.stats = payload.statistiques;
        this.articlesCritiques = payload.articlesCritiques ?? [];
        this.mouvementsRecents = payload.mouvementsRecents ?? [];
        this.computeDerivedStats();
        this.loadBonsEnAttente();
      },
      error: (err) => {
        console.error('Dashboard payload failed', err);
        this.loadError =
          'Impossible de joindre le service statistiques. Vérifiez que le service inventaire (osm-pack) est démarré.';
        this.stats = null;
        this.articlesCritiques = [];
        this.mouvementsRecents = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadBonsEnAttente(): void {
    this.bonCommandeService.getAllBonsCommande().subscribe({
      next: (response: ApiResponse<BonCommande>) => {
        this.bonsEnAttente = this.extractPendingBons(response);
        if (this.stats) {
          this.stats = { ...this.stats, bonsEnAttente: this.bonsEnAttente.length };
        }
        this.finishLoading();
      },
      error: () => {
        this.bonsEnAttente = [];
        this.finishLoading();
      }
    });
  }

  private finishLoading(): void {
    this.loading = false;
    this.cdr.detectChanges();
    setTimeout(() => this.initChartFromStats(), 0);
  }

  private extractPendingBons(response: ApiResponse<BonCommande> | null): BonCommande[] {
    if (!response?.success || !response.data) {
      return [];
    }
    return response.data
      .filter((bon) => bon.status === StatutBonCommande.EN_ATTENTE)
      .slice(0, 5);
  }

  private computeDerivedStats(): void {
    const total = Number(this.stats?.totalArticles ?? 0);
    const alerte = Number(this.stats?.articlesEnAlerte ?? 0);
    const tauxRupture = Number(this.stats?.tauxRupture ?? 0);

    this.pourcentageAlerte = total > 0 ? Math.round((alerte / total) * 100) : 0;
    this.articlesRupture = total > 0 ? Math.round((tauxRupture / 100) * total) : 0;
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

  exportData(): void {
    console.log('Export des données…');
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
    if (!min || min <= 0) return 0;
    return Math.min((act / min) * 100, 100);
  }

  getReceptionProgress(bon: BonCommande): number {
    if (!bon?.lignes || bon.lignes.length === 0) return 0;
    const totalCommandee = bon.lignes.reduce((sum, l) => sum + Number(l.quantiteCommandee || 0), 0);
    const totalRecue = bon.lignes.reduce((sum, l) => sum + Number(l.quantiteRecue || 0), 0);
    return totalCommandee > 0 ? Math.round((totalRecue / totalCommandee) * 100) : 0;
  }

  commanderArticle(article: ArticleCritique): void {
    alert(`Création d'un bon de commande pour ${article?.nom}`);
  }

  verifierSeuils(): void {
    this.loadDashboardData();
  }

  movementArticleSku(mvt: MouvementRecent): string {
    return mvt.articleSku || mvt.articleId || '—';
  }

  movementArticleName(mvt: MouvementRecent): string {
    return mvt.articleNom || '—';
  }

  movementUnit(mvt: MouvementRecent): string {
    return mvt.uniteMesure || '';
  }
}
