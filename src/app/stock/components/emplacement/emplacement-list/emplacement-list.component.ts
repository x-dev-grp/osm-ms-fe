import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { EmplacementStock, TypeEmplacement } from '../../../models/emplacement-stock.model';
import { EmplacementStockService } from '../../../services/emplacement-stock.service';

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
  typeFilter = '';
  zoneFilter = '';
  disponibiliteFilter = '';
  showFilters = true;

  togglingId: string | null = null;

  typesEmplacement = Object.values(TypeEmplacement);
  zones: string[] = [];

  constructor(
    private emplacementService: EmplacementStockService,
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

  ngOnInit(): void {
    this.loadEmplacements();
  }

  loadEmplacements(): void {
    this.loading = true;
    this.error = null;

    this.emplacementService.getAllEmplacements().subscribe({
      next: (response) => {
        const data = (response.data || []).flat();

        this.emplacements = data.sort((a, b) => {
          if (a.actif !== b.actif) {
            return a.actif ? -1 : 1;
          }

          const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
          const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
          return dateB - dateA;
        });

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

    this.filteredEmplacements = filtered;
    this.cdr.detectChanges();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.typeFilter = '';
    this.zoneFilter = '';
    this.disponibiliteFilter = '';
    this.filterEmplacements();
  }

  toActif(emplacement: EmplacementStock, event: Event): void {
    event.stopPropagation();

    if (!emplacement.id || this.togglingId) {
      return;
    }

    const isActif = emplacement.actif;
    const action = isActif ? 'desactiver' : 'activer';
    const message = `Voulez-vous vraiment ${action} l'emplacement "${emplacement.code}" ?`;

    if (!confirm(message)) {
      return;
    }

    this.togglingId = emplacement.id;

    const serviceCall = isActif
      ? this.emplacementService.desactiverEmplacement(emplacement.id)
      : this.emplacementService.activerEmplacement(emplacement.id);

    serviceCall.subscribe({
      next: () => {
        emplacement.actif = !isActif;
        this.sortEmplacements();
        this.filterEmplacements();
        this.togglingId = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(`Erreur lors de la ${action}`, err);
        alert(`Erreur lors de l'${action} de l'emplacement`);
        this.togglingId = null;
        this.cdr.detectChanges();
      }
    });
  }

  private sortEmplacements(): void {
    this.emplacements.sort((a, b) => {
      if (a.actif !== b.actif) {
        return a.actif ? -1 : 1;
      }

      const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
      const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
      return dateB - dateA;
    });
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
}
