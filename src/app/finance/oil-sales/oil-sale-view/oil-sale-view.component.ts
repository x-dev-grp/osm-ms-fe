import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
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
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.oilSaleId = this.route.snapshot.paramMap.get('id') || undefined;
    if (this.oilSaleId) {
      this.loadOilSale(this.oilSaleId);
    } else {
      this.snackBar.open('No oil sale ID provided', 'Close', { duration: 3000 });
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
          this.snackBar.open('Oil sale not found', 'Close', { duration: 3000 });
          this.router.navigate(['/finance/oil-sales']);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading oil sale:', error);
        this.snackBar.open('Error loading oil sale', 'Close', { duration: 3000 });
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
            this.snackBar.open('Oil sale confirmed successfully', 'Close', { duration: 3000 });
            this.loadOilSale(this.oilSaleId!);
          } else {
            this.snackBar.open(response.message || 'Error confirming oil sale', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error confirming oil sale:', error);
          this.snackBar.open('Error confirming oil sale', 'Close', { duration: 3000 });
        }
      });
    }
  }

  onCancel(): void {
    if (this.oilSaleId && this.oilSale?.status === OilSaleStatus.PENDING) {
      this.oilSaleService.cancelOilSale(this.oilSaleId).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Oil sale cancelled successfully', 'Close', { duration: 3000 });
            this.loadOilSale(this.oilSaleId!);
          } else {
            this.snackBar.open(response.message || 'Error cancelling oil sale', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error cancelling oil sale:', error);
          this.snackBar.open('Error cancelling oil sale', 'Close', { duration: 3000 });
        }
      });
    }
  }

  onDeliver(): void {
    if (this.oilSaleId && this.oilSale?.status === OilSaleStatus.CONFIRMED) {
      this.oilSaleService.deliverOilSale(this.oilSaleId).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Oil sale delivered successfully', 'Close', { duration: 3000 });
            this.loadOilSale(this.oilSaleId!);
          } else {
            this.snackBar.open(response.message || 'Error delivering oil sale', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error delivering oil sale:', error);
          this.snackBar.open('Error delivering oil sale', 'Close', { duration: 3000 });
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
