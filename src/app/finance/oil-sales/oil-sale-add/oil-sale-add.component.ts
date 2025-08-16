import { Component, DestroyRef, inject, OnInit, output } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { OilSaleService } from '../../service/oil-sale.service';
import { CustomerService } from '../../service/customer.service';
import { OilSale, OilSaleStatus, QualityGrades } from '../../models/oil-sale.model';
import { Customer } from '../../models/Customer';
import { StorageUnitDtoService } from '../../../shared/services/storage.service';
import { StorageUnitDto } from '../../../shared/models/StorageUnitDto';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { SupplierTypeService } from '../../../shared/services/supplier.service';
import { SupplierType } from '../../../shared/models/supplier-type';
import { map, Observable, startWith, tap } from 'rxjs';
import { TransactionState, TransactionType } from '../../../shared/models/OilTransaction';
import { OilTransactionService } from '../../../shared/services/OilTransactionService';
import { CardComponent } from '../../../theme/components/card/card.component';
import { SearchData } from '../../../shared/models/advanced-search/searchData';
import { SearchOperation } from '../../../shared/models/advanced-search/searchOperation';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdvancedSearchService } from '../../../shared/services/advanced-serach.service';
import { OilContainer } from '../../../shared/models/oil-container';
import { OptionsScrollDirective } from '../../../shared/directives/options-scroll.directive';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { ToastService } from '../../../shared/services/toast.service';

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
    MatAutocompleteTrigger,
    CardComponent,
    OptionsScrollDirective,
    MatCheckbox,
    MatSlideToggle
  ]
})
export class OilSaleAddComponent implements OnInit {
  readonly destroyRef = inject(DestroyRef);
  oilSaleForm!: FormGroup;
  loading = false;
  isEditing = false;
  oilSaleId?: string;
  customers: Customer[] = [];
  storageUnits: StorageUnitDto[] = [];
  suppliers: SupplierType[] = [];
  grades = Object.values(QualityGrades);
  // Autocomplete filtered options
  filteredSuppliers: Observable<SupplierType[]>;
  selected = output<any>();
  protected containerList: OilContainer[];
  protected readonly scroll = scroll;
  private oilTransactionDTO: any;
  filteredCustomers!: Observable<Customer[]>;

  constructor(
    private fb: FormBuilder,
    private oilSaleService: OilSaleService,
    private customerService: CustomerService,
    private route: ActivatedRoute,
    private storageUnitsService: StorageUnitDtoService,
    private supplierService: SupplierTypeService,
    private oiltransactionService: OilTransactionService,
    private _searchService: AdvancedSearchService,
    private router: Router,
    private toast: ToastService
  ) {
    this.filteredSuppliers = new Observable<SupplierType[]>();
  }

  get containerSelections(): FormArray {
    return this.oilSaleForm.get('containerSelections') as FormArray;
  }

