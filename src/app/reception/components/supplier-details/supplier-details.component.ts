import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { SupplierType } from '../../../shared/models/supplier-type';
import { SupplierTypeService } from '../../../shared/services/supplier.service';
import { MatList, MatListItem } from '@angular/material/list';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-supplier-details',
  standalone: true,
  imports: [MatCardContent, MatCardTitle, MatCard, MatCardHeader, MatList, MatListItem, MatDivider, MatIcon],
  templateUrl: './supplier-details.component.html',
  styleUrl: './supplier-details.component.scss'
})
export class SupplierDetailsComponent {
  supplierId!: string | null;
  supplierData!: SupplierType;
  loading = true;
  supplier: SupplierType;

  constructor(
    private route: ActivatedRoute,
    private supplierServices: SupplierTypeService
  ) {}

  ngOnInit(): void {
    this.supplierId = this.route.snapshot.paramMap.get('id');

    this.loadSupplier();
  }
  onBack(): void {
    window.history.back();
  }
  loadSupplier(): void {
    if (this.supplierId) {
      this.supplierServices.getSupplier(this.supplierId).subscribe({
        next: (response) => {
          this.supplierData = response.data[0];
          console.log('Supplier details :', this.supplierData);
        },
        error: (error) => {
          console.error('Erreur lors de la récupération du supplier :', error);
        }
      });
    }
  }
}
