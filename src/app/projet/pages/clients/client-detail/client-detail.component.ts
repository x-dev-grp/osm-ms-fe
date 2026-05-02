import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ClientService } from '../../../services/ClientService';
import { Client } from '../../../models/Client';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './client-detail.component.html',
  styleUrls: ['./client-detail.component.scss']
})
export class ClientDetailComponent implements OnInit {
  client: Client | null = null;
  loading = false;
  clientId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientService: ClientService
  ) {}

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id');
    if (this.clientId) {
      this.loadClient(this.clientId);
    }
  }

  private loadClient(id: string): void {
    this.loading = true;
    this.clientService.getById(id).subscribe({
      next: (data) => {
        this.client = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement client detail', err);
        this.loading = false;
      }
    });
  }

  typeLabel(type?: string): string {
    if (type === 'BUYER') return 'Acheteur';
    if (type === 'BRAND_OWNER') return 'Proprietaire de marque';
    return type ?? '-';
  }

  onBack(): void {
    this.router.navigate(['/projets/clients']);
  }
}

