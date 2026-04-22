import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ProjetService } from '../../../services/projet.service';
import { ProjetDto } from '../../../models/TypeProduit';

@Component({
  selector: 'app-projet-detail',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    TitleCasePipe,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './projet-detail.component.html',
  styleUrls: ['./projet-detail.component.scss']
})
export class ProjetDetailComponent implements OnInit {
  projet: ProjetDto | null = null;
  loading = false;
  projetId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projetService: ProjetService
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

        // Correction: reset loading dans le success
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement projet detail', err);
        this.loading = false;
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/projets']);
  }

  // Correction: l'impression reste simple, c'est le CSS @media print
  // qui force l'impression du QR uniquement
  onPrint(): void {
    window.print();
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

    // CAS 1: le backend renvoie deja le base64
    if (this.projet.qrImageBase64 && this.projet.qrImageBase64.trim() !== '') {
      if (!this.projet.qrImageBase64.startsWith('data:image')) {
        return 'data:image/png;base64,' + this.projet.qrImageBase64;
      }
      return this.projet.qrImageBase64;
    }

    // CAS 2: fallback vers endpoint backend
    if (this.projet.id) {
      return this.projetService.getQrImageUrl(this.projet.id);
    }

    return '';
  }

  getManualCode(): string {
    return this.projet?.code?.trim() || 'N/A';
  }
}
