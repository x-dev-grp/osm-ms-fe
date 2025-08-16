import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { OilSaleService } from '../../service/oil-sale.service';
import { OilSale, OilSaleStatus } from '../../models/oil-sale.model';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-oil-sale-view',
  standalone: true,
  templateUrl: './oil-sale-view.component.html',
  styleUrls: ['./oil-sale-view.component.scss'],
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    TranslateModule
  ]
})
export class OilSaleViewComponent implements OnInit {
  oilSale?: OilSale;
  loading = false;
  oilSaleId?: string;

  constructor(
    private oilSaleService: OilSaleService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.oilSaleId = this.route.snapshot.paramMap.get('id') || undefined;
    if (this.oilSaleId) {
      this.loadOilSale(this.oilSaleId);
    } else {
      this.toast.error('No oil sale ID provided');
      this.router.navigate(['/finance/oil-sales']);
    }
  }

  private loadOilSale(id: string): void {
    this.loading = true;
    this.oilSaleService.getOilSale(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.oilSale = response.data[0];
        } else {
          this.toast.error('Oil sale not found');
          this.router.navigate(['/finance/oil-sales']);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading oil sale:', error);
        this.toast.error('Error loading oil sale');
        this.router.navigate(['/finance/oil-sales']);
        this.loading = false;
      }
    });
  }



  onConfirm(): void {
    if (this.oilSaleId && this.oilSale?.status === OilSaleStatus.PENDING) {
      this.oilSaleService.confirmOilSale(this.oilSaleId).subscribe({
        next: (response) => {
          if (response.success) {
            this.toast.success('Oil sale confirmed successfully');
            this.loadOilSale(this.oilSaleId!);
          } else {
            this.toast.error(response.message || 'Error confirming oil sale');
          }
        },
        error: (error) => {
          console.error('Error confirming oil sale:', error);
          this.toast.error('Error confirming oil sale');
        }
      });
    }
  }

  onCancel(): void {
    if (this.oilSaleId && this.oilSale?.status === OilSaleStatus.PENDING) {
      this.oilSaleService.cancelOilSale(this.oilSaleId).subscribe({
        next: (response) => {
          if (response.success) {
            this.toast.success('Oil sale cancelled successfully');
            this.loadOilSale(this.oilSaleId!);
          } else {
            this.toast.error(response.message || 'Error cancelling oil sale');
          }
        },
        error: (error) => {
          console.error('Error cancelling oil sale:', error);
          this.toast.error('Error cancelling oil sale');
        }
      });
    }
  }

  onDeliver(): void {
    if (this.oilSaleId && this.oilSale?.status === OilSaleStatus.CONFIRMED) {
      this.oilSaleService.deliverOilSale(this.oilSaleId).subscribe({
        next: (response) => {
          if (response.success) {
            this.toast.success('Oil sale delivered successfully');
            this.loadOilSale(this.oilSaleId!);
          } else {
            this.toast.error(response.message || 'Error delivering oil sale');
          }
        },
        error: (error) => {
          console.error('Error delivering oil sale:', error);
          this.toast.error('Error delivering oil sale');
        }
      });
    }
  }

  getStatusColor(status: OilSaleStatus): string {
    switch (status) {
      case OilSaleStatus.PENDING:
        return 'warn';
      case OilSaleStatus.CONFIRMED:
        return 'primary';
      case OilSaleStatus.DELIVERED:
        return 'accent';
      case OilSaleStatus.CANCELLED:
        return 'warn';
      default:
        return 'primary';
    }
  }

  canEdit(): boolean {
    return this.oilSale?.status === OilSaleStatus.PENDING;
  }

  canConfirm(): boolean {
    return this.oilSale?.status === OilSaleStatus.PENDING;
  }

  canCancel(): boolean {
    return this.oilSale?.status === OilSaleStatus.PENDING;
  }

  canDeliver(): boolean {
    return this.oilSale?.status === OilSaleStatus.CONFIRMED;
  }
}
