import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LigneConditionnementService } from '../../../services/ligne-conditionnement.service';
import { LigneConditionnement, Statue } from '../../../models/ligne-conditionnement.model';

@Component({
  selector: 'app-ligne-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './ligne-list.component.html',
  styleUrls: ['./ligne-list.component.scss']
})
export class LigneListComponent implements OnInit {
  lignes: LigneConditionnement[] = [];
  filteredLignes: LigneConditionnement[] = [];
  togglingId: string | null = null;
  loading = false;
  error: string | null = null;
  searchTerm: string = '';
  etatFilter: string = '';


  constructor(
    private ligneService: LigneConditionnementService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.loadLignes();
  }

  loadLignes(): void {
    this.loading = true;
    this.ligneService.getAllLignes().subscribe({
      next: (data) => {
        this.lignes = data;
        this.sortLignes(); // <-- nouvelle ligne
        this.filterLignes();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement', err);
        this.error = 'Impossible de charger les lignes';
        this.loading = false;
      }
    });
  }
  toActif(ligne: LigneConditionnement): void {
    if (!ligne.id) return;

    const isActif = ligne.actif === true;
    const action = isActif ? 'désactiver' : 'activer';
    const message = `Voulez-vous vraiment ${action} la ligne "${ligne.nom}" ?`;

    if (confirm(message)) {
      this.togglingId = ligne.id;

      const serviceCall = isActif
        ? this.ligneService.desactiverLigne(ligne.id)
        : this.ligneService.activerLigne(ligne.id);

      serviceCall.subscribe({
        next: () => {
          ligne.actif = !isActif;
          // Re-trier pour conserver l'ordre (optionnel)
          this.sortLignes();
          this.filterLignes();
          this.togglingId = null;
        },
        error: (err) => {
          console.error('Erreur changement statut:', err);
          alert('Erreur lors du changement de statut');
          this.togglingId = null;
        }
      });
    }
  }
  private sortLignes(): void {
    this.lignes.sort((a, b) => {
      // 1. Les actifs avant les inactifs
      if (a.actif !== b.actif) {
        return a.actif ? -1 : 1;
      }
      // 2. Dans chaque groupe, tri par date décroissante (plus récent en premier)
      const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
      const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
      return dateB - dateA;
    });
  }


  filterLignes(): void {
    let filtered = [...this.lignes];
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(l =>
        l.code.toLowerCase().includes(term) ||
        l.nom.toLowerCase().includes(term) ||
        (l.responsable && l.responsable.toLowerCase().includes(term))
      );
    }
    if (this.etatFilter) {
      filtered = filtered.filter(l => l.etat === this.etatFilter);
    }

    this.filteredLignes = filtered;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.etatFilter = '';
    this.filterLignes();
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
      [Statue.EN_MAINTENANCE]: 'Maintenance',
      [Statue.EN_PANNE]: 'Panne'
    };
    return labels[etat] || etat;
  }
}
