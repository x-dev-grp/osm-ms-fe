import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrdreFabrication, StatutOF } from '../../../models/of.model';
import { OFService } from '../../../services/OFService';
import { LigneOF } from '../../../models/LigneOF';
import { ToastService } from '../../../../shared/services/toast.service';
import { StockService } from '../../../../stock/services/stock.service';
import { Stock } from '../../../../stock/models/stock.model';
import { catchError, forkJoin, map, of } from 'rxjs';
import { BomService } from '../../../../stock/services/BomService';
import { MaterialNeedLine } from '../../../../shared/models/material-need-line.model';

@Component({
  selector: 'app-of-production',
  standalone: true,
  imports: [TranslateModule, CommonModule, RouterLink, FormsModule],
  templateUrl: './of-production.component.html',
  styleUrls: ['./of-production.component.scss']
})
export class OFProductionComponent implements OnInit, OnDestroy {
  private readonly i18n = inject(TranslateService);
  of!: OrdreFabrication;
  loading = true;
  newBons = 0;
  newNC = 0;
  motifNC = '';
  time = 0;
  TimeFormatted = '00:00:00';
  private timerInterval: any;
  checkingStock = false;
  stockRows: StockCheckRow[] = [];
  stockIssueMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ofService: OFService,
    private toast: ToastService,
    private stockService: StockService,
    private bomService: BomService
  ) {}

  ngOnInit(): void {
    const ofId = this.route.snapshot.queryParamMap.get('ofId');
    if (!ofId) {
      this.router.navigate(['/of']);
      return;
    }
    this.loadOF(ofId);
  }

  loadOF(id: string): void {
    this.ofService.getById(id).subscribe({
      next: (data) => {
        this.of = data;
        this.loading = false;
        this.refreshStockCheck();
        if (this.of.statut === StatutOF.EN_COURS) {
          this.startTimer();
        }
      },
      error: (err) => {
        console.error(err);
        this.router.navigate(['/of']);
      }
    });
  }

  isEditable(): boolean {
    return this.of ? [StatutOF.EN_COURS, StatutOF.EN_PAUSE].includes(this.of.statut) : false;
  }

  canStart(): boolean {
    return this.of ? [StatutOF.PLANIFIE].includes(this.of.statut) : false;
  }

  canPause(): boolean {
    return this.of?.statut === StatutOF.EN_COURS;
  }

  canResume(): boolean {
    return this.of?.statut === StatutOF.EN_PAUSE;
  }

  canClose(): boolean {
    return this.of ? [StatutOF.EN_COURS, StatutOF.EN_PAUSE].includes(this.of.statut) : false;
  }

  isProjectMode(): boolean {
    return !!this.of?.projectId;
  }

  stockCheckLabel(): string {
    return this.isProjectMode() ? 'stock reserve du projet' : 'stock disponible';
  }

  stockCloseLabel(): string {
    return this.isProjectMode() ? 'la reservation du projet' : 'le stock disponible';
  }

  stockAdjustmentHint(): string {
    return this.isProjectMode()
      ? 'Les ajustements restent provisoires pendant la production. La reservation du projet sera consommee seulement a la cloture.'
      : 'Les ajustements restent provisoires pendant la production. Le stock sera deduit seulement a la cloture.';
  }

  refreshStockCheck(): void {
    if (!this.canStart()) {
      this.stockRows = [];
      this.stockIssueMessage = '';
      return;
    }

    this.checkingStock = true;
    this.stockIssueMessage = '';

    if (this.of?.bomId && Number(this.of?.quantiteCible || 0) > 0) {
      this.bomService.getMaterialNeeds(this.of.bomId, Number(this.of.quantiteCible)).subscribe({
        next: (lines) => {
          this.stockRows = lines.map((line) => this.buildStockRowFromMaterialNeed(line));
          this.checkingStock = false;
        },
        error: (err) => {
          this.stockRows = [];
          this.checkingStock = false;
          this.stockIssueMessage = err?.error?.error || err?.error?.message || 'Impossible de verifier le stock';
        }
      });
      return;
    }

    if (!this.of?.lignes?.length) {
      this.stockRows = [];
      this.checkingStock = false;
      return;
    }

    const calls = this.of.lignes.map((line) =>
      this.stockService.getStockByArticle(line.articleId).pipe(
        map((stock) => this.buildStockRow(line, stock)),
        catchError(() => of(this.buildStockRow(line, null)))
      )
    );

    forkJoin(calls).subscribe({
      next: (rows) => {
        this.stockRows = rows;
        this.checkingStock = false;
      },
      error: () => {
        this.stockRows = [];
        this.checkingStock = false;
      }
    });
  }

  hasStockIssues(): boolean {
    return this.stockRows.some((row) => row.status !== 'OK');
  }

  canStartNow(): boolean {
    return this.canStart() && !this.checkingStock && this.stockRows.length > 0 && !this.hasStockIssues();
  }

  stockQuantityHeader(): string {
    return this.isProjectMode() ? 'Stock reserve' : 'Stock disponible';
  }

  private buildStockRowFromMaterialNeed(line: MaterialNeedLine): StockCheckRow {
    const required = Number(line.quantityNeededRounded || 0);
    const available = this.isProjectMode() ? Number(line.quantiteReservee || 0) : Number(line.quantiteDisponible || 0);

    return {
      articleId: line.articleId,
      articleName: line.articleName || line.articleId,
      required,
      available,
      exists: true,
      sourceLabel: this.isProjectMode() ? 'Reserve projet' : 'Disponible',
      status: available >= required ? 'OK' : 'INSUFFICIENT'
    };
  }

  private buildStockRow(line: LigneOF, stock: Stock | null): StockCheckRow {
    const required = Number(line.quantiteTheorique || 0);
    const available = this.isProjectMode() ? Number(stock?.quantiteReservee || 0) : Number(stock?.quantiteDisponible || 0);

    if (!stock) {
      return {
        articleId: line.articleId,
        articleName: line.articleNom || line.articleId,
        required,
        available: 0,
        exists: false,
        sourceLabel: 'Non cree',
        status: 'MISSING'
      };
    }

    return {
      articleId: line.articleId,
      articleName: line.articleNom || line.articleId,
      required,
      available,
      exists: true,
      sourceLabel: this.isProjectMode() ? 'Reserve projet' : 'Disponible',
      status: available >= required ? 'OK' : 'INSUFFICIENT'
    };
  }

  start(): void {
    if (!this.canStartNow()) {
      this.stockIssueMessage = 'Stock non valide pour demarrer. Verifiez les lignes en rouge avant de continuer.';
      this.toast.error(this.stockIssueMessage);
      return;
    }

    if (!confirm(`Demarrer la production ? Le systeme verifiera ${this.stockCheckLabel()} avant ouverture.`)) {
      return;
    }
    this.ofService.demarrer(this.of.id!).subscribe({
      next: (updated) => {
        this.of = updated;
        this.startTimer();
        this.toast.success('AUTO.PRODUCTION_DEMARREE');
      },
      error: (err) => {
        const msg = err.error?.error || err.error?.message || err.message || 'Erreur au demarrage';
        this.toast.error(msg);
        this.stockIssueMessage = msg;
        this.refreshStockCheck();
      }
    });
  }

  pause(): void {
    if (!confirm(this.i18n.instant('AUTO.METTRE_EN_PAUSE'))) {
      return;
    }
    this.ofService.pause(this.of.id!).subscribe({
      next: (updated) => {
        this.of = updated;
        this.stopTimer();
        this.toast.success('AUTO.PRODUCTION_MISE_EN_PAUSE');
      },
      error: () => this.toast.error('AUTO.ERREUR_PAUSE')
    });
  }

  resume(): void {
    if (!confirm(this.i18n.instant('AUTO.REPRENDRE_LA_PRODUCTION'))) {
      return;
    }
    this.ofService.reprendre(this.of.id!).subscribe({
      next: (updated) => {
        this.of = updated;
        this.startTimer();
        this.toast.success('AUTO.PRODUCTION_REPRISE');
      },
      error: () => this.toast.error('AUTO.ERREUR_REPRISE')
    });
  }

  close(): void {
    if (!confirm(`Cloturer l'OF ? Cette action est definitive et consommera ${this.stockCloseLabel()}.`)) {
      return;
    }
    this.ofService.cloturer(this.of.id!).subscribe({
      next: (updated) => {
        this.of = updated;
        this.stopTimer();
        this.toast.success('AUTO.OF_CLOTURE_AVEC_SUCCES');
      },
      error: (err) => {
        const errorMessage = err.error?.error || err.message || this.i18n.instant('AUTO.ERREUR_LORS_DE_LA_CLOTURE');
        console.error('Erreur cloture:', errorMessage);
        this.toast.error(errorMessage);
      }
    });
  }

  recordProduction(): void {
    if (this.newBons < 0 || this.newNC < 0) {
      alert(this.i18n.instant('AUTO.LES_QUANTITES_NE_PEUVENT_PAS_ETRE_NEGATIVES'));
      return;
    }
    if (this.newBons === 0 && this.newNC === 0) {
      alert(this.i18n.instant('AUTO.VEUILLEZ_SAISIR_UNE_QUANTITE_POSITIVE'));
      return;
    }
    if (this.newNC > 0 && (!this.motifNC || this.motifNC.trim() === '')) {
      alert(this.i18n.instant('AUTO.LE_MOTIF_EST_OBLIGATOIRE_POUR_LES_PRODUITS_NON_CONFORMES_NC'));
      return;
    }

    const payload = {
      quantiteBonne: this.newBons,
      quantiteNC: this.newNC,
      motifNC: this.newNC > 0 ? this.motifNC : null
    };

    this.ofService.saisirProduction(this.of.id!, payload).subscribe({
      next: (updated) => {
        this.of = updated;
        this.newBons = 0;
        this.newNC = 0;
        this.motifNC = '';
        this.toast.success('AUTO.PRODUCTION_ENREGISTREE');
        if (updated.statut === StatutOF.CLOTURE) {
          this.stopTimer();
          this.toast.info('AUTO.PRODUCTION_TERMINEE_OF_CLOTURE_AUTOMATIQUEMENT');
        }
      },
      error: (err) => {
        const msg = err.error?.error || err.message || 'Erreur enregistrement';
        this.toast.error(msg);
      }
    });
  }

  saveAdjustment(line: LigneOF): void {
    const ajustement = {
      articleId: line.articleId,
      quantiteReelle: line.quantiteReelle,
      motif: line.motifAjustement
    };
    this.ofService.ajusterConsommation(this.of.id!, ajustement).subscribe({
      next: (updated) => {
        this.of = updated;
        this.toast.success('AUTO.AJUSTEMENT_ENREGISTRE_AVEC_SUCCES');
      },
      error: (err) => {
        console.error(err);
        const msg = err.error?.error || err.message || 'Erreur lors de l ajustement';
        this.toast.error(msg);
      }
    });
  }

  goToQualityControl(): void {
    this.router.navigate(['/of/qualite/points'], {
      queryParams: { ofId: this.of.id, ofCode: this.of.code }
    });
  }

  goToQualityEntry(): void {
    this.router.navigate(['/of/qualite/entry'], {
      queryParams: { ofId: this.of.id }
    });
  }

  goToQualityHistory(): void {
    this.router.navigate(['/of/qualite/history'], {
      queryParams: { ofId: this.of.id }
    });
  }

  private startTimer(): void {
    if (!this.of?.dateDebutReelle) {
      return;
    }
    const start = new Date(this.of.dateDebutReelle).getTime();

    const update = () => {
      const now = Date.now();
      const diffSeconds = Math.floor((now - start) / 1000);
      if (diffSeconds >= 0) {
        this.time = diffSeconds;
        this.TimeFormatted = this.formatTime(diffSeconds);
      }
    };
    update();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.timerInterval = setInterval(update, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private formatTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
  }

  private pad(num: number): string {
    return num.toString().padStart(2, '0');
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}

interface StockCheckRow {
  articleId: string;
  articleName: string;
  required: number;
  available: number;
  exists: boolean;
  sourceLabel: string;
  status: 'OK' | 'INSUFFICIENT' | 'MISSING';
}
