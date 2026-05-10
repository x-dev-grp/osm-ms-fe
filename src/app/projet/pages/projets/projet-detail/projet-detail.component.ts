import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ProjetService } from '../../../services/projet.service';
import { ProjetDto } from '../../../models/TypeProduit';
import { OFService } from '../../../../OF/services/OFService';
import { OrdreFabrication } from '../../../../OF/models/of.model';

@Component({
  selector: 'app-projet-detail',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    TitleCasePipe,
    MatButtonModule,
    MatIconModule,
    RouterModule
  ],
  templateUrl: './projet-detail.component.html',
  styleUrls: ['./projet-detail.component.scss']
})
export class ProjetDetailComponent implements OnInit {
  projet: ProjetDto | null = null;
  ofs: OrdreFabrication[] = [];
  loading = false;
  loadingOfs = false;
  projetId: string | null = null;
  generatingQr = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projetService: ProjetService,
    private ofService: OFService
  ) {}

  ngOnInit(): void {
    this.projetId = this.route.snapshot.paramMap.get('id');

    if (this.projetId) {
      this.loadProjet(this.projetId);
    }
  }

  private loadProjet(id: string): void {
    this.loading = true;

    this.projetService.getById(id).subscribe({
      next: (data) => {
        this.projet = data;
        this.loading = false;
        this.loadOfs(id);
      },
      error: (err) => {
        console.error('Erreur chargement projet detail', err);
        this.loading = false;
      }
    });
  }

  private loadOfs(id: string): void {
    this.loadingOfs = true;
    this.ofService.getByProject(id).subscribe({
      next: (data) => {
        // Unwraps the response if it is wrapped in an ApiResponse format, or takes it directly
        this.ofs = (data as any)?.data ? (data as any).data : data;
        this.loadingOfs = false;
      },
      error: (err) => {
        console.error('Erreur chargement OFs', err);
        this.loadingOfs = false;
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/projets']);
  }

  openExpedition(): void {
    if (!this.projetId) {
      return;
    }
    this.router.navigate(['/projets/detail', this.projetId, 'expedition']);
  }

  openTraceability(): void {
    if (!this.projetId) {
      return;
    }
    this.router.navigate(['/projets/detail', this.projetId, 'traceability']);
  }

  onAddOF(): void {
    if (!this.projetId) {
      return;
    }
    this.router.navigate(['/of/nouveau'], {
      queryParams: { projetId: this.projetId }
    });
  }

  generateQr(): void {
    if (this.generatingQr || !this.projetId) return;
    this.generatingQr = true;
    this.projetService.generateQr(this.projetId).subscribe({
      next: (qrInfo) => {
        if (this.projet) {
          this.projet = {
            ...this.projet,
            publicCode: qrInfo.publicCode,
            qrImageBase64: qrInfo.qrImageBase64
          };
        }
        this.generatingQr = false;
      },
      error: (err) => {
        console.error(err);
        alert('Erreur lors de la generation du QR');
        this.generatingQr = false;
      }
    });
  }

  printQr(): void {
    const qrImage = this.getQrImage();
    if (!qrImage) {
      alert('QR non disponible. Veuillez le generer d\'abord.');
      return;
    }

    const manualCode = this.getManualCode();
    const projectCode = this.projet?.code || 'N/A';

    const printContent = `
      <div style="text-align: center; padding: 20px; font-family: sans-serif;">
        <h2>Projet de Conditionnement ${projectCode}</h2>
        <img src="${qrImage}"
             style="width: 200px; height: 200px; margin: 20px 0;" />
        <p style="font-size: 16px;">Code manuel : <strong>${manualCode}</strong></p>
        <p style="margin-top: 20px; font-size: 12px; color: gray;">Scannez le QR code ou saisissez le code manuel dans la recherche globale</p>
      </div>
    `;

    const printWindow = window.open('', '_blank', 'width=600,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - Projet ${projectCode}</title>
            <style>
              body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `);
      printWindow.document.close();
      // Petit delai pour s'assurer que l'image est chargee avant l'impression
      setTimeout(() => {
        printWindow.print();
        // printWindow.close(); // Optionnel
      }, 500);
    }
  }

  onQrError(event: Event): void {
    console.error('Erreur chargement QR', event);

    const target = event.target as HTMLImageElement | null;
    if (target) {
      target.style.display = 'none';
    }
  }

  hasQrImage(): boolean {
    return !!this.getQrImage();
  }

  getQrImage(): string {
    if (!this.projet) {
      return '';
    }

    if (this.projet.qrImageBase64 && this.projet.qrImageBase64.trim() !== '') {
      if (!this.projet.qrImageBase64.startsWith('data:image')) {
        return 'data:image/png;base64,' + this.projet.qrImageBase64;
      }
      return this.projet.qrImageBase64;
    }

    if (this.projet.id) {
      return this.projetService.getQrImageUrl(this.projet.id);
    }

    return '';
  }

  getManualCode(): string {
    return this.projet?.publicCode || this.projet?.code || 'N/A';
  }
}
