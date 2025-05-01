import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {UnifiedDeliveryService} from "../../../shared/services/delivery.service";
import {UnifiedDelivery} from "../../../shared/models/UnifiedDelivery";
import {MatCard, MatCardContent, MatCardTitle} from "@angular/material/card";
import {MatDivider} from "@angular/material/divider";
import { DatePipe } from '@angular/common';


@Component({
  selector: 'app-details-reception',
  imports: [
    MatCardContent,
    MatCard,
    MatCardTitle,
    MatDivider,
    DatePipe,
    CommonModule
  ],
  templateUrl: './details-reception.component.html',
  standalone: true,
  styleUrl: './details-reception.component.scss'
})
export class DetailsReceptionComponent {

  receptionId!: string | null;
  deliveryData!: UnifiedDelivery;
  loading = true;

  constructor(private route: ActivatedRoute, private deliveryService :UnifiedDeliveryService) {}

  ngOnInit(): void {
    this.receptionId = this.route.snapshot.paramMap.get('id');
    this.loadReception();
  }

  loadReception(): void {
    if (this.receptionId) {
      this.deliveryService.getUnifiedDelivery(this.receptionId).subscribe({
        next: (response) => {
          this.deliveryData = response.data[0];
          console.log("Reception details :", this.deliveryData);
        },
        error: (error) => {
          console.error('Erreur lors de la récupération de la réception :', error);
        }
      });
    }
  }


}


