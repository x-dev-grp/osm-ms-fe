import { Component } from '@angular/core';
 import {ActivatedRoute} from "@angular/router";
 import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from "@angular/material/card";
import { SupplierType } from '../../../shared/models/supplier-type';
import { SupplierTypeService } from '../../services/supplier-type.service';

@Component({
  selector: 'app-supplier-details',
  standalone:true,
  imports: [
    MatCardContent,
    MatCardTitle,
    MatCard,
    MatCardHeader
  ],
  templateUrl: './supplier-details.component.html',
  styleUrl: './supplier-details.component.scss'
})
export class SupplierDetailsComponent {
  supplierId!: string | null;
  supplierData!: SupplierType;
  loading = true;
  supplier:SupplierType ;

  constructor(private route: ActivatedRoute, private supplierServices :SupplierTypeService) {}

  ngOnInit(): void {
    this.supplierId = this.route.snapshot.paramMap.get('id');

    this.loadSupplier();
  }

  loadSupplier(): void {
    if (this.supplierId) {
      this.supplierServices.getSupplier(this.supplierId).subscribe({
        next: (response) => {
          this.supplierData = response.data[0];
          console.log("Supplier details :", this.supplierData);
        },
        error: (error) => {
          console.error('Erreur lors de la récupération du supplier :', error);
        }
      });
    }
  }


}
