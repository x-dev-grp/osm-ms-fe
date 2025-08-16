import {Component} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {map, Observable, startWith} from "rxjs";
import {CustomerService} from "../../service/customer.service";
import {SupplierType} from "../../../shared/models/supplier-type";
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from "@angular/forms";
import {Customer} from "../../models/Customer";
import {SupplierTypeService} from "../../../shared/services/supplier.service";
import {WasteSaleService} from "../../service/wasteSale.service";
import {MatSelectModule} from "@angular/material/select";
import {MatSnackBar} from "@angular/material/snack-bar";
 import {CommonModule} from "@angular/common";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {MatNativeDateModule} from "@angular/material/core";
import {MatButtonModule} from "@angular/material/button";
import {MatAutocompleteModule} from "@angular/material/autocomplete";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {MatIconModule} from "@angular/material/icon";
import {MatTooltipModule} from "@angular/material/tooltip";
import {CardComponent} from "../../../theme/components/card/card.component";
import { Waste } from '../../../shared/models/Waste';
import { WasteSale } from '../../models/Waste.model';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
    selector: 'app-waste-add',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule,
    CardComponent
  ],
    standalone: true,
    templateUrl: './waste-add.component.html',
    styleUrl: './waste-add.component.scss'
})
export class WasteAddComponent {
  wasteId: string | undefined;
  isEditing: boolean = true;
  suppliers: SupplierType[];
  filteredSuppliers: Observable<SupplierType[]>;
  customers: Customer[] = [];
  filteredCustomers!: Observable<Customer[]>;
  wasteSaleForm: FormGroup;
  loading: boolean = false;
  totalPrice: number = 0;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private customerService: CustomerService,
        private supplierService: SupplierTypeService,
        private wasteSaleService: WasteSaleService,
        private fb: FormBuilder,
        private toast: ToastService
    ) {
    }

    ngOnInit() {
      this.loading = true;
      this.wasteId = this.route.snapshot.paramMap.get('id') ?? undefined;
      this.isEditing = this.wasteId !== null && this.wasteId !== 'new';
      this.loadSuppliers();
      this.loadCustomers();
      this.checkEditMode();
      this.buildForm();
      this.setupFormListeners();
    }

  // Fonctions d'affichage pour les autocomplete
  displayCustomerFn = (customer: Customer): string => {
    return customer ? `${customer.customerName} ${customer.customerLastName}` : '';
  };

  displaySupplierFn = (supplier: SupplierType): string => {
    return supplier ? `${supplier.supplierInfo.name} ${supplier.supplierInfo.lastname}` : '';
  };

  // Gestionnaires d'événements pour les autocomplete
  onCustomerSelected(event: any): void {
    // Réinitialiser le fournisseur si un client est sélectionné
    this.wasteSaleForm.patchValue({supplierId: ''});
  }

  onSupplierSelected(event: any): void {
    // Réinitialiser le client si un fournisseur est sélectionné
    this.wasteSaleForm.patchValue({customerId: ''});
  }

  onSubmit(): void {
    if (this.wasteSaleForm.valid) {
      this.loading = true;
      const formValue = this.wasteSaleForm.value;

      const wasteSale: WasteSale = {
        type: formValue.type,
        quantity: formValue.quantity,
        unitPrice: formValue.unitPrice,
        totalPrice: this.totalPrice,
        saleDate: formValue.saleDate,
        invoiceNumber: formValue.invoiceNumber,
        paid: formValue.paid,
        paymentDate: formValue.paymentDate,
        storageLocationCode: formValue.storageLocationCode,
        customer: formValue.customerId,
        supplier: formValue.supplierId,
        description: formValue.description,
        notes: formValue.notes
      };

      if (this.isEditing) {
        this.wasteSaleService.updateWasteSale(this.wasteId!, wasteSale).subscribe({
          next: (response) => {
            if (response.success) {
              this.toast.success('Vente de déchet modifiée avec succès');
              this.router.navigate(['/finance/waste-sales']);
            } else {
              this.toast.error('Erreur lors de la modification');
            }
            this.loading = false;
          },
          error: (error) => {
            console.error('Error updating waste sale:', error);
            this.toast.error('Erreur lors de la modification');
            this.loading = false;
          }
        });
      } else {
        this.wasteSaleService.createWasteSale(wasteSale).subscribe({
          next: (response) => {
            if (response.success) {
              this.toast.success('Vente de déchet créée avec succès');
              this.router.navigate(['/finance/waste-sales']);
            } else {
              this.toast.error('Erreur lors de la création');
            }
            this.loading = false;
          },
          error: (error) => {
            console.error('Error creating waste sale:', error);
            this.toast.error('Erreur lors de la création');
            this.loading = false;
          }
        });
      }
    }
    }

  onCancel(): void {
    this.router.navigate(['/finance/waste-sales']);
  }

  // Méthodes pour le Sale Summary
  getSelectedCustomer(): Customer | null {
    return this.wasteSaleForm.get('customerId')?.value || null;
  }

  getSelectedSupplier(): SupplierType | null {
    return this.wasteSaleForm.get('supplierId')?.value || null;
  }

  getWasteTypeLabel(): string {
    const type = this.wasteSaleForm.get('type')?.value;
    switch (type) {
      case 'MARGINE':
        return 'Margine';
      case 'POMACE':
        return 'Grignon';
      case 'VEGETAL_SOLIDS':
        return 'Solides végétaux';
      case 'OTHER':
        return 'Autre';
      default:
        return '';
    }
  }

  private buildForm(): void {
    this.wasteSaleForm = this.fb.group(
      {
        type: ['', Validators.required],
        customerId: [''],
        supplierId: [''],
        quantity: ['', [Validators.required, Validators.min(0.01)]],
        unitPrice: ['', [Validators.required, Validators.min(0.01)]],
        saleDate: [new Date(), Validators.required],
        invoiceNumber: [''],
        paid: [false],
        paymentDate: [null],
        storageLocationCode: [''],
        description: [''],
        notes: ['']
      },
      {validators: this.customerOrSupplierRequired}
    );
  }

  private setupFormListeners(): void {
    // Calculer le prix total automatiquement
    this.wasteSaleForm.valueChanges.subscribe(() => {
      const quantity = this.wasteSaleForm.get('quantity')?.value || 0;
      const unitPrice = this.wasteSaleForm.get('unitPrice')?.value || 0;
      this.totalPrice = quantity * unitPrice;
    });

    // Réinitialiser la date de paiement si non payé
    this.wasteSaleForm.get('paid')?.valueChanges.subscribe((paid) => {
      if (!paid) {
        this.wasteSaleForm.patchValue({paymentDate: null});
      }
    });
  }

  private customerOrSupplierRequired(control: AbstractControl): ValidationErrors | null {
    const customerId = control.get('customerId')?.value;
    const supplierId = control.get('supplierId')?.value;

    // Check if at least one is selected
    if (!customerId && !supplierId) {
      return {customerOrSupplierRequired: true};
    }

    // Check if both are selected (mutually exclusive)
    if (customerId && supplierId) {
      return {bothCustomerAndSupplierSelected: true};
    }

    return null;
  }

  private checkEditMode(): void {
    this.wasteId = this.route.snapshot.paramMap.get('id') || undefined;
    if (this.wasteId && this.wasteId !== 'new') {
      this.isEditing = true;
      this.loadWasteSale(this.wasteId);
    } else {
      this.loading = false;
    }
  }

  private loadCustomers(): void {
    this.customerService.getAllCustomers().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.customers = Array.isArray(response.data) ? response.data : [response.data];
          this.setupCustomerAutocomplete();
        }
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.toast.error('Erreur lors du chargement des clients');
      }
    });
  }

  private setupCustomerAutocomplete(): void {
    this.filteredCustomers = this.wasteSaleForm.get('customerId')!.valueChanges.pipe(
      startWith(''),
      map((value) => this._filterCustomers(this.customers, value))
    );
  }

  private _filterCustomers(customers: Customer[], value: string | Customer): Customer[] {
    if (!value || typeof value === 'object') {
      return customers;
    }
    const filterValue = value.toLowerCase();
    return this.customers.filter(c =>
      (`${c.customerName} ${c.customerLastName}`)
        .toLowerCase()
        .includes(filterValue)
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
        this.toast.error('Erreur lors du chargement des fournisseurs');
      }
    });
  }

  private setupSupplierAutocomplete(): void {
    this.filteredSuppliers = this.wasteSaleForm.get('supplierId')!.valueChanges.pipe(
      startWith(''),
      map((value) => this._filterSuppliers(this.suppliers, value))
    );
  }

  private loadWasteSale(id: string): void {
    this.loading = true;
    this.wasteSaleService.getWasteSale(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const wasteSale = response.data[0];
          this.wasteSaleForm.patchValue({
            type: wasteSale.type,
            customerId: wasteSale.customer?.id ? this.customers.find(c => c.id === wasteSale.customer.id) : null,
            supplierId: wasteSale.supplier?.id ? this.suppliers.find(s => s.id === wasteSale.supplier.id) : null,
            quantity: wasteSale.quantity,
            unitPrice: wasteSale.unitPrice,
            saleDate: new Date(wasteSale.saleDate),
            invoiceNumber: wasteSale.invoiceNumber,
            paid: wasteSale.paid,
            paymentDate: wasteSale.paymentDate ? new Date(wasteSale.paymentDate) : null,
            storageLocationCode: wasteSale.storageLocationCode,
            description: wasteSale.description,
            notes: wasteSale.notes
          });
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading waste sale:', error);
        this.toast.error('Erreur lors du chargement de la vente de déchet');
        this.loading = false;
      }
    });
  }
}
