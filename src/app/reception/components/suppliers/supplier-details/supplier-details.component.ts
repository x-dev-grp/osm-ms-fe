import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCard, MatCardTitle } from '@angular/material/card';
import { SupplierType } from '../../../../shared/models/supplier-type';
import { SupplierTypeService } from '../../../../shared/services/supplier.service';
import { MatList, MatListItem } from '@angular/material/list';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-supplier-details',
  standalone: true,
  imports: [CommonModule, MatCardTitle, MatCard, MatList, MatListItem, MatDivider, MatIcon, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './supplier-details.component.html',
  styleUrl: './supplier-details.component.scss'
})
export class SupplierDetailsComponent implements OnInit {
  supplierId!: string | null;
  supplierData!: SupplierType;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supplierService: SupplierTypeService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.supplierId = this.route.snapshot.paramMap.get('id');
    if (!this.supplierId) {
      this.error = 'ID du fournisseur non trouvé';
      this.loading = false;
      return;
    }
    this.loadSupplier();
  }

  onBack(): void {
    this.router.navigate(['/reception/fournisseur']);
  }

  onEdit(): void {
    if (this.supplierId) {
      this.router.navigate(['/reception/fournisseur', this.supplierId]);
    }
  }

  loadSupplier(): void {
    if (!this.supplierId) return;

    this.loading = true;
    this.error = null;

    this.supplierService.getSupplier(this.supplierId).subscribe({
      next: (response) => {
        if (response.success && response.data && response.data.length > 0) {
          this.supplierData = response.data[0];
          if (!this.supplierData.supplierInfo) {
            this.error = 'Données du fournisseur incomplètes';
          }
        } else {
          this.error = 'Fournisseur non trouvé';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération du fournisseur:', error);
        this.error = 'Erreur lors du chargement des données du fournisseur';
        this.loading = false;
      }
    });
  }

  toast(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }
}
