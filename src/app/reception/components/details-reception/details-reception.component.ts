import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { UnifiedDeliveryService } from '../../../shared/services/delivery.service';
import { UnifiedDelivery } from '../../../shared/models/UnifiedDelivery';

@Component({
  selector: 'app-details-reception-olive',
  standalone: true,
  templateUrl: './details-reception.component.html',
  styleUrl: './details-reception.component.scss',
  imports: [
    CommonModule,
    DatePipe,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatButtonModule
  ]
})
export class DetailsReceptionComponent implements OnInit {
  receptionId!: string | null;
  deliveryData: UnifiedDelivery | null = null;
  loading = true;
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private deliveryService: UnifiedDeliveryService
  ) {}

  ngOnInit(): void {
    this.loadReception();
  }

  loadReception(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loading = true;
      this.deliveryService.getUnifiedDelivery(id).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.deliveryData = response.data[0];
          } else {
            this.errorMessage = 'Erreur lors du chargement des détails.';
            this.snackBar.open(this.errorMessage, 'Fermer', { duration: 3000 });
          }
          this.loading = false;
        },
        error: () => {
          this.errorMessage = 'Erreur lors du chargement des données.';
          this.snackBar.open(this.errorMessage, 'Fermer', { duration: 3000 });
          this.loading = false;
        }
      });
    } else {
      this.errorMessage = 'ID de réception invalide.';
      this.loading = false;
    }
  }

  onBack(): void {
    window.history.back();
  }
}
