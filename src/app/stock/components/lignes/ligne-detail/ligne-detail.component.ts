import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { LigneConditionnementService } from '../../../services/ligne-conditionnement.service';
import { LigneConditionnement, Statue } from '../../../models/ligne-conditionnement.model';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-ligne-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    DatePipe
  ],
  templateUrl: './ligne-detail.component.html',
  styleUrls: ['./ligne-detail.component.scss']
})
export class LigneDetailComponent implements OnInit {
  ligne = signal<LigneConditionnement | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ligneService: LigneConditionnementService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadLigne(id);
    } else {
      this.goBack();
    }
  }

  loadLigne(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.ligneService.getLigneById(id).subscribe({
      next: (data) => {
        this.ligne.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement detail', err);
        this.error.set('Impossible de charger les détails de la ligne');
        this.loading.set(false);
        this.toast.error('Erreur lors du chargement des données');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/stock/lignes']);
  }

  getEtatLabel(etat?: Statue): string {
    if (!etat) return '-';
    const labels: Record<string, string> = {
      [Statue.ACTIF]: 'Actif',
      [Statue.INACTIF]: 'Inactif',
      [Statue.EN_MAINTENANCE]: 'Maintenance',
      [Statue.EN_PANNE]: 'Panne'
    };
    return labels[etat] || etat;
  }

  getEtatClass(etat?: Statue): string {
    if (!etat) return 'bg-gray-100 text-gray-700';
    const classes: Record<string, string> = {
      [Statue.ACTIF]: 'bg-green-100 text-green-700 border-green-200',
      [Statue.INACTIF]: 'bg-gray-100 text-gray-700 border-gray-200',
      [Statue.EN_MAINTENANCE]: 'bg-amber-100 text-amber-700 border-amber-200',
      [Statue.EN_PANNE]: 'bg-red-100 text-red-700 border-red-200'
    };
    return classes[etat] || 'bg-gray-100 text-gray-700';
  }

  isMaintenanceDue(): boolean {
    const date = this.ligne()?.dateProchaineMaintenance;
    if (!date) return false;
    return new Date(date.toString()) < new Date();
  }
}
