import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {UnifiedDeliveryService} from "../../../shared/services/delivery.service";
import {UnifiedDelivery} from "../../../shared/models/UnifiedDelivery";
import {MatCard, MatCardContent, MatCardTitle} from "@angular/material/card";
import {MatDivider} from "@angular/material/divider";
import { DatePipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';


@Component({
  selector: 'app-details-reception-olive',
  imports: [MatCardContent, MatCard, MatCardTitle, MatDivider, DatePipe, CommonModule, MatIcon, MatIconButton],
  templateUrl: './details-reception.component.html',
  standalone: true,
  styleUrl: './details-reception.component.scss'
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
    }
  }
  onBack(): void {
    window.history.back();
  }
}


