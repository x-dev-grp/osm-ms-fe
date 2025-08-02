import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { OilSaleService } from '../../service/oil-sale.service';
import { CustomerService } from '../../service/customer.service';
import { OilSale, OilSaleStatus, UpdateOilSaleDto } from '../../models/oil-sale.model';
import { Customer } from '../../models/Customer';
import { Currency, PaymentMethod } from '../../models/financial-transaction.model';
import { StorageUnitDtoService } from '../../../shared/services/storage.service';
import { StorageUnitDto } from '../../../shared/models/StorageUnitDto';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { SupplierTypeService } from '../../../shared/services/supplier.service';
import { SupplierType } from '../../../shared/models/supplier-type';
import { map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { TransactionState, TransactionType } from '../../../shared/models/OilTransaction';
import { OilTransactionService } from '../../../shared/services/OilTransactionService';

@Component({
  selector: 'app-oil-sale-add',
  standalone: true,
  templateUrl: './oil-sale-add.component.html',
  styleUrls: ['./oil-sale-add.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    TranslateModule,
    MatAutocomplete,
    MatAutocompleteTrigger
  ]
})
export class OilSaleAddComponent implements OnInit {
  oilSaleForm!: FormGroup;
  loading = false;
  isEditing = false;
  oilSaleId?: string;
  customers: Customer[] = [];
  storageUnits: StorageUnitDto[] = [];
  suppliers: SupplierType[] = [];

  currencies = Object.values(Currency);
  paymentMethods = Object.values(PaymentMethod);

  // Autocomplete filtered options
  filteredSuppliers: Observable<SupplierType[]>;
  private oilTransactionDTO: any;

  constructor(
    private fb: FormBuilder,
    private oilSaleService: OilSaleService,
    private customerService: CustomerService,
    private route: ActivatedRoute,
    private storageUnitsService: StorageUnitDtoService,
    private supplierService: SupplierTypeService,
    private oiltransactionService: OilTransactionService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.filteredSuppliers = new Observable<SupplierType[]>();
  }

  ngOnInit(): void {
    this.buildForm();
    this.loadCustomers();
    this.loadStorageUnits();
    this.loadSuppliers();
    this.checkEditMode();
  }

  displaySupplierFn(supplier: SupplierType): string {
    if (!supplier) return '';
    return `${supplier.supplierInfo.name} ${supplier.supplierInfo.lastname}`;
  }

  onSubmit(): void {
    if (this.oilSaleForm.valid) {
      this.loading = true;
      const formValue = this.oilSaleForm.value;

      // Calculate total amount
      const totalAmount = formValue.quantity * formValue.unitPrice;

      if (this.isEditing && this.oilSaleId) {
        const updateDto: UpdateOilSaleDto = {
          id: this.oilSaleId,
          customerId: formValue.customerId||null,
          supplierId: formValue.supplierId?.id || formValue.supplierId||null,
          storageUnitId: formValue.storageUnitId||null,
          quantity: formValue.quantity||null,
          unitPrice: formValue.unitPrice||null,
          currency: formValue.currency||null,
          paymentMethod: formValue.paymentMethod||null,
          saleDate: formValue.saleDate.toISOString()||null,
          invoiceNumber: formValue.invoiceNumber||null,
          status: OilSaleStatus.PENDING||null,
          description: formValue.description||null
        };

        this.oilSaleService.updateOilSale(this.oilSaleId, updateDto).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('Oil sale updated successfully', 'Close', { duration: 3000 });
              this.router.navigate(['/finance/oil-sales']);
            } else {
              this.snackBar.open(response.message || 'Error updating oil sale', 'Close', { duration: 3000 });
            }
            this.loading = false;
          },
          error: (error) => {
            console.error('Error updating oil sale:', error);
            this.snackBar.open('Error updating oil sale', 'Close', { duration: 3000 });
            this.loading = false;
          }
        });
      } else {
        const createDto: OilSale = {
          customer: formValue.customerId||null,
          supplier: formValue.supplierId  ||null,
          storageUnit: formValue.storageUnitId||null,
          quantity: formValue.quantity||null,
          unitPrice: formValue.unitPrice||null,
          currency: formValue.currency||null,
          paymentMethod: formValue.paymentMethod||null,
          saleDate: formValue.saleDate.toISOString()||null,
          invoiceNumber: formValue.invoiceNumber||null,
          description: formValue.description||null,
          totalAmount: formValue?.unitPrice * formValue?.quantity ,
          status: OilSaleStatus.PENDING||null
        };

        this.oilSaleService.createOilSale(createDto).subscribe({
          next: (response) => {
            if (response.success) {
              this.oilTransactionDTO = this.createOilTransactionDTOFromForm();
              this.oiltransactionService.createOilTransactionForSale(this.oilTransactionDTO).subscribe({
                next: (response) => {
                  if (response.success) {
                    console.log('Oil transaction created successfully');
                  } else {
                    console.error('Error creating oil transaction:', response.message);
                  }
                },
                error: (error) => {
                  console.error('Error creating oil transaction:', error);
                }
              });
              this.snackBar.open('Oil sale created successfully', 'Close', { duration: 3000 });

              this.router.navigate(['/finance/oil-sales']);
            } else {
              this.snackBar.open(response.message || 'Error creating oil sale', 'Close', { duration: 3000 });
            }
            this.loading = false;
          },
          error: (error) => {
            console.error('Error creating oil sale:', error);
            this.snackBar.open('Error creating oil sale', 'Close', { duration: 3000 });
            this.loading = false;
          }
        });
      }
    }

    // TODO: Implementation required for the following workflow:
    // 1. When creating an oil sale, create an oil transaction out with the quantity and unit price from this form
    // 2. Set status as pending initially
    // 3. When validated, update the oil transaction to status completed and update the storage unit with the quantity sold
    // 4. Create the financial transaction with the total amount, currency, client and operation type 'oil sale'
    // 5. Update the oil transaction with paid/unpaid status, paid amount and unpaid amount
  }

  onCancel(): void {
    this.router.navigate(['/finance/oil-sales']);
  }

  getTotalAmount(): number {
    const quantity = this.oilSaleForm.get('quantity')?.value;
    const unitPrice = this.oilSaleForm.get('unitPrice')?.value;
    return quantity && unitPrice ? quantity * unitPrice : 0;
  }

  getSelectedStorageUnit(): StorageUnitDto | undefined {
    const storageUnitId = this.oilSaleForm.get('storageUnitId')?.value;
    return this.storageUnits.find((unit) => unit.id === storageUnitId);
  }

  getSelectedCustomer(): Customer | undefined {
    const customerId = this.oilSaleForm.get('customerId')?.value;
    return this.customers.find((customer) => customer.id === customerId);
  }

  getSelectedSupplier(): SupplierType | undefined {
    const supplierId = this.oilSaleForm.get('supplierId')?.value;
    if (typeof supplierId === 'object' && supplierId !== null) {
      return supplierId;
    }
    return this.suppliers.find((supplier) => supplier.id === supplierId);
  }

  // Helper method to get the selected entity type
  getSelectedEntityType(): 'customer' | 'supplier' | null {
    const customerId = this.oilSaleForm.get('customerId')?.value;
    const supplierId = this.oilSaleForm.get('supplierId')?.value;

    if (customerId) return 'customer';
    if (supplierId) return 'supplier';
    return null;
  }

  private buildForm(): void {
    this.oilSaleForm = this.fb.group(
      {
        customerId: [''],
        supplierId: [''],
        quantity: ['', [Validators.required, Validators.min(0.01)]],
        unitPrice: ['', [Validators.required, Validators.min(0.01)]],
        saleDate: [new Date(), Validators.required],
        description: ['']
      },
      { validators: this.customerOrSupplierRequired }
    );

    // Calculate total amount when quantity or unit price changes
    this.oilSaleForm.get('quantity')?.valueChanges.subscribe(() => {
      this.calculateTotalAmount();
    });

    this.oilSaleForm.get('unitPrice')?.valueChanges.subscribe(() => {
      this.calculateTotalAmount();
    });

    // Setup supplier autocomplete filter
    this.setupSupplierAutocomplete();

    // Clear other field when one is selected
    this.setupFieldClearing();
  }

  /**
   * Sets up automatic field clearing to ensure only one entity (customer or supplier) is selected.
   * When a user selects a customer, the supplier field is automatically cleared and vice versa.
   */
  private setupFieldClearing(): void {
    // Clear supplier when customer is selected
    this.oilSaleForm.get('customerId')?.valueChanges.subscribe((customerId) => {
      if (customerId) {
        this.oilSaleForm.get('supplierId')?.setValue('');
      }
    });

    // Clear customer when supplier is selected
    this.oilSaleForm.get('supplierId')?.valueChanges.subscribe((supplierId) => {
      if (supplierId) {
        this.oilSaleForm.get('customerId')?.setValue('');
      }
    });
  }

  /**
   * Custom validator to ensure either customer or supplier is selected, but not both.
   * This implements the business rule that an oil sale must be associated with either
   * a customer (for sales) or a supplier (for purchases), but not both.
   */
  private customerOrSupplierRequired(control: AbstractControl): ValidationErrors | null {
    const customerId = control.get('customerId')?.value;
    const supplierId = control.get('supplierId')?.value;

    // Check if at least one is selected
    if (!customerId && !supplierId) {
      return { customerOrSupplierRequired: true };
    }

    // Check if both are selected (mutually exclusive)
    if (customerId && supplierId) {
      return { bothCustomerAndSupplierSelected: true };
    }

    return null;
  }

  private setupSupplierAutocomplete(): void {
    this.filteredSuppliers = this.oilSaleForm.get('supplierId')!.valueChanges.pipe(
      startWith(''),
      map((value) => this._filterSuppliers(this.suppliers, value))
    );
  }

  private _filterSuppliers(suppliers: SupplierType[], value: string | SupplierType): SupplierType[] {
    if (!value || typeof value === 'object') {
      return suppliers;
    }
    const filterValue = value.toLowerCase();
    return suppliers.filter(
      (supplier) =>
        supplier.supplierInfo.name.toLowerCase().includes(filterValue) || supplier.supplierInfo.lastname.toLowerCase().includes(filterValue)
    );
  }

  private checkEditMode(): void {
    this.oilSaleId = this.route.snapshot.paramMap.get('id') || undefined;
    if (this.oilSaleId) {
      this.isEditing = true;
      this.loadOilSale(this.oilSaleId);
    }
  }

  private loadOilSale(id: string): void {
    this.loading = true;
    this.oilSaleService.getOilSale(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const oilSale = response.data;
          this.oilSaleForm.patchValue({
            customerId: oilSale.customer?.id,
            supplierId: oilSale.supplier?.id,
            storageUnitId: oilSale.storageUnit?.id,
            quantity: oilSale.quantity,
            unitPrice: oilSale.unitPrice,
            currency: oilSale.currency,
            paymentMethod: oilSale.paymentMethod,
            saleDate: new Date(oilSale.saleDate),
            invoiceNumber: oilSale.invoiceNumber,
            description: oilSale.description
          });
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading oil sale:', error);
        this.snackBar.open('Error loading oil sale', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  private loadCustomers(): void {
    this.customerService.getAllCustomers().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.customers = Array.isArray(response.data) ? response.data : [response.data];
        }
      },
      error: (error) => {
        console.error('Error loading customers:', error);
      }
    });
  }

  private loadStorageUnits(): void {
    this.storageUnitsService.getAllStorageUnit().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.storageUnits = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading storage units:', error);
      }
    });
  }

  private loadSuppliers(): void {
    this.supplierService.getAllSuppliers().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.suppliers = Array.isArray(response.data) ? response.data : [response.data];
          this.setupSupplierAutocomplete();
        }
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
      }
    });
  }

  private calculateTotalAmount(): void {
    const quantity = this.oilSaleForm.get('quantity')?.value;
    const unitPrice = this.oilSaleForm.get('unitPrice')?.value;

    if (quantity && unitPrice) {
      const totalAmount = quantity * unitPrice;
      // Note: We don't set this in the form as it's calculated
      console.log('Total amount:', totalAmount);
    }
  }

  private createOilTransactionDTOFromForm(): any {
    if (this.oilSaleForm.valid) {
      const formValue = this.oilSaleForm.value;
      return (this.oilTransactionDTO = {
        transactionType: TransactionType.SALE,
        transactionState: TransactionState.PENDING,
        quantityKg: formValue.quantity,
        unitPrice: formValue.unitPrice,
        totalPrice: formValue.quantity * formValue.unitPrice
      });
    }
  }
}
