import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FournisseurService } from '../../../services/fournisseur.service';
import { Fournisseur, CategorieFournisseur } from '../../../models/fournisseur.model';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-fournisseur-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './fournisseur-list.component.html',
  styleUrls: ['./fournisseur-list.component.scss']
})
export class FournisseurListComponent implements OnInit {
  fournisseurs: Fournisseur[] = [];
  filteredFournisseurs: Fournisseur[] = [];
  categories = Object.values(CategorieFournisseur);
  loading = false;

  searchQuery = '';
  private searchSubject = new Subject<string>();

  filters = {
    categorie: '',
    pays: '',
    actif: ''
  };

  constructor(private fournisseurService: FournisseurService) {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  ngOnInit(): void {
    this.loadFournisseurs();
  }

  loadFournisseurs(): void {
    this.loading = true;
    this.fournisseurService.getAllFournisseurs().subscribe({
      next: (data) => {
        this.fournisseurs = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement fournisseurs:', error);
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.searchSubject.next(this.searchQuery);
  }

  applyFilters(): void {
    this.filteredFournisseurs = this.fournisseurs.filter(f => {
      let match: false | boolean | undefined = true; // Correction du type

      if (this.searchQuery) {
        const term = this.searchQuery.toLowerCase();
        match = match && (
          f.nom?.toLowerCase().includes(term) ||
          f.email?.toLowerCase().includes(term) ||
          f.code?.toLowerCase().includes(term)
        );
      }

      if (this.filters.categorie) {
        match = match && f.categorieFournisseur === this.filters.categorie;
      }

      if (this.filters.pays) {
        match = match && f.pays?.toLowerCase().includes(this.filters.pays.toLowerCase());
      }

      if (this.filters.actif !== '') {
        const actif = this.filters.actif === 'true';
        match = match && f.actif === actif;
      }

      return match;
    });
  }

  resetFilters(): void {
    this.filters = {
      categorie: '',
      pays: '',
      actif: ''
    };
    this.searchQuery = '';
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.categorie || this.filters.pays || this.filters.actif || this.searchQuery);
  }

  toActif(fournisseur: Fournisseur): void {
    const action = fournisseur.actif ? 'desactiver' : 'activer';
    if (confirm(`Voulez-vous ${action} le fournisseur "${fournisseur.nom}" ?`)) {
      const serviceCall = fournisseur.actif
        ? this.fournisseurService.desactiverFournisseur(fournisseur.id!)
        : this.fournisseurService.activerFournisseur(fournisseur.id!);

      serviceCall.subscribe({
        next: (updated) => {
          const index = this.fournisseurs.findIndex(f => f.id === updated.id);
          if (index !== -1) {
            this.fournisseurs[index] = updated;
            this.applyFilters();
          }
        },
        error: (error) => {
          console.error('Erreur changement statut:', error);
          alert('Erreur lors du changement de statut');
        }
      });
    }
  }

  getCategorieBadgeClass(categorie?: CategorieFournisseur): string {
    const classes: { [key in CategorieFournisseur]?: string } = {
      [CategorieFournisseur.MATIERES_PREMIERES]: 'bg-primary',
      [CategorieFournisseur.EMBALLAGES]: 'bg-success',
      [CategorieFournisseur.PRODUITS_FINIS]: 'bg-info',
      [CategorieFournisseur.ETIQUETTES]: 'bg-warning text-dark',
      [CategorieFournisseur.BOUCHONS]: 'bg-secondary',
      [CategorieFournisseur.CAPSULES]: 'bg-danger',
      [CategorieFournisseur.OPERCULES]: 'bg-dark',
      [CategorieFournisseur.FILMS]: 'bg-primary',
      [CategorieFournisseur.CARTONS]: 'bg-success',
      [CategorieFournisseur.PALETTES]: 'bg-info',
      [CategorieFournisseur.SERVICES]: 'bg-warning text-dark',
      [CategorieFournisseur.TRANSPORT]: 'bg-secondary',
      [CategorieFournisseur.AUTRE]: 'bg-light text-dark'
    };
    return categorie ? classes[categorie] || 'bg-light text-dark' : 'bg-light text-dark';
  }
}
