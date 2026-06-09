import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { EmplacementStock, TypeEmplacement } from '../../../models/emplacement-stock.model';
import { EmplacementStockService } from '../../../services/emplacement-stock.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { extractHttpErrorMessage } from '../../../../shared/utils/http-error.util';
import { sortRowsByCreatedDate, TableSortDirection, toggleSortDirection } from '../../../../shared/utils/table-sort.util';

@Component({
  selector: 'app-emplacement-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './emplacement-list.component.html',
  styleUrls: ['./emplacement-list.component.scss']
})
export class EmplacementListComponent implements OnInit {
  emplacements: EmplacementStock[] = [];
  filteredEmplacements: EmplacementStock[] = [];

  loading = false;
  error: string | null = null;
  searchTerm = '';
  searchCode = '';
  searchCodeError: string | null = null;
  searchingByCode = false;
  typeFilter = '';
  zoneFilter = '';
  disponibiliteFilter = '';
  showFilters = true;
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 25, 50];
  sortDirection: TableSortDirection = 'desc';

  togglingId: string | null = null;
  deletingId: string | null = null;

  typesEmplacement = Object.values(TypeEmplacement);
  zones: string[] = [];

  constructor(
    private emplacementService: EmplacementStockService,
    private toast: ToastService,
    public router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  get hasActiveFilters(): boolean {
    return Boolean(this.searchTerm || this.typeFilter || this.zoneFilter || this.disponibiliteFilter);
  }

  get activeCount(): number {
    return this.filteredEmplacements.filter((emplacement) => emplacement.actif).length;
  }

  get availableCount(): number {
    return this.filteredEmplacements.filter((emplacement) => emplacement.disponible).length;
  }

  get reservedCount(): number {
    return this.filteredEmplacements.filter((emplacement) => !emplacement.disponible && Boolean(emplacement.reservePour)).length;
  }

  get inactiveCount(): number {
    return this.filteredEmplacements.filter((emplacement) => !emplacement.actif).length;
  }

  get visibleZoneCount(): number {
    const set = new Set(
      this.filteredEmplacements
        .map((emplacement) => emplacement.zone)
        .filter((zone): zone is string => Boolean(zone))
    );

    return set.size;
  }

  get pagedEmplacements(): EmplacementStock[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredEmplacements.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredEmplacements.length / this.pageSize));
  }

  get paginationStart(): number {
    return this.filteredEmplacements.length ? (this.currentPage - 1) * this.pageSize + 1 : 0;
  }

  get paginationEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredEmplacements.length);
  }

  ngOnInit(): void {
    this.loadEmplacements();
  }

  loadEmplacements(): void {
    this.loading = true;
    this.error = null;

    this.emplacementService.getAllEmplacements().subscribe({
      next: (response) => {
        const data = (response.data || []).flat();

        this.emplacements = data ?? [];

        this.extractZones();
        this.filterEmplacements();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement', err);
        this.error = 'Impossible de charger les emplacements';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  extractZones(): void {
    const zonesSet = new Set(this.emplacements.map((emplacement) => emplacement.zone).filter((zone) => zone));
    this.zones = Array.from(zonesSet) as string[];
  }

  filterEmplacements(): void {
    let filtered = [...this.emplacements];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter((emplacement) =>
        emplacement.code.toLowerCase().includes(term) ||
        (emplacement.nom && emplacement.nom.toLowerCase().includes(term)) ||
        (emplacement.zone && emplacement.zone.toLowerCase().includes(term)) ||
        (emplacement.reservePour && emplacement.reservePour.toLowerCase().includes(term))
      );
    }

    if (this.typeFilter) {
      filtered = filtered.filter((emplacement) => emplacement.typeEmplacement === this.typeFilter);
    }

    if (this.zoneFilter) {
      filtered = filtered.filter((emplacement) => emplacement.zone === this.zoneFilter);
    }

    if (this.disponibiliteFilter) {
      if (this.disponibiliteFilter === 'disponible') {
        filtered = filtered.filter((emplacement) => emplacement.disponible);
      } else if (this.disponibiliteFilter === 'reserve') {
        filtered = filtered.filter((emplacement) => !emplacement.disponible && emplacement.reservePour);
      } else if (this.disponibiliteFilter === 'occupe') {
        filtered = filtered.filter((emplacement) => !emplacement.disponible && !emplacement.reservePour);
      }
    }

    this.filteredEmplacements = sortRowsByCreatedDate(filtered, this.sortDirection);
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  toggleCreatedDateSort(): void {
    this.sortDirection = toggleSortDirection(this.sortDirection);
    this.filterEmplacements();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = Number(size);
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    this.currentPage = Math.min(Math.max(page, 1), this.totalPages);
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.typeFilter = '';
    this.zoneFilter = '';
    this.disponibiliteFilter = '';
    this.filterEmplacements();
  }

  searchByPublicCode(): void {
    const code = this.searchCode.trim().toUpperCase();
    if (!code || this.searchingByCode) {
      return;
    }

    this.searchCode = code;
    this.searchCodeError = null;
    this.searchingByCode = true;

    this.emplacementService.searchByCode(code).subscribe({
      next: (response) => {
        this.searchingByCode = false;
        const targetRoute = this.resolveTargetRoute(response?.webRoute, response?.entityId);
        if (targetRoute) {
          this.router.navigateByUrl(targetRoute);
          return;
        }

        this.searchCodeError = `Aucun emplacement trouvé pour le code ${code}`;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur recherche code public', err);
        this.searchingByCode = false;
        this.searchCodeError =
          err?.error?.error ||
          err?.error ||
          `Aucun emplacement trouvé pour le code ${code}`;
        this.cdr.detectChanges();
      }
    });
  }

  toActif(emplacement: EmplacementStock, event: Event): void {
    event.stopPropagation();

    if (!emplacement.id || this.togglingId || this.deletingId) {
      return;
    }

    const isActif = emplacement.actif;
    const action = isActif ? 'desactiver' : 'activer';
    const message = `Voulez-vous vraiment ${action} l'emplacement "${emplacement.code}" ?`;

    if (!confirm(message)) {
      return;
    }

    this.togglingId = emplacement.id;
    this.error = null;

    const serviceCall = isActif
      ? this.emplacementService.desactiverEmplacement(emplacement.id)
      : this.emplacementService.activerEmplacement(emplacement.id);

    serviceCall.subscribe({
      next: () => {
        emplacement.actif = !isActif;
        this.sortEmplacements();
        this.filterEmplacements();
        this.toast.success(`Emplacement ${isActif ? 'desactive' : 'active'} avec succes`);
        this.togglingId = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(`Erreur lors de la ${action}`, err);
        this.error = extractHttpErrorMessage(err, `Erreur lors de l'${action} de l'emplacement`);
        this.togglingId = null;
        this.cdr.detectChanges();
      }
    });
  }

  deleteEmplacement(emplacement: EmplacementStock, event: Event): void {
    event.stopPropagation();

    if (!emplacement.id || this.togglingId || this.deletingId) {
      return;
    }

    if (!confirm(`Voulez-vous vraiment supprimer l'emplacement "${emplacement.code}" ?`)) {
      return;
    }

    this.deletingId = emplacement.id;
    this.error = null;

    this.emplacementService.deleteEmplacement(emplacement.id).subscribe({
      next: () => {
        this.emplacements = this.emplacements.filter((item) => item.id !== emplacement.id);
        this.extractZones();
        this.filterEmplacements();
        this.toast.success('Emplacement supprime avec succes');
        this.deletingId = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression de l\'emplacement', err);
        this.error = extractHttpErrorMessage(err, 'Impossible de supprimer cet emplacement');
        this.deletingId = null;
        this.cdr.detectChanges();
      }
    });
  }

  private sortEmplacements(): void {
    this.emplacements = sortRowsByCreatedDate(this.emplacements, this.sortDirection);
  }

  getTypeLabel(type: TypeEmplacement | string): string {
    const labels = {
      [TypeEmplacement.CHAMBRE_FROIDE]: 'Chambre froide',
      [TypeEmplacement.CONGELATEUR]: 'Congelateur',
      [TypeEmplacement.ZONE_DANGEREUSE]: 'Zone dangereuse',
      [TypeEmplacement.ZONE_SECURISEE]: 'Zone securisee',
      [TypeEmplacement.QUAI_RECEPTION]: 'Quai reception',
      [TypeEmplacement.QUAI_EXPEDITION]: 'Quai expedition',
      [TypeEmplacement.ZONE_CONTROLE]: 'Zone controle',
      [TypeEmplacement.ZONE_RECONDITIONNEMENT]: 'Zone reconditionnement'
    };

    return labels[type as TypeEmplacement] || type;
  }

  getTypeIcon(type: TypeEmplacement | string): string {
    const icons = {
      [TypeEmplacement.CHAMBRE_FROIDE]: 'fa-snowflake',
      [TypeEmplacement.CONGELATEUR]: 'fa-temperature-low',
      [TypeEmplacement.ZONE_DANGEREUSE]: 'fa-exclamation-triangle',
      [TypeEmplacement.ZONE_SECURISEE]: 'fa-shield-alt',
      [TypeEmplacement.QUAI_RECEPTION]: 'fa-truck-loading',
      [TypeEmplacement.QUAI_EXPEDITION]: 'fa-truck',
      [TypeEmplacement.ZONE_CONTROLE]: 'fa-clipboard-check',
      [TypeEmplacement.ZONE_RECONDITIONNEMENT]: 'fa-boxes'
    };

    return icons[type as TypeEmplacement] || 'fa-map-marker-alt';
  }

  getTypeColor(type: TypeEmplacement | string): string {
    const colors = {
      [TypeEmplacement.CHAMBRE_FROIDE]: 'info',
      [TypeEmplacement.CONGELATEUR]: 'primary',
      [TypeEmplacement.ZONE_DANGEREUSE]: 'danger',
      [TypeEmplacement.ZONE_SECURISEE]: 'success',
      [TypeEmplacement.QUAI_RECEPTION]: 'warning',
      [TypeEmplacement.QUAI_EXPEDITION]: 'warning',
      [TypeEmplacement.ZONE_CONTROLE]: 'secondary',
      [TypeEmplacement.ZONE_RECONDITIONNEMENT]: 'purple'
    };

    return colors[type as TypeEmplacement] || 'secondary';
  }

  getDisponibiliteBadge(disponible: boolean, reservePour?: string): string {
    if (disponible) {
      return 'status-disponible';
    }

    if (reservePour) {
      return 'status-reserve';
    }

    return 'status-indisponible';
  }

  getDisponibiliteLabel(disponible: boolean, reservePour?: string): string {
    if (disponible) {
      return 'Disponible';
    }

    if (reservePour) {
      return `Reserve pour ${reservePour}`;
    }

    return 'Occupe';
  }

  getCapacitePercentage(capaciteActuelle?: string, capaciteMax?: string): number {
    if (!capaciteActuelle || !capaciteMax) {
      return 0;
    }

    const actuelle = parseFloat(capaciteActuelle.replace(',', '.'));
    const max = parseFloat(capaciteMax.replace(',', '.'));

    if (Number.isNaN(actuelle) || Number.isNaN(max) || max === 0) {
      return 0;
    }

    return Math.min(100, (actuelle / max) * 100);
  }

  trackByEmplacement(index: number, emplacement: EmplacementStock): string {
    return emplacement.id || `${emplacement.code}-${index}`;
  }

  private resolveTargetRoute(webRoute?: string, entityId?: string): string | null {
    const route = webRoute?.trim();
    if (route) {
      return route.startsWith('/') ? route : `/${route}`;
    }

    if (entityId) {
      return `/stock/emplacements/${entityId}`;
    }

    return null;
  }
}
