import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Customer } from '../../models/Customer';
import { CustomerService } from '../../service/customer.service';
import { CustomerCategory, getCustomerCategories } from '../../models/CustomerCategory';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-customer-add',
  standalone: true,
  templateUrl: './customer-add.component.html',
  styleUrls: ['./customer-add.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatCardModule,
    MatIconModule,
    TranslatePipe
  ]
})
export class CustomerAddComponent implements OnInit {
  customerForm!: FormGroup;
  isEditing = false;
  customerId?: string;
  loading = false;

  customerCategories = getCustomerCategories();

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.checkIfEditing();
  }

  private buildForm(): void {
    this.customerForm = this.fb.group({
      matriculeFiscal: ['', [Validators.required, Validators.maxLength(50)]],
      numCIN: ['', [Validators.required, Validators.maxLength(8)]],
      customerName: ['', [Validators.required, Validators.maxLength(200)]],
      customerLastName: ['', [Validators.required, Validators.maxLength(200)]],
      contactPerson: ['', [Validators.maxLength(100)]],
      email: ['', [Validators.email, Validators.maxLength(100)]],
      phone: ['', [Validators.maxLength(20)]],
      mobile: ['', [Validators.maxLength(20)]],
      fax: ['', [Validators.maxLength(20)]],
      address: ['', [Validators.maxLength(200)]],
      postalCode: ['', [Validators.maxLength(20)]],
      country: ['', [Validators.maxLength(100)]],
      category: [CustomerCategory.BUSINESS],
      notes: ['', [Validators.maxLength(1000)]],
      active: [true]
    });
  }

  private checkIfEditing(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing = true;
      this.customerId = id;
      this.loadCustomer(id);
    }
  }

  private loadCustomer(id: string): void {
    this.loading = true;
    this.customerService.getCustomer(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.customerForm.patchValue(response.data);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading customer:', error);
        this.snackBar.open('Error loading customer', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.customerForm.valid) {
      this.loading = true;
      const customerData: Customer = this.customerForm.value;

      if (this.isEditing && this.customerId) {
        customerData.id = this.customerId;
        this.customerService.updateCustomer(customerData).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('Customer updated successfully', 'Close', { duration: 3000 });
              this.router.navigate(['/finance/customers']);
            } else {
              this.snackBar.open(response.message || 'Failed to update customer', 'Close', { duration: 3000 });
            }
            this.loading = false;
          },
          error: (error) => {
            console.error('Error updating customer:', error);
            this.snackBar.open('Error updating customer', 'Close', { duration: 3000 });
            this.loading = false;
          }
        });
      } else {
        this.customerService.createCustomer(customerData).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('Customer created successfully', 'Close', { duration: 3000 });
              this.router.navigate(['/finance/customers']);
            } else {
              this.snackBar.open(response.message || 'Failed to create customer', 'Close', { duration: 3000 });
            }
            this.loading = false;
          },
          error: (error) => {
            console.error('Error creating customer:', error);
            this.snackBar.open('Error creating customer', 'Close', { duration: 3000 });
            this.loading = false;
          }
        });
      }
    }
  }

  onCancel(): void {
    this.router.navigate(['/finance/customers']);
  }

  getErrorMessage(controlName: string): string {
    const control = this.customerForm.get(controlName);
    if (control?.hasError('required')) {
      return 'This field is required';
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (control?.hasError('maxlength')) {
      const maxLength = control.getError('maxlength').requiredLength;
      return `Maximum length is ${maxLength} characters`;
    }
    return '';
  }
}
