import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FournisseurService } from '../../../services/fournisseur.service';
import { Fournisseur } from '../../../models/fournisseur.model';

@Component({
  selector: 'app-fournisseur-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './fournisseur-detail.component.html',
  styleUrls: ['./fournisseur-detail.component.scss']
})
export class FournisseurDetailComponent implements OnInit {
  fournisseur?: Fournisseur;
  loading = true;
  activeTab: 'info' | 'contact' | 'commercial' | 'documents' = 'info';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fournisseurService: FournisseurService
  ) {}

  ngOnInit(): void {
    this.loadFournisseur();
  }

  loadFournisseur(): void {
    const id = this.route.snapshot.params['id'];
    this.fournisseurService.getFournisseurById(id).subscribe({
      next: (data) => {
        this.fournisseur = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement fournisseur:', error);
        this.router.navigate(['/stock/fournisseurs']);
      }
    });
  }

  Actif(): void {
    if (!this.fournisseur) return;

    const action = this.fournisseur.actif ? 'désactiver' : 'activer';
    const message = `Voulez-vous ${action} le fournisseur "${this.fournisseur.nom}" ?`;

    if (confirm(message)) {
      const serviceCall = this.fournisseur.actif
        ? this.fournisseurService.desactiverFournisseur(this.fournisseur.id!)
        : this.fournisseurService.activerFournisseur(this.fournisseur.id!);

      serviceCall.subscribe({
        next: (updated) => {
          this.fournisseur = updated;
        },
        error: (error) => {
          console.error('Erreur changement statut:', error);
          alert('Erreur lors du changement de statut');
        }
      });
    }
  }

}
