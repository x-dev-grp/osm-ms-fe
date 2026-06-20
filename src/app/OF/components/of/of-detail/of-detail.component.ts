import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrdreFabrication, StatutOF } from '../../../models/of.model';
import { OFService } from '../../../services/OFService';
import { ToastService } from '../../../../shared/services/toast.service';
import { ProductionGenealogy, ProductionRootSource } from '../../../../shared/models/production-genealogy.model';
import { ProductionTraceabilityService } from '../../../../shared/services/production-traceability.service';

@Component({
  selector: 'app-of-detail',
  standalone: true,
  imports: [TranslateModule, CommonModule, RouterLink, FormsModule],
  templateUrl: './of-detail.component.html',
  styleUrls: ['./of-detail.component.scss']
})
export class OFDetailComponent implements OnInit, OnDestroy {
  private readonly i18n = inject(TranslateService);
  of!: OrdreFabrication;
  loading = true;
  time = 0;
  TimeFormatted = '00:00:00';
  private timerInterval: any;
  generatingQr = false;
  genealogy: ProductionGenealogy | null = null;
  genealogyLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ofService: OFService,
    private toast: ToastService,
    private productionTraceabilityService: ProductionTraceabilityService
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
        this.loadGenealogy();
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

  private loadGenealogy(): void {
    const anchorId = this.of?.traceabilityLotId || this.of?.lotVracId;
    if (!anchorId) {
      this.genealogy = null;
      return;
    }

    this.genealogyLoading = true;
    this.productionTraceabilityService.getGenealogy(anchorId).subscribe({
      next: (data) => {
        this.genealogy = data;
        this.genealogyLoading = false;
      },
      error: () => {
        this.genealogy = null;
        this.genealogyLoading = false;
      }
    });
  }

  get traceabilityAnchor(): string {
    return this.of?.traceabilityLotId || this.of?.lotVracId || '-';
  }

  get hasGenealogy(): boolean {
    return !!this.genealogy && (!!this.genealogy.rootSources?.length || !!this.genealogy.filtrations?.length);
  }

  get primaryRootSource(): ProductionRootSource | null {
    return this.genealogy?.rootSources?.[0] || null;
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
        alert(this.i18n.instant('AUTO.ERREUR_LORS_DE_LA_GENERATION_DU_QR'));
        this.generatingQr = false;
      }
    });
  }

  printQr(): void {
    if (!this.of.qrImageBase64) {
      alert(this.i18n.instant('AUTO.QR_NON_DISPONIBLE'));
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
