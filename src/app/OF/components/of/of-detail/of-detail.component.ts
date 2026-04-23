import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrdreFabrication, StatutOF } from "../../../models/of.model";
import { OFService } from "../../../services/OFService";
import { LigneOF } from "../../../models/LigneOF";
import {ToastService} from "../../../../shared/services/toast.service";

@Component({
  selector: 'app-of-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './of-detail.component.html',
  styleUrls: ['./of-detail.component.scss']
})
export class OFDetailComponent implements OnInit, OnDestroy {
  of!: OrdreFabrication;
  loading = true;
  newBons = 0;
  newNC = 0;
  time = 0;
  TimeFormatted = '00:00:00';
  private timerInterval: any;
  generatingQr = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ofService: OFService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/of']);
      return;
    }
    this.loadOF(id);
  }



  isEditable(): boolean {
    return [StatutOF.EN_COURS, StatutOF.EN_PAUSE].includes(this.of.statut);
  }

  canStart(): boolean {
    return [ StatutOF.PLANIFIE].includes(this.of.statut);
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
      },
      error: (err) => alert('Erreur au démarrage')
    });
  }

  pause(): void {
    if (!confirm('Mettre en pause ?')) return;
    this.ofService.pause(this.of.id!).subscribe({
      next: (updated) => {
        this.of = updated;
        this.stopTimer();
      },
      error: (err) => alert('Erreur pause')
    });
  }

  resume(): void {
    if (!confirm('Reprendre la production ?')) return;
    this.ofService.reprendre(this.of.id!).subscribe({
      next: (updated) => {
        this.of = updated;
        this.startTimer();
      },
      error: (err) => alert('Erreur reprise')
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
        if (err.error?.error) {
          errorMessage = err.error.error;
        } else if (err.message) {
          errorMessage = err.message;
        }

        console.error('Erreur clôture:', errorMessage);
        if (errorMessage.includes('bloqué') || errorMessage.includes('qualité')) {
          this.toast.error(errorMessage);

        }
      }
    });
  }

  recordProduction(): void {
    if (this.newBons <= 0 && this.newNC <= 0) {
      alert('Veuillez saisir une quantité positive');
      return;
    }
    this.ofService.saisirProduction(this.of.id!, this.newBons, this.newNC).subscribe({
      next: (updated) => {
        this.of = updated;
        this.newBons = 0;
        this.newNC = 0;
      },
      error: (err) => alert('Erreur enregistrement')
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
        alert(' Ajustement enregistré avec succès');
      },
      error: (err) => {
        alert(' Erreur lors de l\'ajustement');
        console.error(err);
      }
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
  goToQualityControl(): void {
    this.router.navigate(['/of/qualite/points'], {
      queryParams: { ofId: this.of.id, ofCode: this.of.code }
    });
  }
  goToQualityHistory(): void {
    this.router.navigate(['/of/qualite/history'], {
      queryParams: { ofId: this.of.id }
    });
  }

  goToQualityEntry(): void {
    this.router.navigate(['/of/qualite/entry'], {
      queryParams: { ofId: this.of.id }
    });
  }
}
