import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BonCommandeService } from '../../../services/bon-commande.service';
import { BonCommande, StatutBonCommande } from '../../../models/bon-commande.model';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiResponse } from "../../../../shared/models/api-response";

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
  fournisseurNom = '';
  showReception = false;
  receptionQuantities: { [key: string]: number } = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bonCommandeService: BonCommandeService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadBon(id);
    else {
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
          // Déduire le fournisseur de la première ligne
          if (this.bon.lignes?.length && this.bon.lignes[0].article?.fournisseur?.nom) {
            this.fournisseurNom = this.bon.lignes[0].article.fournisseur.nom;
          } else {
            this.fournisseurNom = 'Non spécifié';
          }
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
    if (!this.bon?.id) return;
    if (!confirm('Valider ce bon de commande ?')) return;

    this.bonCommandeService.validerBonCommande(this.bon.id).subscribe({
      next: (response: ApiResponse<any>) => {
        if (response.success) {
          this.loadBon(this.bon!.id!);
          this.showSuccess('Bon validé avec succès');
        } else {
          this.error = response.message || 'Erreur lors de la validation';
        }
      },
      error: () => {
        this.error = 'Erreur serveur lors de la validation';
      }
    });
  }

  refuserBon(): void {
    if (!this.bon?.id) return;
    const motif = prompt('Motif de refus :');
    if (!motif) return;

    this.bonCommandeService.refuserBonCommande(this.bon.id, motif).subscribe({
      next: (response: ApiResponse<any>) => {
        if (response.success) {
          this.loadBon(this.bon!.id!);
          this.showSuccess('Bon refusé');
        } else {
          this.error = response.message || 'Erreur lors du refus';
        }
      },
      error: () => {
        this.error = 'Erreur serveur lors du refus';
      }
    });
  }

  // Méthodes utilitaires
  getTotalArticles(): number {
    return this.bon?.lignes?.length || 0;
  }

  getQuantiteTotale(): number {
    return this.bon?.lignes?.reduce((s, l) => s + (l.quantiteCommandee || 0), 0) || 0;
  }

  getTotalPrix(): number {
    return this.bon?.lignes?.reduce((s, l) => s + (l.quantiteCommandee * (l.prixUnitaire || 0)), 0) || 0;
  }

  getStatutBadgeClass(statut: StatutBonCommande): string {
    const classes: any = {
      [StatutBonCommande.EN_ATTENTE]: 'bg-warning text-dark',
      [StatutBonCommande.VALIDE]: 'bg-success',
      [StatutBonCommande.RECU]: 'bg-primary',
      [StatutBonCommande.PARTIELLEMENT_RECU]: 'bg-info',
      [StatutBonCommande.REFUSE]: 'bg-danger'
    };
    return classes[statut] || 'bg-secondary';
  }

  private showSuccess(message: string): void {
    alert(message);
  }


  toggleReception(): void {
    if (this.bon?.lignes) {
      this.receptionQuantities = {};
      this.bon.lignes.forEach(ligne => {
        if (ligne.id) {
          this.receptionQuantities[ligne.id] = 0;
        }
      });
      this.showReception = !this.showReception;
    }
  }

  receptionner(): void {
    if (!this.bon?.id) return;

    const payload = Object.entries(this.receptionQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([id, quantiteRecue]) => ({ id, quantiteRecue }));

    if (payload.length === 0) {
      alert('Veuillez saisir au moins une quantité à réceptionner');
      return;
    }

    this.bonCommandeService.receptionnerCommande(this.bon.id, payload).subscribe({
      next: (response: ApiResponse<BonCommande>) => {
        if (response.success && response.data && response.data.length > 0) {
          this.bon = response.data[0];
          this.showReception = false;
          this.showSuccess('Réception enregistrée avec succès');
        } else {
          this.error = response.message || 'Erreur lors de la réception';
        }
      },
      error: (err) => {
        console.error(err);
        this.error = err.error?.error || 'Erreur serveur lors de la réception';
      }
    });
  }
}
