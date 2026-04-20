import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ClientService } from '../../../services/client.service';
import { Client } from '../../../models/client.model';
import { ApiResponse } from '../../../../shared/models/api-response';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './client-list.component.html',
  styleUrls: ['./client-list.component.scss']
})
export class ClientListComponent implements OnInit, OnDestroy {
  clients: Client[] = [];
  filteredClients: Client[] = [];

  loading = false;
  error: string | null = null;
  successMessage: string | null = null;

  searchTerm: string = '';
  togglingId: string | null = null;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private clientService: ClientService,
    protected router: Router
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
    this.loadClients();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadClients(): void {
    this.loading = true;
    this.error = null;

    this.clientService.getAllClients().subscribe({
      next: (response: ApiResponse<Client>) => {
        if (response.success && response.data) {
          // Tri : actifs en premier, puis par date décroissante
          this.clients = response.data.sort((a, b) => {
            if (a.actif !== undefined && b.actif !== undefined && a.actif !== b.actif) {
              return a.actif ? -1 : 1;
            }
            const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
            const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
            return dateB - dateA;
          });
          this.filteredClients = [...this.clients];
        } else {
          this.error = response.message || 'Erreur lors du chargement des clients';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement clients', err);
        this.error = 'Impossible de charger la liste des clients';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.clients];
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(client =>
        client.nom?.toLowerCase().includes(term) ||
        client.codeClient?.toLowerCase().includes(term) ||
        client.email?.toLowerCase().includes(term) ||
        client.pays?.toLowerCase().includes(term)
      );
    }
    this.filteredClients = filtered;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  // Méthode appelée depuis le template pour activer/désactiver un client
  toActif(client: Client, event: Event): void {
    event.stopPropagation();
    if (!client.id) return;

    const action = client.actif ? 'désactiver' : 'activer';
    const message = `Voulez-vous ${action} le client "${client.nom}" ?`;

    if (confirm(message)) {
      this.togglingId = client.id;
      const request = client.actif
        ? this.clientService.desactiverClient(client.id)
        : this.clientService.activerClient(client.id);

      request.subscribe({
        next: (response: ApiResponse<Client>) => {
          if (response.success && response.data && response.data.length > 0) {
            const updatedClient = response.data[0];
            // Mettre à jour l'objet dans les tableaux
            const index = this.clients.findIndex(c => c.id === updatedClient.id);
            if (index !== -1) {
              this.clients[index] = updatedClient;
            }
            // Re-trier la liste
            this.sortClients();
            this.applyFilters();
            this.successMessage = `Client ${action} avec succès`;
            setTimeout(() => this.successMessage = null, 3000);
          } else {
            this.error = response.message || 'Erreur lors du changement de statut';
          }
          this.togglingId = null;
        },
        error: (err) => {
          console.error(`Erreur lors de la ${action}`, err);
          this.error = `Erreur lors de ${action}`;
          this.togglingId = null;
          setTimeout(() => this.error = null, 3000);
        }
      });
    }
  }

  private sortClients(): void {
    this.clients.sort((a, b) => {
      if (a.actif !== undefined && b.actif !== undefined && a.actif !== b.actif) {
        return a.actif ? -1 : 1;
      }
      const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
      const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
      return dateB - dateA;
    });
  }
}
