import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
 import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { Customer } from '../../models/Customer';
import { CustomerService } from '../../service/customer.service';
import { getCustomerCategoryLabel } from '../../models/CustomerCategory';
import { TranslateModule } from '@ngx-translate/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-customer-view',
  standalone: true,
  templateUrl: './customer-view.component.html',
  styleUrls: ['./customer-view.component.scss'],
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatDividerModule, TranslateModule, MatProgressSpinnerModule]
})
export class CustomerViewComponent implements OnInit {
  customer?: Customer;
  loading = false;
  customerId?: string;

  constructor(
    private customerService: CustomerService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.customerId = this.route.snapshot.paramMap.get('id') || undefined;
    console.log('Customer view initialized with ID:', this.customerId);
    if (this.customerId) {
      this.loadCustomer(this.customerId);
    } else {
      console.error('No customer ID provided');
      this.toast.error('No customer ID provided');
      this.router.navigate(['/finance/customers']);
    }
  }

  private loadCustomer(id: string): void {
    this.loading = true;
    console.log('Loading customer with ID:', id);
    this.customerService.getCustomer(id).subscribe({
      next: (response) => {
        console.log('Customer service response:', response);
        if (response.success && response.data) {
          const customerData = Array.isArray(response.data) ? response.data[0] : response.data;
          this.customer = customerData;
          console.log('Customer data loaded:', this.customer);
        } else {
          console.log('No customer data found');
          this.toast.error('Customer not found');
          this.router.navigate(['/finance/customers']);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading customer:', error);
        this.toast.error('Error loading customer');
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
    if (!category) return 'CUSTOMERS.CATEGORIES.INDIVIDUAL';
    return getCustomerCategoryLabel(category as any);
  }
}
