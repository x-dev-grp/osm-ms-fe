import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrdreFabrication, StatutOF } from "../../../models/of.model";
import { OFService } from "../../../services/OFService";
import { ToastService } from "../../../../shared/services/toast.service";

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




  goToProduction(): void {
    this.router.navigate(['/of/production'], {
      queryParams: { ofId: this.of.id, ofCode: this.of.code }
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


}
