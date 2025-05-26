import { Component, OnDestroy, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SupplierType } from '../../../shared/models/supplier-type';
import { SupplierTypeService } from '../../../shared/services/supplier.service';


@Component({
  selector: 'app-supplier-view',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './supplier-view.component.html',
  styleUrls: ['./supplier-view.component.scss']
})
export class SupplierViewComponent implements OnInit, OnDestroy {
  supplier?: SupplierType;
  private subs = new Subscription();

  constructor(
    private supplierService: SupplierTypeService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const supplierId = this.route.snapshot.params['id'];
    if (supplierId) {
      this.loadSupplier(supplierId);
    } else {
      this.router.navigate(['/supplier']);
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private loadSupplier(id: string): void {
    this.subs.add(
      this.supplierService.getSupplier(id).subscribe(
        (res) => {
          if (res.success && res.data) {
            this.supplier = res.data[0];
          } else {
            this.toast('Erreur lors du chargement du fournisseur.');
            this.router.navigate(['/supplier']);
          }
        },
        () => {
          this.toast('Erreur lors du chargement du fournisseur.');
          this.router.navigate(['/supplier']);
        }
      )
    );
  }

  onEdit(): void {
    if (this.supplier?.id) {
      this.router.navigate(['/supplier', this.supplier.id, 'edit']);
    }
  }

  onDelete(): void {
    if (this.supplier?.id) {
      this.subs.add(
        this.supplierService.deleteSupplier(this.supplier.id).subscribe(
          (res) => {
            if (res.success) {
              this.toast('Fournisseur supprimé avec succès.');
              this.router.navigate(['/supplier']);
            }
          },
          () => this.toast('Erreur lors de la suppression.')
        )
      );
    }
  }

  private toast(message: string, duration = 3000): void {
    this.snackBar.open(message, 'Fermer', {
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['']
    });
  }
}
