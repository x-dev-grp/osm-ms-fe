import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 25, 50];

  searchQuery = '';
  private searchSubject = new Subject<string>();

  filters = {
    categorie: '',
    pays: '',
    actif: ''
  };

  // Pour l'activation/désactivation
  togglingId: string | null = null;

  constructor(
    private fournisseurService: FournisseurService,
    private cdr: ChangeDetectorRef
  ) {
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
        // Tri : actifs d'abord, puis par date décroissante
        this.fournisseurs = data.sort((a, b) => {
          if (a.actif !== b.actif) {
            return a.actif ? -1 : 1;
          }
          const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
          const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
          return dateB - dateA;
        });
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur chargement fournisseurs:', error);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearch(): void {
    this.searchSubject.next(this.searchQuery);
  }

  applyFilters(): void {
    this.filteredFournisseurs = this.fournisseurs.filter(f => {
      let match: false | boolean | undefined = true;

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
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  get pagedFournisseurs(): Fournisseur[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredFournisseurs.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredFournisseurs.length / this.pageSize));
  }

  get paginationStart(): number {
    return this.filteredFournisseurs.length ? (this.currentPage - 1) * this.pageSize + 1 : 0;
  }

  get paginationEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredFournisseurs.length);
  }

  onPageSizeChange(size: number): void {
    this.pageSize = Number(size);
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    this.currentPage = Math.min(Math.max(page, 1), this.totalPages);
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

  // Méthode pour activer/désactiver avec gestion de l'événement
  toActif(fournisseur: Fournisseur, event: Event): void {
    event.stopPropagation();
    if (!fournisseur.id) return;

    const action = fournisseur.actif ? 'désactiver' : 'activer';
    if (confirm(`Voulez-vous ${action} le fournisseur "${fournisseur.nom}" ?`)) {
      this.togglingId = fournisseur.id;
      const serviceCall = fournisseur.actif
        ? this.fournisseurService.desactiverFournisseur(fournisseur.id)
        : this.fournisseurService.activerFournisseur(fournisseur.id);

      serviceCall.subscribe({
        next: (updated) => {
          // Mettre à jour l'objet dans le tableau
          const index = this.fournisseurs.findIndex(f => f.id === updated.id);
          if (index !== -1) {
            this.fournisseurs[index] = updated;
          }
          // Re-trier la liste complète
          this.sortFournisseurs();
          // Réappliquer les filtres
          this.applyFilters();
          this.togglingId = null;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Erreur changement statut:', error);
          alert('Erreur lors du changement de statut');
          this.togglingId = null;
          this.cdr.detectChanges();
        }
      });
    }
  }

  private sortFournisseurs(): void {
    this.fournisseurs.sort((a, b) => {
      if (a.actif !== b.actif) {
        return a.actif ? -1 : 1;
      }
      const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
      const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
      return dateB - dateA;
    });
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

  getCategoryIcon(categorie?: CategorieFournisseur): string {
    const icons: { [key in CategorieFournisseur]?: string } = {
      [CategorieFournisseur.MATIERES_PREMIERES]: 'fas fa-oil-can',
      [CategorieFournisseur.EMBALLAGES]: 'fas fa-box',
      [CategorieFournisseur.PRODUITS_FINIS]: 'fas fa-wine-bottle',
      [CategorieFournisseur.ETIQUETTES]: 'fas fa-tag',
      [CategorieFournisseur.BOUCHONS]: 'fas fa-cork',
      [CategorieFournisseur.CAPSULES]: 'fas fa-capsules',
      [CategorieFournisseur.OPERCULES]: 'fas fa-circle',
      [CategorieFournisseur.FILMS]: 'fas fa-film',
      [CategorieFournisseur.CARTONS]: 'fas fa-box-open',
      [CategorieFournisseur.PALETTES]: 'fas fa-pallet',
      [CategorieFournisseur.SERVICES]: 'fas fa-concierge-bell',
      [CategorieFournisseur.TRANSPORT]: 'fas fa-truck',
      [CategorieFournisseur.AUTRE]: 'fas fa-building'
    };
    return categorie ? icons[categorie] || 'fas fa-truck' : 'fas fa-truck';
  }
}
