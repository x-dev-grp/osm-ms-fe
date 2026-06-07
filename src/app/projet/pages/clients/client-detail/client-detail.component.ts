import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientService } from '../../../services/client.service';
import { Client } from '../../../models/client.model';
import { ApiResponse } from '../../../../shared/models/api-response';
import { extractHttpErrorMessage } from '../../../../shared/utils/http-error.util';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './client-detail.component.html',
  styleUrls: ['./client-detail.component.scss']
})
export class ClientDetailComponent implements OnInit {
  client: Client | null = null;
  loading = true;
  error: string | null = null;
  successMessage: string | null = null;
  Actif = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientService: ClientService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadClient(id);
    } else {
      this.error = 'ID du client manquant';
      this.loading = false;
    }
  }

  loadClient(id: string): void {
    this.loading = true;
    this.error = null;

    this.clientService.getClientById(id).subscribe({
      next: (response: ApiResponse<Client>) => {
        if (response.success && response.data && response.data.length > 0) {
          this.client = response.data[0];
        } else {
          this.error = response.message || 'Client non trouvé';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement client', err);
        this.error = 'Impossible de charger le client';
        this.loading = false;
      }
    });
  }
  toActif(): void {
    if (!this.client?.id) return;

    const action = this.client.actif ? 'désactiver' : 'activer';
    const message = `Voulez-vous ${action} le client "${this.client.nom}" ?`;

    if (confirm(message)) {
      this.Actif = true;

      const request = this.client.actif
        ? this.clientService.desactiverClient(this.client.id)  // If actif=true → désactiver
        : this.clientService.activerClient(this.client.id);     // If actif=false → activer

      request.subscribe({
        next: (response: ApiResponse<Client>) => {
          if (response.success && response.data && response.data.length > 0) {
            this.client = response.data[0];
            this.successMessage = `Client ${action} avec succès`;
          } else {
            this.error = response.message || 'Erreur lors du changement de statut';
          }
          this.Actif = false;
        },
        error: (err) => {
          console.error(`Erreur lors de la ${action}`, err);
          this.Actif = false;
          this.error = extractHttpErrorMessage(err, `Erreur lors de ${action}`);
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/stock/clients']);
  }

  getAdresseComplete(): string {
    if (!this.client) return '';

    const parts = [
      this.client.adresse,
      this.client.codePostal,
      this.client.ville,
      this.client.pays
    ].filter(part => part && part.trim() !== '');

    return parts.join(', ');
  }

}
