import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ClientService } from '../../../services/client.service';
import { Client } from '../../../models/client.model';
import { ApiResponse } from '../../../../shared/models/api-response';
import { sortRowsByCreatedDate, TableSortDirection, toggleSortDirection } from '../../../../shared/utils/table-sort.util';

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
  sortDirection: TableSortDirection = 'desc';

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
      next: (data: Client[]) => {
        this.clients = data;
        this.filteredClients = data;
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

    filtered = sortRowsByCreatedDate(filtered, this.sortDirection);
    this.filteredClients = filtered;
  }

  toggleCreatedDateSort(): void {
    this.sortDirection = toggleSortDirection(this.sortDirection);
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.applyFilters();
  }
}
