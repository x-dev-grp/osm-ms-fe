import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Customer } from '../../models/Customer';
import { CustomerService } from '../../service/customer.service';
import { CustomerCategory, getCustomerCategories } from '../../models/CustomerCategory';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CardComponent } from '../../../theme/components/card/card.component';

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
    MatProgressSpinnerModule,
    TranslatePipe,
    CardComponent
  ]
})
export class CustomerAddComponent implements OnInit {
  customerForm!: FormGroup;
  isEditing = false;
  customerId?: string;
  loading = false;
  category: CustomerCategory = CustomerCategory.INDIVIDUAL;
  customerCategories = getCustomerCategories();

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute,
    private translateService: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.checkIfEditing();
  }

  private buildForm(): void {
    this.customerForm = this.fb.group({
      category: [CustomerCategory.INDIVIDUAL, Validators.required],
      customerName: ['', Validators.required],
      customerLastName: [''],
      contactPerson: [''],
      matriculeFiscal: [''],
      numCIN: [''],
      email: ['', [Validators.email]],
      phone: [''],
      mobile: [''],
      fax: [''],
      address: [''],
      postalCode: [''],
      country: [''],
      notes: [''],
      active: [true]
    });

    this.category = this.customerForm.get('category')?.value;
    this.updateCategoryFields(this.category);

    this.customerForm.get('category')?.valueChanges.subscribe(value => {
      console.log('Category changed to:', value);
      this.category = value;
      this.updateCategoryFields(value);
    });
  }

  updateCategoryFields(category: CustomerCategory): void {
    const form = this.customerForm;

    // Clear all validators first
    ['customerLastName', 'numCIN', 'contactPerson', 'matriculeFiscal'].forEach(field => {
      form.get(field)?.clearValidators();
      form.get(field)?.updateValueAndValidity();
    });

    // Set validators based on category
    if (category === CustomerCategory.INDIVIDUAL) {
      form.get('customerLastName')?.setValidators(Validators.required);
      form.get('numCIN')?.setValidators(Validators.required);
    } else if (category === CustomerCategory.BUSINESS) {
      form.get('contactPerson')?.setValidators(Validators.required);
      form.get('matriculeFiscal')?.setValidators(Validators.required);
    }

    // Update validity for all category-specific fields
    ['customerLastName', 'numCIN', 'contactPerson', 'matriculeFiscal'].forEach(field => {
      form.get(field)?.updateValueAndValidity();
    });

    // Force change detection by updating the category property
    this.category = category;
    this.cdr.detectChanges();
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
          const customerData = Array.isArray(response.data) ? response.data[0] : response.data;
          this.customerForm.patchValue(customerData);
          this.category = customerData.category || CustomerCategory.INDIVIDUAL;
          this.updateCategoryFields(this.category);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading customer:', error);
        this.snackBar.open(
          this.translateService.instant('CUSTOMERS.MESSAGES.ERROR_LOADING'),
          this.translateService.instant('COMMON.CLOSE'),
          { duration: 3000 }
        );
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.customerForm.valid) {
      this.loading = true;
      const formValue = this.customerForm.value;

      // Clean up the data - convert empty strings to null for optional fields
      const customerData: Customer = {
        ...formValue,
        email: formValue.email || null,
        phone: formValue.phone || null,
        mobile: formValue.mobile || null,
        fax: formValue.fax || null,
        address: formValue.address || null,
        postalCode: formValue.postalCode || null,
        country: formValue.country || null,
        notes: formValue.notes || null,
        contactPerson: formValue.contactPerson || null,
        matriculeFiscal: formValue.matriculeFiscal || null,
        numCIN: formValue.numCIN || null,
        customerLastName: formValue.customerLastName || null
      };

      if (this.isEditing && this.customerId) {
        customerData.id = this.customerId;
        this.customerService.updateCustomer(customerData).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open(
                this.translateService.instant('CUSTOMERS.MESSAGES.UPDATE_SUCCESS'),
                this.translateService.instant('COMMON.CLOSE'),
                { duration: 3000 }
              );
              this.router.navigate(['/finance/customers']);
            } else {
              this.snackBar.open(
                response.message || this.translateService.instant('CUSTOMERS.MESSAGES.ERROR_UPDATING'),
                this.translateService.instant('COMMON.CLOSE'),
                { duration: 3000 }
              );
            }
            this.loading = false;
          },
          error: (error) => {
            console.error('Error updating customer:', error);
            this.snackBar.open(
              this.translateService.instant('CUSTOMERS.MESSAGES.ERROR_UPDATING'),
              this.translateService.instant('COMMON.CLOSE'),
              { duration: 3000 }
            );
            this.loading = false;
          }
        });
      } else {
        this.customerService.createCustomer(customerData).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open(
                this.translateService.instant('CUSTOMERS.MESSAGES.SAVE_SUCCESS'),
                this.translateService.instant('COMMON.CLOSE'),
                { duration: 3000 }
              );
              this.router.navigate(['/finance/customers']);
            } else {
              this.snackBar.open(
                response.message || this.translateService.instant('CUSTOMERS.MESSAGES.ERROR_SAVING'),
                this.translateService.instant('COMMON.CLOSE'),
                { duration: 3000 }
              );
            }
            this.loading = false;
          },
          error: (error) => {
            console.error('Error creating customer:', error);
            this.snackBar.open(
              this.translateService.instant('CUSTOMERS.MESSAGES.ERROR_SAVING'),
              this.translateService.instant('COMMON.CLOSE'),
              { duration: 3000 }
            );
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
      return this.translateService.instant('COMMON.VALIDATION.REQUIRED');
    }
    if (control?.hasError('email')) {
      return this.translateService.instant('COMMON.VALIDATION.EMAIL');
    }
    if (control?.hasError('maxlength')) {
      const maxLength = control.getError('maxlength').requiredLength;
      return this.translateService.instant('COMMON.VALIDATION.MAX_LENGTH', { maxLength });
    }
    return '';
  }


}
