import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BonCommandeService } from '../../../services/bon-commande.service';
import { BonCommande, StatutBonCommande } from '../../../models/bon-commande.model';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import {ApiResponse} from "../../../../shared/models/api-response";
import {MatTooltip} from "@angular/material/tooltip";


@Component({
  selector: 'app-bc-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, NgClass, RouterLink, MatTooltip],
  templateUrl: './bc-list.component.html',
  styleUrls: ['./bc-list.component.scss']
})
export class BcListComponent implements OnInit, OnDestroy {
  bons: BonCommande[] = [];
  filteredBons: BonCommande[] = [];

  stats = {
    total: 0,
    enAttente: 0,
    valide: 0,
    recu: 0,
    partiellementRecu: 0,
    annule: 0,
    refuse: 0,
    brouillon: 0
  };

  loading = false;
  verifyingSeuils = false;
  downloadingPdf = false;
  error: string | null = null;
  successMessage: string | null = null;
  showFilters = true;

  // Filtres
  statutFilter: StatutBonCommande | '' = '';
  statuts = Object.values(StatutBonCommande);
  searchTerm = '';
  dateDebut: string = '';
  dateFin: string = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // Unsubscribe
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Mapping des libellés de statut en français
  statutLabels: { [key in StatutBonCommande]: string } = {
    [StatutBonCommande.BROUILLON]: 'Brouillon',
    [StatutBonCommande.EN_ATTENTE]: 'En attente',
    [StatutBonCommande.VALIDE]: 'Validé',
    [StatutBonCommande.RECU]: 'Reçu',
    [StatutBonCommande.PARTIELLEMENT_RECU]: 'Partiellement reçu',
    [StatutBonCommande.ANNULE]: 'Annulé',
    [StatutBonCommande.REFUSE]: 'Refusé'
  };

