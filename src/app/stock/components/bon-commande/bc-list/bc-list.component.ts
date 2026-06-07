import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BonCommandeService } from '../../../services/bon-commande.service';
import { BonCommande, StatutBonCommande } from '../../../models/bon-commande.model';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { ApiResponse } from "../../../../shared/models/api-response";
import { extractHttpErrorMessage } from "../../../../shared/utils/http-error.util";

@Component({
  selector: 'app-bc-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, NgClass, RouterLink],
  templateUrl: './bc-list.component.html',
  styleUrls: ['./bc-list.component.scss']
})
export class BcListComponent implements OnInit, OnDestroy {

  bons: BonCommande[] = [];
  filteredBons: BonCommande[] = [];
  loading = false;
  error: string | null = null;
  searchTerm = '';
  statutFilter: StatutBonCommande | '' = '';
  statuts = Object.values(StatutBonCommande);
  activeDropdown: string | null = null;
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 25, 50];
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private bonCommandeService: BonCommandeService,
    private router: Router
  ) {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
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
        try {
          if (response.success && response.data) {
            this.bons = response.data
              .map(bon => {
                let fournisseurNom = 'Non spécifié';
                if (bon.lignes?.length) {
                  const article = bon.lignes[0]?.article;
                  if (article?.fournisseur?.nom) {
                    fournisseurNom = article.fournisseur.nom;
                  }
                }
                return { ...bon, fournisseurNom };
              })
              .sort((a, b) =>
                new Date(b.createdDate || '').getTime() - new Date(a.createdDate || '').getTime()
              );

            this.applyFilters();
          } else {
            this.error = response.message || 'Erreur chargement';
          }
        } catch (err) {
          console.error('Erreur traitement des données', err);
          this.error = 'Erreur de traitement des données';
        } finally {
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Erreur serveur', err);
        this.error = 'Erreur serveur';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.bons];

    if (this.statutFilter) {
      filtered = filtered.filter(b => b.status === this.statutFilter);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(b =>
        b.numeroBC?.toLowerCase().includes(term)
      );
    }

    this.filteredBons = filtered;
    this.currentPage = 1;
  }

  get pagedBons(): BonCommande[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredBons.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredBons.length / this.pageSize));
  }

  get paginationStart(): number {
    return this.filteredBons.length ? (this.currentPage - 1) * this.pageSize + 1 : 0;
  }

  get paginationEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredBons.length);
  }

  onPageSizeChange(size: number): void {
    this.pageSize = Number(size);
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    this.currentPage = Math.min(Math.max(page, 1), this.totalPages);
  }

  onSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onStatutChange(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.statutFilter = '';
    this.applyFilters();
  }

  viewBon(id?: string): void {
    if (id) {
      this.router.navigate(['/stock/bons-commande', id]);
    }
  }

  toggleDropdown(id: string): void {
    this.activeDropdown = this.activeDropdown === id ? null : id;
  }

  validerBon(id: string): void {
    if (!confirm('Valider ce bon de commande ?')) return;

    this.bonCommandeService.validerBonCommande(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadBons();
          this.activeDropdown = null;
        } else {
          this.error = response.message || 'Erreur lors de la validation';
        }
      },
      error: (err) => {
        this.error = extractHttpErrorMessage(err, 'Erreur serveur lors de la validation');
      }
    });
  }

  refuserBon(id: string): void {
    const motif = prompt('Motif de refus :');
    if (!motif) return;

    this.bonCommandeService.refuserBonCommande(id, motif).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadBons();
          this.activeDropdown = null;
        } else {
          this.error = response.message || 'Erreur lors du refus';
        }
      },
      error: (err) => {
        this.error = extractHttpErrorMessage(err, 'Erreur serveur lors du refus');
      }
    });
  }

  getStatutLabel(status: StatutBonCommande): string {
    const labels: { [key in StatutBonCommande]: string } = {
      [StatutBonCommande.EN_ATTENTE]: 'En attente',
      [StatutBonCommande.VALIDE]: 'Validé',
      [StatutBonCommande.RECU]: 'Reçu',
      [StatutBonCommande.PARTIELLEMENT_RECU]: 'Partiellement reçu',
      [StatutBonCommande.REFUSE]: 'Refusé'
    };
    return labels[status] || status;
  }

  getStatusClass(status: StatutBonCommande): string {
    const classes: { [key in StatutBonCommande]: string } = {
      [StatutBonCommande.EN_ATTENTE]: 'status-en-attente',
      [StatutBonCommande.VALIDE]: 'status-valide',
      [StatutBonCommande.RECU]: 'status-recu',
      [StatutBonCommande.PARTIELLEMENT_RECU]: 'status-partiel',
      [StatutBonCommande.REFUSE]: 'status-refuse'
    };
    return classes[status] || '';
  }

  getNombreArticles(bon: BonCommande): number {
    return bon.lignes?.length || 0;
  }

  getQuantiteTotale(bon: BonCommande): number {
    return bon.lignes?.reduce((sum, l) => sum + (l.quantiteCommandee || 0), 0) || 0;
  }

  getTotalPrixBon(bon: BonCommande): number {
    return bon.lignes?.reduce((sum, l) =>
      sum + (l.quantiteCommandee * (l.prixUnitaire || 0)), 0) || 0;
  }
}
