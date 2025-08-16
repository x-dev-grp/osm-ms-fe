import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
 import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

import { UnifiedDeliveryService } from '../../../shared/services/delivery.service';
import { UnifiedDelivery } from '../../../shared/models/UnifiedDelivery';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-details-reception-olive',
  standalone: true,
  templateUrl: './details-reception.component.html',
  styleUrl: './details-reception.component.scss',
  imports: [CommonModule, DatePipe, MatCardModule, MatDividerModule, MatIconModule, MatButtonModule, TranslateModule, MatProgressSpinner]
})
export class DetailsReceptionComponent implements OnInit {
  receptionId!: string | null;
  deliveryData: UnifiedDelivery | null = null;
  loading = true;
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private toast: ToastService,
    private deliveryService: UnifiedDeliveryService,
    protected translate: TranslateService
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
            this.deliveryData = Array.isArray(response.data) ? response.data[0] : response.data;
            this.toast.success(response.message);
          } else {
            this.errorMessage = this.translate.instant('DELIVERIES.DETAILS.MESSAGES.LOAD_ERROR');
            this.toast.error(this.errorMessage!);
          }
          this.loading = false;
        },
        error: () => {
          this.errorMessage = this.translate.instant('DELIVERIES.DETAILS.MESSAGES.DATA_ERROR');
          this.toast.error(this.errorMessage!);
          this.loading = false;
        }
      });
    } else {
      this.errorMessage = this.translate.instant('DELIVERIES.DETAILS.MESSAGES.INVALID_ID');
      this.loading = false;
    }
  }

  onBack(): void {
    window.history.back();
  }
}
