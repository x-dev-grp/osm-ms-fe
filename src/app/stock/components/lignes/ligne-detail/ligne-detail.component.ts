import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LigneConditionnementService } from '../../../services/ligne-conditionnement.service';
import { LigneConditionnement, Statue } from '../../../models/ligne-conditionnement.model';

@Component({
  selector: 'app-ligne-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ligne-detail.component.html',
  styleUrls: ['./ligne-detail.component.scss']
})
export class LigneDetailComponent implements OnInit {
  ligne: LigneConditionnement | null = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ligneService: LigneConditionnementService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadLigne(id);
    }
  }

  loadLigne(id: string): void {
    this.loading = true;
    this.ligneService.getLigneById(id).subscribe({
      next: (data) => {
        this.ligne = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement', err);
        this.error = 'Impossible de charger la ligne';
        this.loading = false;
      }
    });
  }

  getEtatBadge(etat: Statue): string {
    const badges = {
      [Statue.ACTIF]: 'badge-success',
      [Statue.INACTIF]: 'badge-secondary',
      [Statue.EN_MAINTENANCE]: 'badge-warning',
      [Statue.EN_PANNE]: 'badge-danger'
    };
    return badges[etat] || 'badge-secondary';
  }

  getEtatLabel(etat: Statue): string {
    const labels = {
      [Statue.ACTIF]: 'Actif',
      [Statue.INACTIF]: 'Inactif',
      [Statue.EN_MAINTENANCE]: 'En maintenance',
      [Statue.EN_PANNE]: 'En panne'
    };
    return labels[etat] || etat;
  }

  goBack(): void {
    this.router.navigate(['/stock/lignes']);
  }
}
