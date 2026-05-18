import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrdreFabrication, StatutOF } from "../../../models/of.model";
import { OFService } from "../../../services/OFService";
import { LigneOF } from "../../../models/LigneOF";
import { ToastService } from "../../../../shared/services/toast.service";

@Component({
  selector: 'app-of-production',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './of-production.component.html',
  styleUrls: ['./of-production.component.scss']
})
export class OFProductionComponent implements OnInit, OnDestroy {
  of!: OrdreFabrication;
  loading = true;
  newBons = 0;
  newNC = 0;
  motifNC: string = '';
  time = 0;
  TimeFormatted = '00:00:00';
  private timerInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ofService: OFService,
    private toast: ToastService
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
    return [StatutOF.EN_COURS, StatutOF.EN_PAUSE].includes(this.of.statut);
  }

  canStart(): boolean {
    return [StatutOF.PLANIFIE].includes(this.of.statut);
  }

  canPause(): boolean {
    return this.of.statut === StatutOF.EN_COURS;
  }

  canResume(): boolean {
    return this.of.statut === StatutOF.EN_PAUSE;
  }

  canClose(): boolean {
    return [StatutOF.EN_COURS, StatutOF.EN_PAUSE].includes(this.of.statut);
  }

  start(): void {
    if (!confirm('Démarrer la production ?')) return;
    this.ofService.demarrer(this.of.id!).subscribe({
      next: (updated) => {
        this.of = updated;
        this.startTimer();
        this.toast.success('Production démarrée');
      },
      error: () => this.toast.error('Erreur au démarrage')
    });
  }

  pause(): void {
    if (!confirm('Mettre en pause ?')) return;
    this.ofService.pause(this.of.id!).subscribe({
      next: (updated) => {
        this.of = updated;
        this.stopTimer();
        this.toast.success('Production mise en pause');
      },
      error: () => this.toast.error('Erreur pause')
    });
  }

  resume(): void {
    if (!confirm('Reprendre la production ?')) return;
    this.ofService.reprendre(this.of.id!).subscribe({
      next: (updated) => {
        this.of = updated;
        this.startTimer();
        this.toast.success('Production reprise');
      },
      error: () => this.toast.error('Erreur reprise')
    });
  }

  close(): void {
    if (!confirm('Clôturer l\'OF ? Cette action est définitive.')) return;
    this.ofService.cloturer(this.of.id!).subscribe({
      next: (updated) => {
        this.of = updated;
        this.stopTimer();
        this.toast.success('OF clôturé avec succès');
      },
      error: (err) => {
        let errorMessage = 'Erreur lors de la clôture';
        if (err.error?.error) errorMessage = err.error.error;
        else if (err.message) errorMessage = err.message;
        console.error('Erreur clôture:', errorMessage);
        this.toast.error(errorMessage);
      }
    });
  }

  recordProduction(): void {
    if (this.newBons <= 0 && this.newNC <= 0) {
      alert('Veuillez saisir une quantité positive');
      return;
    }
    if (this.newNC > 0 && (!this.motifNC || this.motifNC.trim() === '')) {
      alert('Le motif est obligatoire pour les produits non conformes (NC)');
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
        this.toast.success('Production enregistrée');
        if (updated.statut === StatutOF.CLOTURE) {
          this.stopTimer();
          this.toast.info('Production terminée, OF clôturé automatiquement');
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
        this.toast.success('Ajustement enregistré avec succès');
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Erreur lors de l\'ajustement');
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
    if (!this.of?.dateDebutReelle) return;
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
    if (this.timerInterval) clearInterval(this.timerInterval);
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
