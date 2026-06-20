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
import { DocumentGenerationService } from '../../../../shared/services/document-generation.service';
import { TraceabilityTimelineComponent } from '../../../../shared/components/traceability-timeline/traceability-timeline.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-projet-traceability',
  standalone: true,
  imports: [
    TranslateModule,
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projetService: ProjetService,
    private expeditionService: ExpeditionService,
    private toast: ToastService,
    private documentGenerationService: DocumentGenerationService
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id');
    if (!this.projectId) {
      this.toast.error('AUTO.ID_PROJET_MANQUANT');
      this.router.navigate(['/projets']);
      return;
    }

    this.loadData();
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
        this.toast.error('AUTO.IMPOSSIBLE_DE_CHARGER_LE_PROJET');
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
        this.toast.error('AUTO.IMPOSSIBLE_DE_CHARGER_LA_TRACABILITE_EN_DIRECT');
        this.loading = false;
      }
    });
  }

  generatePDF(): void {
    if (!this.projectId) {
      return;
    }
    this.documentGenerationService.downloadProjectTraceabilityPdf(this.projectId);
  }

  onBack(): void {
    if (this.projectId) {
      this.router.navigate(['/projets/detail', this.projectId]);
      return;
    }
    this.router.navigate(['/projets']);
  }
}
