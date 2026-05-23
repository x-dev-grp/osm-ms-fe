import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ProjetDto } from '../../../models/TypeProduit';
import { ProjetService } from '../../../services/projet.service';
import { ExpeditionService } from '../../../services/expedition.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { PdfGeneratorExpeditionService } from '../../../../shared/services/pdf-generator-expedition.service';
import { CompanyProfileService } from '../../../../shared/services/company-profile.service';
import { PdfExpeditionConfig } from '../../../../shared/models/pdf-config.model';
import { TraceabilityTimelineComponent } from '../../../../shared/components/traceability-timeline/traceability-timeline.component';

@Component({
  selector: 'app-projet-traceability',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TraceabilityTimelineComponent
  ],
  templateUrl: './projet-traceability.component.html',
  styleUrls: ['./projet-traceability.component.scss']
})
export class ProjetTraceabilityComponent implements OnInit {
  projectId: string | null = null;
  project: ProjetDto | null = null;
  traceabilityData: any = null;
  loading = true;
  companyProfile: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projetService: ProjetService,
    private expeditionService: ExpeditionService,
    private toast: ToastService,
    private pdfService: PdfGeneratorExpeditionService,
    private companyService: CompanyProfileService
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id');
    if (!this.projectId) {
      this.toast.error('ID Projet manquant');
      this.router.navigate(['/projets']);
      return;
    }

    this.loadData();
    this.loadCompanyProfile();
  }

  loadData(): void {
    this.loading = true;
    if (!this.projectId) return;

    this.projetService.getById(this.projectId).subscribe({
      next: (projet) => {
        this.project = projet;
        this.loadTraceability();
      },
      error: (err) => {
        console.error('Erreur chargement projet', err);
        this.toast.error('Impossible de charger le projet');
        this.loading = false;
      }
    });
  }

  loadTraceability(): void {
    if (!this.projectId) return;
    this.expeditionService.getProjectTraceability(this.projectId).subscribe({
      next: (data) => {
        this.traceabilityData = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement tracabilite', err);
        this.toast.error('Impossible de charger la traçabilité en direct');
        this.loading = false;
      }
    });
  }

  loadCompanyProfile(): void {
    this.companyService.getProfile().subscribe(profile => {
      this.companyProfile = profile;
    });
  }

  generatePDF(): void {
    if (!this.project || !this.traceabilityData) return;

    const config: PdfExpeditionConfig = {
      title: 'Rapport de Traçabilité Projet',
      reference: this.project.code || 'PROJET',
      date: new Date().toLocaleDateString(),
      clientInfo: {
        name: this.project.client.nom,
        address: ''
      },
      lines: Object.values(this.traceabilityData.ofDetails || {}).map((of: any) => ({
        ofCode: of.code || '',
        articleName: of.articleName || '',
        quantity: of.quantityGood || 0,
        unit: 'UNIT', // Fallback
        lotNumber: of.traceabilityLotId || of.lotVracId || ''
      })),
      traceability: this.traceabilityData,
      companyInfo: {
        companyName: this.companyProfile?.companyName,
        address: this.companyProfile?.address,
        logoUrl: this.companyProfile?.logoData ? `data:${this.companyProfile.logoContentType};base64,${this.companyProfile.logoData}` : undefined
      }
    };

    this.pdfService.generatePdf(config);
  }

  onBack(): void {
    if (this.projectId) {
      this.router.navigate(['/projets/detail', this.projectId]);
      return;
    }
    this.router.navigate(['/projets']);
  }
}