  constructor(
    private bonCommandeService: BonCommandeService,
    private router: Router
  ) {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
      this.applyFilters();
    });
  }

  ngOnInit(): void {
    this.loadBons();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBons(): void {
    this.loading = true;
    this.error = null;

    this.bonCommandeService.getAllBonsCommande().subscribe({
      next: (response: ApiResponse<BonCommande>) => {
        if (response.success && response.data) {
          this.bons = response.data;
          this.calculerStats();
          this.applyFilters();
        } else {
          this.error = response.message || 'Erreur lors du chargement des bons';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement des bons', err);
        this.error = 'Impossible de charger la liste des bons de commande';
        this.loading = false;
      }
    });
  }

  calculerStats(): void {
    this.stats = {
      total: this.bons.length,
      enAttente: this.bons.filter(b => b.status === StatutBonCommande.EN_ATTENTE).length,
      valide: this.bons.filter(b => b.status === StatutBonCommande.VALIDE).length,
      recu: this.bons.filter(b => b.status === StatutBonCommande.RECU).length,
      partiellementRecu: this.bons.filter(b => b.status === StatutBonCommande.PARTIELLEMENT_RECU).length,
      annule: this.bons.filter(b => b.status === StatutBonCommande.ANNULE).length,
      refuse: this.bons.filter(b => b.status === StatutBonCommande.REFUSE).length,
      brouillon: this.bons.filter(b => b.status === StatutBonCommande.BROUILLON).length
    };
  }

  safeGetTime(date: Date | string | undefined): number | null {
    if (!date) return null;
    try {
      return new Date(date).getTime();
    } catch (e) {
      console.error('Erreur de conversion de date:', date, e);
      return null;
    }
  }

  applyFilters(): void {
    let filtered = [...this.bons];

    // Filtre par statut
    if (this.statutFilter) {
      filtered = filtered.filter(bon => bon.status === this.statutFilter);
    }

    // Filtre par recherche
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(bon =>
        bon.numeroBC.toLowerCase().includes(term) ||
        (bon.fournisseur?.toLowerCase().includes(term) || false)
      );
    }

    // Filtre par date début
    if (this.dateDebut) {
      const debut = new Date(this.dateDebut).setHours(0, 0, 0, 0);
      filtered = filtered.filter(bon => {
        // Utiliser dateCreation ou dateReceptionPrevue selon ce qui est disponible
        const dateToCompare = bon.dateReceptionPrevue || new Date();
        const dateTime = this.safeGetTime(dateToCompare);
        return dateTime !== null && dateTime >= debut;
      });
    }

    // Filtre par date fin
    if (this.dateFin) {
      const fin = new Date(this.dateFin).setHours(23, 59, 59, 999);
      filtered = filtered.filter(bon => {
        const dateToCompare = bon.dateReceptionPrevue || new Date();
        const dateTime = this.safeGetTime(dateToCompare);
        return dateTime !== null && dateTime <= fin;
      });
    }

    // Trier par date de réception prévue (plus récent d'abord)
    filtered.sort((a, b) => {
      const dateA = this.safeGetTime(a.dateReceptionPrevue) || 0;
      const dateB = this.safeGetTime(b.dateReceptionPrevue) || 0;
      return dateB - dateA;
    });

    this.totalItems = filtered.length;

    // Pagination
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.filteredBons = filtered.slice(start, end);
  }

  onSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onStatutChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onDateChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  resetFilters(): void {
    this.statutFilter = '';
    this.searchTerm = '';
    this.dateDebut = '';
    this.dateFin = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  verifierSeuils(): void {
    if (this.verifyingSeuils) return;

    this.verifyingSeuils = true;
    this.error = null;
    this.successMessage = null;

    // Simulation - à remplacer par un vrai appel API si disponible
    setTimeout(() => {
      this.verifyingSeuils = false;
      this.successMessage = 'Aucun seuil critique détecté';
      setTimeout(() => this.successMessage = null, 3000);
    }, 1500);
  }

  viewBon(id: string | undefined): void {
    if (id) {
      this.router.navigate(['/stock/bons-commande', id]);
    }
  }

  downloadPdf(id: string | undefined, event: Event): void {
    event.stopPropagation();
    if (!id || this.downloadingPdf) return;

    this.downloadingPdf = true;
    const bon = this.bons.find(b => b.id === id);

    // Simulation - à remplacer par un vrai appel API si disponible
    setTimeout(() => {
      this.downloadingPdf = false;
      this.error = 'Fonctionnalité PDF non disponible';
      setTimeout(() => this.error = null, 3000);
    }, 1000);
  }

  getStatutLabel(status: StatutBonCommande): string {
    return this.statutLabels[status] || status;
  }

  getProgressionReception(bon: BonCommande): number {
    if (!bon.lignes || bon.lignes.length === 0) {
      if (bon.status === StatutBonCommande.RECU) return 100;
      if (bon.status === StatutBonCommande.PARTIELLEMENT_RECU) return 50;
      return 0;
    }

    const totalCommandee = bon.lignes.reduce((sum, ligne) => sum + ligne.quantiteCommandee, 0);
    const totalRecue = bon.lignes.reduce((sum, ligne) => sum + (ligne.quantiteRecue || 0), 0);

    return totalCommandee > 0 ? Math.round((totalRecue / totalCommandee) * 100) : 0;
  }

  getNombreArticles(bon: BonCommande): number {
    return bon.lignes?.length || 0;
  }

  getQuantiteTotale(bon: BonCommande): number {
    return bon.lignes?.reduce((sum, ligne) => sum + ligne.quantiteCommandee, 0) || 0;
  }

  pageChanged(page: number): void {
    if (page >= 1 && page <= this.pages.length) {
      this.currentPage = page;
      this.applyFilters();
    }
  }

  get pages(): number[] {
    const pageCount = Math.ceil(this.totalItems / this.itemsPerPage);
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  getProgressColor(bon: BonCommande): string {
    const progression = this.getProgressionReception(bon);
    if (progression === 100) return '#10b981'; // success
    if (progression >= 75) return '#22c55e';
    if (progression >= 50) return '#eab308'; // warning
    if (progression >= 25) return '#f97316';
    return '#ef4444'; // danger
  }

  getStatusClass(status: StatutBonCommande): string {
    const statusMap: { [key in StatutBonCommande]: string } = {
      [StatutBonCommande.EN_ATTENTE]: 'status-EN_ATTENTE',
      [StatutBonCommande.VALIDE]: 'status-VALIDE',
      [StatutBonCommande.RECU]: 'status-RECU',
      [StatutBonCommande.PARTIELLEMENT_RECU]: 'status-PARTIELLEMENT_RECU',
      [StatutBonCommande.BROUILLON]: 'status-BROUILLON',
      [StatutBonCommande.ANNULE]: 'status-ANNULE',
      [StatutBonCommande.REFUSE]: 'status-REFUSE'
    };
    return statusMap[status] || 'status-BROUILLON';
  }

  getStatusIcon(status: StatutBonCommande): string {
    const iconMap: { [key in StatutBonCommande]: string } = {
      [StatutBonCommande.EN_ATTENTE]: 'fa-clock',
      [StatutBonCommande.VALIDE]: 'fa-check-circle',
      [StatutBonCommande.RECU]: 'fa-truck-loading',
      [StatutBonCommande.PARTIELLEMENT_RECU]: 'fa-truck',
      [StatutBonCommande.BROUILLON]: 'fa-pen',
      [StatutBonCommande.ANNULE]: 'fa-ban',
      [StatutBonCommande.REFUSE]: 'fa-times-circle'
    };
    return iconMap[status] || 'fa-circle';
  }

  hasPrix(bon: BonCommande): boolean {
    return bon.lignes?.some(l => l.prixUnitaire != null && l.prixUnitaire > 0) || false;
  }

  getTotalPrixBon(bon: BonCommande): number {
    if (!bon.lignes) return 0;
    return bon.lignes.reduce((sum, ligne) => {
      const prix = ligne.prixUnitaire || 0;
      return sum + (ligne.quantiteCommandee * prix);
    }, 0);
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }
}
