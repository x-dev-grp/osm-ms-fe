import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrdreFabrication, StatutOF } from "../../../models/of.model";
import { OFService } from "../../../services/OFService";
import { LigneOF } from "../../../models/LigneOF";

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
    private ofService: OFService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/of']);
      return;
    }
    this.loadOF(id);
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  loadOF(id: string): void {
    this.ofService.getById(id).subscribe({
      next: (data) => {
        this.of = data;
        this.loading = false;
        if (this.of.statut === StatutOF.EN_COURS) {
          this.startTimer();
        } else {
          this.stopTimer();
        }
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.router.navigate(['/of']);
      }
    });
  }

  generateQr(): void {
    if (this.generatingQr || !this.of?.id) return;
    this.generatingQr = true;
    this.ofService.generateQr(this.of.id).subscribe({
      next: (qrInfo) => {
        this.of = {
          ...this.of,
          publicCode: qrInfo.publicCode,
          qrUrl: qrInfo.qrUrl,
          qrImageBase64: qrInfo.qrImageBase64
        };
        this.generatingQr = false;
      },
      error: (err) => {
        console.error(err);
        alert('Erreur lors de la génération du QR');
        this.generatingQr = false;
      }
    });
  }

  /**
   * Ouvre une fenêtre d'impression avec le QR code et le code manuel.
   */
  printQr(): void {
    if (!this.of.qrImageBase64) {
      alert('QR non disponible');
      return;
    }

    const printContent = `
      <div style="text-align: center; padding: 20px; font-family: sans-serif;">
        <h2>Ordre de Fabrication ${this.of.code}</h2>
        <img src="data:image/png;base64,${this.of.qrImageBase64}"
             style="width: 200px; height: 200px; margin: 20px 0;" />
        <p style="font-size: 16px;">Code manuel : <strong>${this.of.publicCode}</strong></p>
        <p style="margin-top: 20px; font-size: 12px; color: gray;">Scannez le QR code ou saisissez le code manuel</p>
      </div>
    `;

    const printWindow = window.open('', '_blank', 'width=600,height=600');
    printWindow?.document.write(`
      <html>
        <head>
          <title>QR Code - OF ${this.of.code}</title>
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

  isEditable(): boolean {
    return [StatutOF.EN_COURS, StatutOF.EN_PAUSE].includes(this.of.statut);
  }

  canStart(): boolean {
    return [StatutOF.BROUILLON, StatutOF.PLANIFIE, StatutOF.EN_PAUSE].includes(this.of.statut);
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
      },
      error: (err) => alert('Erreur clôture')
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
    this.ofService.ajusterConsommation(this.of.id!, [ajustement]).subscribe({
      next: (updated) => this.of = updated,
      error: (err) => alert('Erreur ajustement')
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
}