  ngOnInit(): void {
    this.buildForm();
    this.loadCustomers();
    this.loadStorageUnits();
    this.loadSuppliers();
    this.checkEditMode();
    const searchData: SearchData = {
      page: 0,
      searchData: {
        operation: SearchOperation.AND,
        search: {
          isDeleted: {
            equalValue: false
          }
        }
      }
    };
    this._searchService
      .search(searchData, 'production/oil_container')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((res) => {
          this.containerList = res?.data;
          console.log(this.containerList);
        })
      )
      .subscribe();
    // Re-run the containerCount validator whenever quantity or container changes
    this.oilSaleForm.get('quantity')!.valueChanges.subscribe(() => this.oilSaleForm.get('containerCount')!.updateValueAndValidity());
    this.oilSaleForm.get('container')!.valueChanges.subscribe(() => this.oilSaleForm.get('containerCount')!.updateValueAndValidity());
    this.oilSaleForm.get('quantity')!.valueChanges.subscribe(() => this.distributeCounts());
  }
  /** how many containers of the selected capacity you need to hold the quantity */
  neededContainers(): number {
    const qty = +this.oilSaleForm.get('quantity')!.value;
    const c = this.oilSaleForm.get('container')!.value;
    if (!qty || !c?.capacityInLiters) return 0;
    return Math.ceil(qty / c.capacityInLiters);
  }

  /** validator: containerCount >= neededContainers() */
  minContainerCountValidator(control: AbstractControl) {
    if (!this.oilSaleForm) return null;
    const val = +control.value;
    const min = this.neededContainers();
    return val >= min ? null : { minContainers: { required: min, actual: val } };
  }

  displayWith = (option: any): string | null => {
    if (option) {
      return option?.capacityInLiters + 'L ' + option?.name;
    }
    return null;
  };

  displaySupplierFn(supplier: SupplierType): string {
    if (!supplier) return '';
    const parts = [
      supplier.supplierInfo?.name?.trim(),
      supplier.supplierInfo?.lastname?.trim(),
    ].filter(part => !!part);
    return parts.join(' ');
  }
  /** how to display a Customer in the input */
  displayCustomerFn(customer: Customer | null): string {
    if (!customer) return '';
    const parts = [
      customer.customerName?.trim(),
      customer.customerLastName?.trim(),
    ].filter(part => !!part);
    return parts.join(' ');
  }
  onSubmit(): void {
    if (this.oilSaleForm.valid) {
      this.loading = true;
      const formValue = this.oilSaleForm.value;

      // Calculate total amount
      const totalAmount = formValue.quantity * formValue.unitPrice;

      if (this.isEditing && this.oilSaleId) {
        const updateDto: any = {
          id: this.oilSaleId,
          customerId: formValue.customerId || null,
          supplierId: formValue.supplierId?.id || formValue.supplierId || null,
          storageUnitId: formValue.storageUnitId || null,
          oilTransactionUUID: '',
          paidAmount: 0,
          unpaidAmount: totalAmount,
          quantity: formValue.quantity || null,
          qualityGrade: formValue.qualityGrade || null,
          unitPrice: formValue.unitPrice || null,
          currency: formValue.currency || null,
          paymentMethod: formValue.paymentMethod || null,
          saleDate: formValue.saleDate.toISOString() || null,
          invoiceNumber: formValue.invoiceNumber || null,
          status: OilSaleStatus.PENDING || null,
          description: formValue.description || null
        };

        this.oilSaleService.updateOilSale(this.oilSaleId, updateDto).subscribe({
          next: (response) => {
            if (response.success) {
              this.toast.success('Oil sale updated successfully');
              this.router.navigate(['/finance/oil-sales']);
            } else {
              this.toast.error(response.message || 'Error updating oil sale');
            }
            this.loading = false;
          },
          error: (error) => {
            console.error('Error updating oil sale:', error);
            this.toast.error('Error updating oil sale');
            this.loading = false;
          }
        });
      } else {
        const createDto: OilSale = {
          customer: formValue.customerId || null,
          supplier: formValue.supplierId || null,
          storageUnit: formValue.storageUnitId || null,
          quantity: formValue.quantity || null,
          unitPrice: formValue.unitPrice || null,
          oilTransactionUUID: '',
          paidAmount: 0,
          unpaidAmount: totalAmount,
          currency: formValue.currency || null,
          paymentMethod: formValue.paymentMethod || null,
          saleDate: formValue.saleDate.toISOString() || null,
          invoiceNumber: formValue.invoiceNumber || null,
          qualityGrade: formValue.qualityGrade || null,
          description: formValue.description || null,
          totalAmount: formValue?.unitPrice * formValue?.quantity,
          status: OilSaleStatus.PENDING || null
        };

        this.oilSaleService.createOilSale(createDto).subscribe({
          next: (response) => {
            if (response.success) {

              this.toast.success('Oil sale created successfully');

              this.router.navigate(['/finance/oil-sales']);
            } else {
              this.toast.error(response.message || 'Error creating oil sale');
            }
            this.loading = false;
          },
          error: (error) => {
            console.error('Error creating oil sale:', error);
            this.toast.error('Error creating oil sale');
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
    this.router.navigate(['/finance/oil-sale']);
  }

  getTotalOilAmount(): number {
    const quantity = this.oilSaleForm.get('quantity')?.value || 0;
    const unitPrice = this.oilSaleForm.get('unitPrice')?.value || 0;
    // base sale amount
    return quantity * unitPrice;
  }

  public getTotalAmount(): number {
    let totalOIl = this.getTotalOilAmount();
    const containerCost = this.totalContainerCost();
    return totalOIl + containerCost;
  }

  getSelectedCustomer(): Customer | undefined {
    const customerId = this.oilSaleForm.get('customerId')?.value;
    if (typeof customerId === 'object' && customerId !== null) {
      return customerId;
    }
    return this.customers.find((customer) => customer.id === customerId);
  }

  getSelectedSupplier(): SupplierType | undefined {
    const supplierId = this.oilSaleForm.get('supplierId')?.value;
    if (typeof supplierId === 'object' && supplierId !== null) {
      return supplierId;
    }
    return this.suppliers.find((supplier) => supplier.id === supplierId);
  }



  totalCapacity(): number {
    return this.containerSelections.controls.reduce((sum, grp) => {
      const c = grp.get('container')!.value;
      const count = grp.get('count')!.value || 0;
      return sum + (c.capacityInLiters ?? c.capacity) * count;
    }, 0);
  }

  /**
   * Quantity minus what's already allocated in containers
   */
  leftoverQuantity(): number {
    // qty minus what we've allocated—clamped to zero
    const rem = (this.oilSaleForm.get('quantity')!.value || 0) - this.totalCapacity();
    return rem > 0 ? rem : 0;
  }

  onContainerSelectionChange(event: MatSelectChange): void {
    const selected: OilContainer[] = event.value;
    const fa = this.containerSelections;

    selected.forEach((c) => {
      if (!fa.controls.find((g) => g.value.container.id === c.id)) {
        fa.push(
          this.fb.group({
            container: [c],
            count: [0]
          })
        );
      }
    });

    // ➖ Remove unselected
    fa.controls.filter((g) => !selected.some((c) => c.id === g.value.container.id)).forEach((g) => fa.removeAt(fa.controls.indexOf(g)));

    // 🔢 Recompute counts
    this.distributeCounts();
  }

  public totalContainerCost(): number {
    return this.containerSelections.controls.reduce((sum, ctrl) => {
      const container = ctrl.get('container')!.value as OilContainer;
      const count = (ctrl.get('count')!.value as number) || 0;
      const price = (container.sellingPrice as number) || 0;
      return sum + price * count;
    }, 0);
  }

  private buildForm(): void {
    this.oilSaleForm = this.fb.group(
      {
        customerId: [''],
        supplierId: [''],
        quantity: ['', [Validators.required, Validators.min(0.01)]],
        unitPrice: ['', [Validators.required, Validators.min(0.01)]],
        saleDate: [new Date(), Validators.required],
        qualityGrade: ['', Validators.required],
        description: [''],
        showContainers: [false],
        container: [null],
        containerCount: [null, [this.minContainerCountValidator.bind(this)]]
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
    this.oilSaleForm.addControl('selectedContainers', this.fb.control([]));
    this.oilSaleForm.addControl('containerSelections', this.fb.array([]));
    // Setup supplier autocomplete filter
    this.setupSupplierAutocomplete();
    this.setupCustomerAutocomplete();

    // Clear other field when one is selected
    this.setupFieldClearing();
    this.oilSaleForm
      .get('selectedContainers')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((selected: OilContainer[]) => this.onContainerSelectionChange({ value: selected } as MatSelectChange));
  }

  private distributeCounts(): void {
    const qty = this.oilSaleForm.get('quantity')!.value || 0;
    let remaining = qty;
    const ctrls = this.containerSelections.controls;

    // Sort by capacity descending so big containers get used first
    const sorted = [...ctrls].sort((a, b) => {
      const capA = a.get('container')!.value.capacityInLiters as number;
      const capB = b.get('container')!.value.capacityInLiters as number;
      return capB - capA;
    });

    sorted.forEach((ctrl, i) => {
      const cap = ctrl.get('container')!.value.capacityInLiters as number;
      let count: number;

      if (i < sorted.length - 1) {
        count = Math.floor(remaining / cap);
      } else {
        count = cap > 0 ? Math.ceil(remaining / cap) : 0;
      }

      ctrl.get('count')!.setValue(count, { emitEvent: false });
      remaining -= count * cap;
    });
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
  private setupCustomerAutocomplete(): void {
    this.filteredCustomers = this.oilSaleForm.get('customerId')!.valueChanges.pipe(
      startWith(''),
      map((value) => this._filterCustomers(this.customers, value))
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
  } private _filterCustomers(customers1: Customer[], value: string | Customer): Customer[] {
    if (!value || typeof value === 'object') {
      return customers1;
    }
    const filterValue = value.toLowerCase();
    return this.customers.filter(c =>
      (`${c.customerName} ${c.customerLastName}`)
        .toLowerCase()
        .includes(filterValue)
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
          const oilSale = response.data[0];
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
        this.toast.error('Error loading oil sale');
        this.loading = false;
      }
    });
  }

  private loadCustomers(): void {
    this.customerService.getAllCustomers().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.customers = Array.isArray(response.data) ? response.data : [response.data];
        this.setupCustomerAutocomplete()}
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
