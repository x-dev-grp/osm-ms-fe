import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { UnifiedDeliveryService } from '../../shared/services/delivery.service';
import { UnifiedDelivery } from '../../shared/models/UnifiedDelivery';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ToastService } from '../../shared/services/toast.service';
import { OliveLotStatus } from '../../shared/models/OliveLotStatus';
import { MatChip, MatChipListbox } from '@angular/material/chips';
import { deliveryType } from '../../shared/models/deleveryType';

@Component({
  selector: 'app-details-reception-olive',
  standalone: true,
  templateUrl: './details-reception.component.html',
  styleUrls: ['./details-reception.component.scss'],
  imports: [
    CommonModule,
    DatePipe,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatButtonModule,
    TranslateModule,
    MatProgressSpinner,
    MatChipListbox,
    MatChip
  ]
})
export class DetailsReceptionComponent implements OnInit {
  receptionId!: string | null;
  deliveryData: UnifiedDelivery | null = null;

  /** When we’re showing an OIL reception, this holds the linked OLIVE one (and vice versa). */
  associatedCounterpart: UnifiedDelivery | null = null;

  loading = true;
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private toast: ToastService,
    private deliveryService: UnifiedDeliveryService,
    protected translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.receptionId = this.route.snapshot.paramMap.get('id');
    this.loadReceptionById(this.receptionId);
  }

  /** Open counterpart by re-fetching data with its ID (no navigation). */
  openCounterpart(): void {
    const id = this.associatedCounterpart?.id;
    if (!id) return;
    this.loadReceptionById(id);
  }

  /** Convenience to know if the *current* reception is OIL. */
  isOilReception(): boolean {
    return (this.deliveryData?.deliveryType || '').toUpperCase() === 'OIL';
  }

  /** Load a reception by ID and then resolve its counterpart if possible. */
  private loadReceptionById(id: string | null): void {
    if (!id) {
      this.errorMessage = this.translate.instant('DELIVERIES.DETAILS.MESSAGES.INVALID_ID');
      this.toast.error(this.errorMessage!);
      this.loading = false;
      return;
    }

    this.loading = true;
    this.errorMessage = null;
    this.associatedCounterpart = null;

    this.deliveryService.getUnifiedDelivery(id).subscribe({
      next: (response) => {
        if (response?.success && response?.data) {
          this.deliveryData = Array.isArray(response.data) ? response.data[0] : response.data;

          // Attempt to fetch counterpart only if we have a lot number
          const lot = this.deliveryData?.lotNumber;
          const curType = (this.deliveryData?.deliveryType || '').toUpperCase();
          const targetType =
            curType === 'OIL' ? deliveryType.OLIVE :
              curType === 'OLIVE' ? deliveryType.OIL : null;

          if (lot && targetType) {
            this.loadAssociatedCounterpart(lot, targetType);
          } else {
            this.loading = false;
          }

          if (response.message) {
            this.toast.success(response.message);
          }
        } else {
          this.deliveryData = null;
          this.errorMessage = this.translate.instant('DELIVERIES.DETAILS.MESSAGES.LOAD_ERROR');
          this.toast.error(this.errorMessage!);
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading delivery:', error);
        this.deliveryData = null;
        this.errorMessage = this.translate.instant('DELIVERIES.DETAILS.MESSAGES.DATA_ERROR');
        this.toast.error(this.errorMessage!);
        this.loading = false;
      }
    });
  }

  /** Look up the counterpart (OLIVE↔OIL) using the same lotNumber. */
  private loadAssociatedCounterpart(lotNumber: string, type: deliveryType): void {
    this.deliveryService.getDeliveryByLotNumberAndType(lotNumber, type).subscribe({
      next: (response) => {
        if (response?.success && response?.data) {
          this.associatedCounterpart = Array.isArray(response.data) ? response.data[0] : response.data;
          if (response.message) this.toast.success(response.message);
        } else {
          // It’s optional — no toast error
          this.associatedCounterpart = null;
        }
        this.loading = false;
      },
      error: (error) => {
        console.warn('Failed to load counterpart:', error);
        // Optional data — don’t toast an error
        this.associatedCounterpart = null;
        this.loading = false;
      }
    });
  }

  onBack(): void {
    window.history.back();
  }

  protected readonly OliveLotStatus = OliveLotStatus;
}
