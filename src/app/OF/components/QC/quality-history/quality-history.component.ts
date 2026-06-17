import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { ToastService } from 'src/app/shared/services/toast.service';
import { OFService } from '../../../services/OFService';
import { QCResult } from '../../../models/QCResult.model';
import { OrdreFabrication } from '../../../models/of.model';
import { QualityService } from "../../../services/QualityService";
import { QCControlPoint } from '../../../models/QCControlPoint.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-quality-history',
  standalone: true,
  imports: [TranslateModule,
    CommonModule,
    FormsModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,

  ],
  templateUrl: './quality-history.component.html',
  styleUrls: ['./quality-history.component.scss']
})
export class QualityHistoryComponent implements OnInit {
  ofs: OrdreFabrication[] = [];
  selectedOfId: string | null = null;
  history: QCResult[] = [];
  loading = false;
  pointNames: Map<string, string> = new Map();

  constructor(
    private qualityService: QualityService,
    private ofService: OFService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOFs();

    this.route.queryParams.subscribe(params => {
      const ofId = params['ofId'];
      if (ofId) {
        if (this.ofs.length > 0) {
          this.selectedOfId = ofId;
          this.loadHistory();
        } else {
          const sub = this.ofService.getAll().subscribe({
            next: (data) => {
              this.ofs = data || [];
              this.selectedOfId = ofId;
              this.loadHistory();
              sub.unsubscribe();
            },
            error: () => this.toast.error('AUTO.ERREUR_CHARGEMENT_OF')
          });
        }
      }
    });
  }

  loadOFs(): void {
    this.ofService.getAll().subscribe({
      next: (data: OrdreFabrication[]) => {
        this.ofs = data || [];
      },
      error: () => this.toast.error('AUTO.ERREUR_CHARGEMENT_OF')
    });
  }

  loadHistory(): void {
    if (!this.selectedOfId) return;

    this.loading = true;
    this.qualityService.getHistoryByOF(this.selectedOfId).subscribe({
      next: (res) => {
        if (res.success) {
          // @ts-ignore
          this.history = res.data || [];
          this.loadControlPoints(this.selectedOfId!);
        } else {
          this.toast.error(res.message || 'AUTO.ERREUR_LORS_DU_CHARGEMENT_DE_L_HISTORIQUE');
          this.loading = false;
        }
      },
      error: (err) => {
        console.error(err);
        this.toast.error('AUTO.ERREUR_RESEAU_LORS_DU_CHARGEMENT_DE_L_HISTORIQUE');
        this.loading = false;
      }
    });
  }

  loadControlPoints(ofId: string): void {
    this.qualityService.getPointsForOF(ofId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          // @ts-ignore
          const points = res.data as QCControlPoint[];
          this.pointNames.clear();
          points.forEach(point => {
            if (point.id && point.nom) {
              this.pointNames.set(point.id, point.nom);
            }
          });
        }
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.toast.error('AUTO.ERREUR_LORS_DU_CHARGEMENT_DES_NOMS_DES_POINTS');
        this.loading = false;
      }
    });
  }

  getPointName(controlPointId: string): string {
    return this.pointNames.get(controlPointId) || controlPointId;
  }





}
