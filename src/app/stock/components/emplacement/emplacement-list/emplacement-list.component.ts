import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmplacementStockService } from '../../../services/emplacement-stock.service';
import { EmplacementStock, TypeEmplacement } from '../../../models/emplacement-stock.model';

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
  searchTerm: string = '';
  typeFilter: string = '';
  zoneFilter: string = '';
  disponibiliteFilter: string = '';


  typesEmplacement = Object.values(TypeEmplacement);
  zones: string[] = [];

  constructor(
    private emplacementService: EmplacementStockService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.loadEmplacements();
  }

  loadEmplacements(): void {
    this.loading = true;
    this.emplacementService.getAllEmplacements().subscribe({
      next: (response) => {
        this.emplacements = (response.data || []).flat();
        this.extractZones();
        this.filterEmplacements();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement', err);
        this.error = 'Impossible de charger les emplacements';
        this.loading = false;
      }
    });
  }
  extractZones(): void {
    const zonesSet = new Set(this.emplacements.map(e => e.zone).filter(zone => zone));
    this.zones = Array.from(zonesSet) as string[];
  }

  filterEmplacements(): void {
    let filtered = this.emplacements;

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(e =>
        e.code.toLowerCase().includes(term) ||
        (e.nom && e.nom.toLowerCase().includes(term)) ||
        (e.zone && e.zone.toLowerCase().includes(term)) ||
        (e.reservePour && e.reservePour.toLowerCase().includes(term))
      );
    }

    if (this.typeFilter) {
      filtered = filtered.filter(e => e.typeEmplacement === this.typeFilter);
    }

    if (this.zoneFilter) {
      filtered = filtered.filter(e => e.zone === this.zoneFilter);
    }

    if (this.disponibiliteFilter) {
      if (this.disponibiliteFilter === 'disponible') {
        filtered = filtered.filter(e => e.disponible);
      } else if (this.disponibiliteFilter === 'reserve') {
        filtered = filtered.filter(e => !e.disponible && e.reservePour);
      } else if (this.disponibiliteFilter === 'occupe') {
        filtered = filtered.filter(e => !e.disponible && !e.reservePour);
      }
    }

    this.filteredEmplacements = filtered;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.typeFilter = '';
    this.zoneFilter = '';
    this.disponibiliteFilter = '';
    this.filterEmplacements();
  }
  getTypeLabel(type: TypeEmplacement): string {
    const labels = {
      [TypeEmplacement.CHAMBRE_FROIDE]: 'Chambre froide',
      [TypeEmplacement.CONGELATEUR]: 'Congélateur',
      [TypeEmplacement.ZONE_DANGEREUSE]: 'Zone dangereuse',
      [TypeEmplacement.ZONE_SECURISEE]: 'Zone sécurisée',
      [TypeEmplacement.QUAI_RECEPTION]: 'Quai réception',
      [TypeEmplacement.QUAI_EXPEDITION]: 'Quai expédition',
      [TypeEmplacement.ZONE_CONTROLE]: 'Zone contrôle',
      [TypeEmplacement.ZONE_RECONDITIONNEMENT]: 'Zone reconditionnement'
    };
    return labels[type] || type;
  }

  getTypeIcon(type: TypeEmplacement): string {
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
    return icons[type] || 'fa-map-marker-alt';
  }

  getTypeColor(type: TypeEmplacement): string {
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
    return colors[type] || 'secondary';
  }

  getDisponibiliteBadge(disponible: boolean, reservePour?: string): string {
    if (disponible) return 'badge-success';
    if (reservePour) return 'badge-warning';
    return 'badge-danger';
  }

  getDisponibiliteLabel(disponible: boolean, reservePour?: string): string {
    if (disponible) return 'Disponible';
    if (reservePour) return `Réservé pour ${reservePour}`;
    return 'Occupé';
  }

  getCapacitePercentage(capaciteActuelle?: string, capaciteMax?: string): number {
    if (!capaciteActuelle || !capaciteMax) return 0;
    const actuelle = parseFloat(capaciteActuelle);
    const max = parseFloat(capaciteMax);
    if (isNaN(actuelle) || isNaN(max) || max === 0) return 0;
    return Math.min(100, (actuelle / max) * 100);
  }
}
