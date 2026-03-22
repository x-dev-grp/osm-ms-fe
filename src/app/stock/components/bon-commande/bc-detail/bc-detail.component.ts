import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BonCommandeService } from '../../../services/bon-commande.service';
import { BonCommande, StatutBonCommande } from '../../../models/bon-commande.model';
import { LigneBonCommande } from '../../../models/ligne-bon-commande.model';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {ApiResponse} from "../../../../shared/models/api-response";


@Component({
  selector: 'app-bc-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './bc-detail.component.html',
  styleUrls: ['./bc-detail.component.scss']
})
export class BcDetailComponent implements OnInit {
  bon: BonCommande | null = null;
  loading = true;
  error = '';
  showReception = false;
  quantiteRecue = 0;
  motifRefus = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bonCommandeService: BonCommandeService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBon(id);
    } else {
      this.error = 'ID du bon de commande manquant';
      this.loading = false;
    }
  }

  loadBon(id: string): void {
    this.loading = true;
    this.bonCommandeService.getBonCommandeById(id).subscribe({
      next: (response: ApiResponse<BonCommande>) => {
        if (response.success && response.data && response.data.length > 0) {
          this.bon = response.data[0];
        } else {
          this.error = response.message || 'Bon de commande non trouvé';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement bon', err);
        this.error = 'Erreur lors du chargement du bon de commande';
        this.loading = false;
      }
    });
  }

  validerBon(): void {
    if (!this.bon || !this.bon.id) return;

    if (confirm('Valider ce bon de commande ?')) {
      this.bonCommandeService.validerBonCommande(this.bon.id).subscribe({
        next: (response: ApiResponse<BonCommande>) => {
          if (response.success && response.data && response.data.length > 0) {
            this.bon = response.data[0];
            this.showSuccess('Bon de commande validé avec succès');
          } else {
            this.error = response.message || 'Erreur lors de la validation';
          }
        },
        error: (err) => {
          console.error('Erreur validation', err);
          this.error = 'Erreur lors de la validation';
        }
      });
    }
  }

  refuserBon(): void {
    if (!this.bon || !this.bon.id) return;

    const motif = prompt('Motif du refus :');
    if (motif !== null) {
      this.bonCommandeService.refuserBonCommande(this.bon.id, motif).subscribe({
        next: (response: ApiResponse<BonCommande>) => {
          if (response.success && response.data && response.data.length > 0) {
            this.bon = response.data[0];
            this.showSuccess('Bon de commande refusé');
          } else {
            this.error = response.message || 'Erreur lors du refus';
          }
        },
        error: (err) => {
          console.error('Erreur refus', err);
          this.error = 'Erreur lors du refus';
        }
      });
    }
  }

  receptionner(): void {
    if (!this.bon || !this.bon.id) return;

    if (this.quantiteRecue <= 0) {
      this.error = 'La quantité doit être positive';
      return;
    }

    this.bonCommandeService.receptionnerCommande(this.bon.id, this.quantiteRecue).subscribe({
      next: (response: ApiResponse<BonCommande>) => {
        if (response.success && response.data && response.data.length > 0) {
          this.bon = response.data[0];
          this.showReception = false;
          this.quantiteRecue = 0;
          this.showSuccess('Réception enregistrée avec succès');
        } else {
          this.error = response.message || 'Erreur lors de la réception';
        }
      },
      error: (err) => {
        console.error('Erreur réception', err);
        this.error = 'Erreur lors de la réception';
      }
    });
  }

  downloadPdf(): void {
    if (!this.bon || !this.bon.id) return;

    // Fonctionnalité PDF à implémenter si nécessaire
    this.error = 'Fonctionnalité PDF non disponible';
    setTimeout(() => this.error = '', 3000);
  }

  // Méthodes utilitaires
  getTotalArticles(): number {
    return this.bon?.lignes?.length || 0;
  }

  getQuantiteTotale(): number {
    return this.bon?.lignes?.reduce((sum, ligne) =>
      sum + (ligne.quantiteCommandee || 0), 0) || 0;
  }

  getQuantiteRecueTotale(): number {
    return this.bon?.lignes?.reduce((sum, ligne) =>
      sum + (ligne.quantiteRecue || 0), 0) || 0;
  }

  getProgressionReception(): number {
    const total = this.getQuantiteTotale();
    const recu = this.getQuantiteRecueTotale();
    return total > 0 ? Math.round((recu / total) * 100) : 0;
  }

  getLigneStatut(ligne: LigneBonCommande): string {
    if (!ligne.quantiteRecue || ligne.quantiteRecue === 0) {
      return 'En attente';
    } else if (ligne.quantiteRecue >= ligne.quantiteCommandee) {
      return 'Reçu';
    } else {
      return 'Partiellement reçu';
    }
  }

  getLigneStatutClass(ligne: LigneBonCommande): string {
    if (!ligne.quantiteRecue || ligne.quantiteRecue === 0) {
      return 'bg-warning';
    } else if (ligne.quantiteRecue >= ligne.quantiteCommandee) {
      return 'bg-success';
    } else {
      return 'bg-info';
    }
  }

  getStatutBadgeClass(statut: StatutBonCommande): string {
    const classes: any = {
      [StatutBonCommande.BROUILLON]: 'bg-secondary',
      [StatutBonCommande.EN_ATTENTE]: 'bg-warning text-dark',
      [StatutBonCommande.VALIDE]: 'bg-success',
      [StatutBonCommande.RECU]: 'bg-primary',
      [StatutBonCommande.PARTIELLEMENT_RECU]: 'bg-info',
      [StatutBonCommande.ANNULE]: 'bg-dark',
      [StatutBonCommande.REFUSE]: 'bg-danger'
    };
    return classes[statut] || 'bg-secondary';
  }

  hasPrix(): boolean {
    return this.bon?.lignes?.some(l => l.prixUnitaire != null && l.prixUnitaire > 0) || false;
  }

  getTotalPrix(): number {
    return this.bon?.lignes?.reduce((sum, ligne) => {
      const prix = ligne.prixUnitaire || 0;
      return sum + (ligne.quantiteCommandee * prix);
    }, 0) || 0;
  }

  private showSuccess(message: string): void {
    alert(message);
  }
}
