import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EmplacementStockService } from '../../../services/emplacement-stock.service';
import { EmplacementStock, TypeEmplacement } from '../../../models/emplacement-stock.model';

@Component({
  selector: 'app-emplacement-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './emplacement-detail.component.html',
  styleUrls: ['./emplacement-detail.component.scss']
})
export class EmplacementDetailComponent implements OnInit {

  emplacement: EmplacementStock | null = null;
  loading: boolean = true;
  error: string = '';
  successMessage: string = '';
  actionEnCours = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private emplacementService: EmplacementStockService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadEmplacement(id);
      }
    });
  }

  loadEmplacement(id: string): void {
    this.loading = true;
    this.emplacementService.getEmplacementById(id).subscribe({
      next: (response: any) => {
        if (Array.isArray(response?.data)) {
          this.emplacement = response.data[0] ?? null;
        } else {
          this.emplacement = response?.data ?? null;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement', err);
        this.error = "Impossible de charger l'emplacement";
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/stock/emplacements']).then(() => {});
  }

  getTypeLabel(type: TypeEmplacement): string {
    const labels: Record<TypeEmplacement, string> = {
      [TypeEmplacement.CHAMBRE_FROIDE]: 'Chambre froide',
      [TypeEmplacement.CONGELATEUR]: 'Congélateur',
      [TypeEmplacement.ZONE_DANGEREUSE]: 'Zone dangereuse',
      [TypeEmplacement.ZONE_SECURISEE]: 'Zone sécurisée',
      [TypeEmplacement.QUAI_RECEPTION]: 'Quai réception',
      [TypeEmplacement.QUAI_EXPEDITION]: 'Quai expédition',
      [TypeEmplacement.ZONE_CONTROLE]: 'Zone contrôle',
      [TypeEmplacement.ZONE_RECONDITIONNEMENT]: 'Zone reconditionnement'
    };
    return labels[type] ?? type;
  }

  getTypeIcon(type: TypeEmplacement): string {
    const icons: Record<TypeEmplacement, string> = {
      [TypeEmplacement.CHAMBRE_FROIDE]: 'fa-snowflake',
      [TypeEmplacement.CONGELATEUR]: 'fa-temperature-low',
      [TypeEmplacement.ZONE_DANGEREUSE]: 'fa-exclamation-triangle',
      [TypeEmplacement.ZONE_SECURISEE]: 'fa-shield-alt',
      [TypeEmplacement.QUAI_RECEPTION]: 'fa-truck-loading',
      [TypeEmplacement.QUAI_EXPEDITION]: 'fa-truck',
      [TypeEmplacement.ZONE_CONTROLE]: 'fa-clipboard-check',
      [TypeEmplacement.ZONE_RECONDITIONNEMENT]: 'fa-boxes'
    };
    return icons[type] ?? 'fa-map-marker-alt';
  }

  getTypeColor(type: TypeEmplacement): string {
    const colors: Record<TypeEmplacement, string> = {
      [TypeEmplacement.CHAMBRE_FROIDE]: 'info',
      [TypeEmplacement.CONGELATEUR]: 'primary',
      [TypeEmplacement.ZONE_DANGEREUSE]: 'danger',
      [TypeEmplacement.ZONE_SECURISEE]: 'success',
      [TypeEmplacement.QUAI_RECEPTION]: 'warning',
      [TypeEmplacement.QUAI_EXPEDITION]: 'warning',
      [TypeEmplacement.ZONE_CONTROLE]: 'secondary',
      [TypeEmplacement.ZONE_RECONDITIONNEMENT]: 'purple'
    };
    return colors[type] ?? 'secondary';
  }

  getDisponibiliteBadge(): string {
    if (!this.emplacement) return 'badge-secondary';
    if (this.emplacement.disponible) return 'badge-success';
    if (this.emplacement.reservePour) return 'badge-warning';
    return 'badge-danger';
  }

  getDisponibiliteLabel(): string {
    if (!this.emplacement) return '';
    if (this.emplacement.disponible) return 'Disponible';
    if (this.emplacement.reservePour) {
      return `Réservé pour ${this.emplacement.reservePour}`;
    }
    return 'Occupé';
  }

  getCapacitePercentage(): number {
    if (!this.emplacement) return 0;

    const actuelle = parseFloat(this.emplacement.capaciteActuelle ?? '0');
    const max = parseFloat(this.emplacement.capaciteMaximale ?? '0');

    if (isNaN(actuelle) || isNaN(max) || max === 0) return 0;

    return Math.min(100, (actuelle / max) * 100);
  }

  hasTemperature(): boolean {
    if (!this.emplacement) return false;
    return !!(this.emplacement.temperatureMin || this.emplacement.temperatureMax);
  }

  reserverEmplacement(): void {
    if (!this.emplacement?.id) return;

    const client = prompt('Nom du client ou destination :');

    if (client) {
      this.emplacementService.reserverEmplacement(this.emplacement.id, client).subscribe({
        next: (response: any) => {
          if (Array.isArray(response?.data)) {
            this.emplacement = response.data[0] ?? null;
          } else {
            this.emplacement = response?.data ?? null;
          }
          this.successMessage = 'Emplacement réservé avec succès';
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (err) => {
          console.error('Erreur réservation', err);
          alert('Erreur lors de la réservation');
        }
      });
    }
  }

  libererEmplacement(): void {
    if (!this.emplacement?.id) return;

    if (confirm(`Libérer l'emplacement "${this.emplacement.code}" ?`)) {
      this.emplacementService.libererEmplacement(this.emplacement.id).subscribe({
        next: (response: any) => {
          if (Array.isArray(response?.data)) {
            this.emplacement = response.data[0] ?? null;
          } else {
            this.emplacement = response?.data ?? null;
          }
          this.successMessage = 'Emplacement libéré avec succès';
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (err) => {
          console.error('Erreur libération', err);
          alert('Erreur lors de la libération');
        }
      });
    }
  }
}
