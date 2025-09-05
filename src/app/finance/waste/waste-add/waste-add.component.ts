import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {map, Observable, startWith} from "rxjs";
 import {SupplierType} from "../../../shared/models/supplier-type";
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from "@angular/forms";
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
 import { WasteSale } from '../../models/Waste.model';
import { ToastService } from '../../../shared/services/toast.service';
import { Currency } from '../../models/financial-transaction.model';

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
export class WasteAddComponent implements OnInit{
  wasteId: string | null;
  isEditing: boolean = false;
  suppliers: SupplierType[];
  filteredSuppliers: Observable<SupplierType[]>;

  wasteSaleForm: FormGroup;
  loading: boolean = false;
  totalPrice: number = 0;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
         private supplierService: SupplierTypeService,
        private wasteSaleService: WasteSaleService,
        private fb: FormBuilder,
        private toast: ToastService
    ) {
        console.log('WasteAddComponent constructor called');
        console.log('Route params:', this.route.snapshot.paramMap.get('id'));
    }

    ngOnInit() {
      console.log('ngOnInit called');
      this.wasteId = this.route.snapshot.paramMap.get('id') ?? null;
      this.isEditing = this.wasteId !== null;
      console.log('wasteId:', this.wasteId, 'isEditing:', this.isEditing);

      this.buildForm();
      this.setupFormListeners();

      this.loading = true;

      // Load suppliers first, then load waste sale data if editing
      this.loadSuppliers().then(() => {
        console.log('Suppliers loaded successfully, count:', this.suppliers?.length);
        if (this.isEditing) {
          console.log('Loading waste sale for editing...');
          this.loadWasteSale(this.wasteId!);
        } else {
          console.log('New waste sale mode');
          this.loading = false;
        }
      }).catch((error) => {
        console.error('Error loading suppliers:', error);
        this.loading = false;
      });
    }

  displaySupplierFn = (supplier: SupplierType): string => {
    return supplier ? `${supplier.supplierInfo.name} ${supplier.supplierInfo.lastname}` : '';
  };

  // Gestionnaire d'événement pour l'autocomplete
  onSupplierSelected(event: any): void {
    // Optionnel : ajouter une logique si nécessaire
    console.log('Fournisseur sélectionné:', event.option.value);
  }

  onSubmit(): void {
    if (this.wasteSaleForm.valid) {
      this.loading = true;
      const formValue = this.wasteSaleForm.value;

      const wasteSale: WasteSale = {
        currency: formValue.currency || null,
        paidAmount: 0,
        unpaidAmount:  this.totalPrice,
        type: formValue.type,
        paymentMethod: formValue.paymentMethod || null,
        quantityInKg: formValue.quantity,
        unitPrice: formValue.unitPrice,
        totalPrice: this.totalPrice,
        saleDate: formValue.saleDate,
        invoiceNumber: formValue.invoiceNumber,
        paid: formValue.paid,
        paymentDate: formValue.paymentDate,
        storageLocationCode: formValue.storageLocationCode,
         supplier: formValue.supplierId,
        description: formValue.description,
        notes: formValue.notes
      };

      if (this.isEditing) {
        this.wasteSaleService.updateWasteSale(this.wasteId!, wasteSale).subscribe({
          next: (response) => {
            if (response.success) {
              this.toast.success();
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
              this.toast.success();
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
        return 'Non spécifié';
    }
  }

  getWasteTypeIcon(): string {
    const type = this.wasteSaleForm.get('type')?.value;
    switch (type) {
      case 'MARGINE':
        return 'eco';
      case 'POMACE':
        return 'grain';
      case 'VEGETAL_SOLIDS':
        return 'grass';
      case 'OTHER':
        return 'help_outline';
      default:
        return 'category';
    }
  }

  private buildForm(): void {
    this.wasteSaleForm = this.fb.group({
      type: ['', Validators.required],
      supplierId: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(0.01)]],
      unitPrice: ['', [Validators.required, Validators.min(0.01)]],
      saleDate: [new Date(), Validators.required],
      invoiceNumber: [''],
      paid: [false],
      paymentDate: [null],
      storageLocationCode: [''],
      description: [''],
      notes: ['']
    });
  }

  private setupFormListeners(): void {
    // Calculer le prix total automatiquement
    this.wasteSaleForm.valueChanges.subscribe(() => {
      const quantity = this.wasteSaleForm.get('quantity')?.value || 0;
      const unitPrice = this.wasteSaleForm.get('unitPrice')?.value || 0;
      this.totalPrice = quantity * unitPrice;
    });

    // Gérer la validation de la date de paiement
    this.wasteSaleForm.get('paid')?.valueChanges.subscribe((paid) => {
      const paymentDateControl = this.wasteSaleForm.get('paymentDate');
      if (paid) {
        paymentDateControl?.setValidators([Validators.required]);
      } else {
        paymentDateControl?.clearValidators();
        paymentDateControl?.setValue(null);
      }
      paymentDateControl?.updateValueAndValidity();
    });
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

  private loadSuppliers(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.supplierService.getAllSuppliers().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.suppliers = Array.isArray(response.data) ? response.data : [response.data];
            this.setupSupplierAutocomplete();
            resolve();
          } else {
            this.toast.error('Aucun fournisseur trouvé');
            reject(new Error('No suppliers found'));
          }
        },
        error: (error) => {
          console.error('Error loading suppliers:', error);
          this.toast.error('Erreur lors du chargement des fournisseurs');
          reject(error);
        }
      });
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
          const wasteSale = Array.isArray(response.data) ? response.data[0] : response.data;
          console.log('Loaded waste sale:', wasteSale);

          // Find the supplier in the loaded suppliers list
          let selectedSupplier = null;
          if (wasteSale.supplier) {
            let supplierId: string | undefined;

            if (typeof wasteSale.supplier === 'object' && wasteSale.supplier && 'id' in wasteSale.supplier) {
              supplierId = wasteSale.supplier.id;
            } else if (typeof wasteSale.supplier === 'string') {
              supplierId = wasteSale.supplier;
            }

            if (supplierId) {
              selectedSupplier = this.suppliers.find(s => s.id === supplierId);
            }
          }

          this.wasteSaleForm.patchValue({
            type: wasteSale.type,
            supplierId: selectedSupplier,
            quantity: wasteSale.quantityInKg,
            unitPrice: wasteSale.unitPrice,
            saleDate: new Date(wasteSale.saleDate),
            invoiceNumber: wasteSale.invoiceNumber || '',
            paid: wasteSale.paid || false,
            paymentDate: wasteSale.paymentDate ? new Date(wasteSale.paymentDate) : null,
            storageLocationCode: wasteSale.storageLocationCode || '',
            description: wasteSale.description || '',
            notes: wasteSale.notes || ''
          });

          console.log('Form patched with values:', this.wasteSaleForm.value);
        } else {
          this.toast.error('Vente de déchet introuvable');
          this.router.navigate(['/finance/waste-sales']);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading waste sale:', error);
        this.toast.error('Erreur lors du chargement de la vente de déchet');
        this.loading = false;
        this.router.navigate(['/finance/waste-sales']);
      }
    });
  }
}
