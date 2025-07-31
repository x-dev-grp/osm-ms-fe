import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { Customer } from '../../models/Customer';
import { CustomerService } from '../../service/customer.service';
import { getCustomerCategoryLabel } from '../../models/CustomerCategory';
import { TranslateModule } from '@ngx-translate/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-customer-view',
  standalone: true,
  templateUrl: './customer-view.component.html',
  styleUrls: ['./customer-view.component.scss'],
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatDividerModule, TranslateModule, MatProgressSpinner]
})
export class CustomerViewComponent implements OnInit {
  customer?: Customer;
  loading = false;
  customerId?: string;

  constructor(
    private customerService: CustomerService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.customerId = this.route.snapshot.paramMap.get('id') || undefined;
    if (this.customerId) {
      this.loadCustomer(this.customerId);
    }
  }

  private loadCustomer(id: string): void {
    this.loading = true;
    this.customerService.getCustomer(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.customer = response.data[0];
        } else {
          this.snackBar.open('Customer not found', 'Close', { duration: 3000 });
          this.router.navigate(['/finance/customers']);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading customer:', error);
        this.snackBar.open('Error loading customer', 'Close', { duration: 3000 });
        this.router.navigate(['/finance/customers']);
        this.loading = false;
      }
    });
  }

  onEdit(): void {
    if (this.customerId) {
      this.router.navigate(['/finance/customers', this.customerId, 'edit']);
    }
  }

  onBack(): void {
    this.router.navigate(['/finance/customers']);
  }

  getCategoryLabel(category?: string): string {
    if (!category) return 'N/A';
    return getCustomerCategoryLabel(category as any);
  }
}
