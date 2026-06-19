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
import { OilSale, OilSaleStatus, QualityGrades } from '../../models/oil-sale.model';
import { StorageUnitDtoService } from '../../../shared/services/storage.service';
import { StorageUnitDto } from '../../../shared/models/StorageUnitDto';
import { MatAutocomplete, MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { SupplierTypeService } from '../../../shared/services/supplier.service';
import { SupplierType } from '../../../shared/models/supplier-type';
import { map, Observable, startWith, Subscription, tap } from 'rxjs';
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
import { MatDialog } from '@angular/material/dialog';
import { SupplierAddComponent } from '../../../reception/suppliers/supplier-add/supplier-add.component';
import { mapOilSaleToCreateRequest, toLocalDateTimeString } from './oil-sale.mapper';

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
  storageUnits: StorageUnitDto[] = [];
  suppliers: SupplierType[] = [];
  grades = Object.values(QualityGrades);
  filteredSuppliers$: Observable<SupplierType[]>;
  selected = output<any>();
  errorMessage = '';
  protected containerList: OilContainer[] = [];
  protected readonly scroll = scroll;
  private oilTransactionDTO: any;
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private oilSaleService: OilSaleService,
    private route: ActivatedRoute,
    private storageUnitsService: StorageUnitDtoService,
    private supplierService: SupplierTypeService,
    private oilTransactionService: OilTransactionService,
    private _searchService: AdvancedSearchService,
    private router: Router,
    private toast: ToastService,
    private dialog: MatDialog
  ) {
    this.filteredSuppliers$ = new Observable<SupplierType[]>();
  }

  get containerSelections(): FormArray {
    return this.oilSaleForm.get('containerSelections') as FormArray;
  }

  ngOnInit(): void {
    this.buildForm();
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
          this.containerList = (res?.data ?? []).filter((c: OilContainer) => (c.stockQuantity ?? 0) > 0);
        })
      )
      .subscribe();

    // Auto-distribute counts when quantity changes
    this.oilSaleForm
      .get('quantity')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.distributeCounts());
  }

  /** Check if a storage unit has enough oil for the requested quantity */
  isStorageUnitDisabled(storageUnit: StorageUnitDto): boolean {
    const requestedQuantity = this.oilSaleForm.get('quantity')?.value || 0;
    return storageUnit.currentVolume < requestedQuantity;
  }

  /** Get tooltip message for disabled storage units */
  getStorageUnitTooltip(storageUnit: StorageUnitDto): string {
    const requestedQuantity = this.oilSaleForm.get('quantity')?.value || 0;
    if (this.isStorageUnitDisabled(storageUnit)) {
      return `Insufficient oil: ${storageUnit.currentVolume}L available, ${requestedQuantity}L needed`;
    }
    return '';
  }

  displaySupplierFn(item: SupplierType | string | null): string {
    if (!item || typeof item === 'string') return item ?? '';
    return `${item.name ?? ''} ${item.lastname ?? ''}`.trim();
  }

  onSubmit(): void {
    // Mark all fields as touched to show validation errors
    this.oilSaleForm.markAllAsTouched();

    if (this.oilSaleForm.invalid) {
      this.toast.warning('OIL_SALES.FORM.VALIDATION.INCOMPLETE_FORM');
      return;
    }

    const deliveryAddress = this.resolveDeliveryAddress();
    if (!deliveryAddress) {
      this.toast.warning('OIL_SALES.FORM.VALIDATION.ADDRESS_REQUIRED');
      return;
    }

    // Validate storage unit has enough oil
    const selectedStorageUnit = this.oilSaleForm.get('storageUnit')?.value;
    if (selectedStorageUnit && this.isStorageUnitDisabled(selectedStorageUnit)) {
      this.toast.error('OIL_SALES.MESSAGES.ERROR.INSUFFICIENT_STORAGE');
      return;
    }

    this.loading = true;
    const formValue = this.oilSaleForm.getRawValue();

    // Calculate total amount including container costs
    const oilAmount = formValue.quantity * formValue.unitPrice;
    const containerCost = this.totalContainerCost();
    const totalAmount = oilAmount + containerCost;

    // Prepare container data for submission
    const containers = this.containerSelections.controls.map((ctrl) => ({
      id: ctrl.get('container')?.value.id,
      count: ctrl.get('count')?.value || 0
    }));

    // Use form date or current date
    const saleDateValue = formValue.saleDate instanceof Date
      ? toLocalDateTimeString(formValue.saleDate)
      : (formValue.saleDate ? toLocalDateTimeString(formValue.saleDate) : toLocalDateTimeString(new Date()));

    if (this.isEditing && this.oilSaleId) {
      const updateDto: OilSale = {
        id: this.oilSaleId,
        supplier: formValue.supplier,
        storageUnit: formValue.storageUnit,
        oilTransactionUUID: '',
        paidAmount: 0,
        unpaidAmount: totalAmount,
        quantity: formValue.quantity,
        qualityGrade: formValue.qualityGrade,
        unitPrice: formValue.unitPrice,
        currency: formValue.currency || 'TND',
        paymentMethod: formValue.paymentMethod || 'CASH',
        saleDate: saleDateValue,
        status: OilSaleStatus.PENDING,
        description: formValue.description,
        deliveryAddress,
        totalAmount: totalAmount,
        containerSales: containers
      };

      this.oilSaleService.updateOilSale(this.oilSaleId, updateDto).subscribe({
        next: (response) => {
          if (response.success) {
            this.toast.success('OIL_SALES.MESSAGES.SUCCESS.UPDATE');
            this.router.navigate(['/finance/oil-sales']);
          } else {
            this.toast.error(response.message || 'OIL_SALES.MESSAGES.ERROR.UPDATE');
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error updating oil sale:', error);
          this.toast.error('OIL_SALES.MESSAGES.ERROR.UPDATE');
          this.loading = false;
        }
      });
    } else {
      const createDto: OilSale = {
        supplier: formValue.supplier,
        storageUnit: formValue.storageUnit,
        quantity: formValue.quantity,
        unitPrice: formValue.unitPrice,
        oilTransactionUUID: '',
        paidAmount: 0,
        unpaidAmount: totalAmount,
        currency: formValue.currency || 'TND',
        paymentMethod: formValue.paymentMethod || 'CASH',
        saleDate: saleDateValue,
        qualityGrade: formValue.qualityGrade,
        description: formValue.description,
        deliveryAddress,
        totalAmount: totalAmount,
        status: OilSaleStatus.PENDING,
        containerSales: containers
      };

      const payload = mapOilSaleToCreateRequest(createDto);

      this.oilSaleService.createOilSale(payload).subscribe({
        next: (response) => {
          if (response.success) {
            this.toast.success('OIL_SALES.MESSAGES.SUCCESS.ADD');
            this.router.navigate(['/finance/oil-sales']);
          } else {
            this.toast.error(response.message || 'OIL_SALES.MESSAGES.ERROR.ADD');
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error creating oil sale:', error);
          this.toast.error('OIL_SALES.MESSAGES.ERROR.ADD');
          this.loading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/finance/oil-sales']);
  }

  getTotalOilAmount(): number {
    const quantity = this.oilSaleForm.get('quantity')?.value || 0;
    const unitPrice = this.oilSaleForm.get('unitPrice')?.value || 0;
    return quantity * unitPrice;
  }

  public getTotalAmount(): number {
    const totalOil = this.getTotalOilAmount();
    const containerCost = this.totalContainerCost();
    return totalOil + containerCost;
  }

  getSelectedSupplier(): SupplierType | undefined {
    const supplier = this.oilSaleForm.get('supplier')?.value;
    if (supplier && typeof supplier === 'object') {
      return supplier;
    }
    return undefined;
  }

  totalCapacity(): number {
    return this.containerSelections.controls.reduce((sum, grp) => {
      const c = grp.get('container')!.value;
      const count = grp.get('count')!.value || 0;
      return sum + (c.capacityInLiters ?? c.capacity) * count;
    }, 0);
  }

  leftoverQuantity(): number {
    const rem = (this.oilSaleForm.get('quantity')!.value || 0) - this.totalCapacity();
    return rem > 0 ? rem : 0;
  }

  onContainerSelectionChange(event: MatSelectChange): void {
    const selected: OilContainer[] = event.value;
    const fa = this.containerSelections;

    // Add new containers
    selected.forEach((c) => {
      if (!fa.controls.find((g) => g.get('container')!.value.id === c.id)) {
        fa.push(
          this.fb.group({
            container: [c],
            count: [0, [Validators.min(0)]]
          })
        );
      }
    });

    // Remove deselected containers
    fa.controls
      .filter((g) => !selected.some((c) => c.id === g.get('container')!.value.id))
      .forEach((g) => fa.removeAt(fa.controls.indexOf(g)));

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

  onSupplierSelected(ev: MatAutocompleteSelectedEvent) {
    const selected: SupplierType = ev.option.value;
    const ctrl = this.oilSaleForm.get('supplier')!;
    ctrl.setValue(selected);
    ctrl.updateValueAndValidity();
    this.syncDeliveryAddressFromSupplier(selected);
  }

  selectActiveOption(auto: MatAutocomplete, trig: any) {
    const active = auto.options?.find((o) => o.active);
    if (active) {
      active.select();
      trig.closePanel();
    }
  }

  markSupplierTouched() {
    const ctrl = this.oilSaleForm.get('supplier')!;
    ctrl.markAsTouched();
    ctrl.updateValueAndValidity({ onlySelf: true });
  }

  openAddSupplierDialog(): void {
    const dialogRef = this.dialog.open(SupplierAddComponent, SupplierAddComponent.dialogConfig);

    dialogRef.afterClosed().subscribe((newSupplier) => {
      if (newSupplier) {
        this.suppliers = [...this.suppliers, newSupplier];
        const supplierCtrl = this.oilSaleForm.get('supplier');
        supplierCtrl?.setValue(newSupplier);
        supplierCtrl?.updateValueAndValidity();
        this.syncDeliveryAddressFromSupplier(newSupplier);
      }
    });
  }

  private buildForm(): void {
    this.oilSaleForm = this.fb.group({
      supplier: [null, [Validators.required, this.requireSupplierSelection()]],
      quantity: ['', [Validators.required, Validators.min(0.01)]],
      storageUnit: [null, Validators.required],
      unitPrice: ['', [Validators.required, Validators.min(0.01)]],
      qualityGrade: ['', Validators.required],
      saleDate: [new Date(), Validators.required],
      currency: ['TND'],
      paymentMethod: ['CASH'],
      description: [''],
      useClientAddress: [true],
      deliveryAddress: [''],
      showContainers: [false],
      selectedContainers: [[]],
      containerSelections: this.fb.array([])
    });

    // Setup reactive changes
    this.oilSaleForm
      .get('quantity')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.calculateTotalAmount();
        // Reset storage unit if insufficient
        const currentStorageUnit = this.oilSaleForm.get('storageUnit')?.value;
        if (currentStorageUnit && this.isStorageUnitDisabled(currentStorageUnit)) {
          this.oilSaleForm.get('storageUnit')?.setValue(null);
          this.toast.warning('OIL_SALES.MESSAGES.WARNING.STORAGE_RESET');
        }
      });

    this.oilSaleForm
      .get('unitPrice')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.calculateTotalAmount());

    this.oilSaleForm
      .get('selectedContainers')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((selected: OilContainer[]) => this.onContainerSelectionChange({ value: selected } as MatSelectChange));

    this.oilSaleForm
      .get('useClientAddress')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateDeliveryAddressState());

    this.setupSupplierAutocomplete();
  }

  private syncDeliveryAddressFromSupplier(supplier: SupplierType | null | undefined): void {
    const hasAddress = !!(supplier?.address?.trim());
    this.oilSaleForm.patchValue(
      {
        useClientAddress: hasAddress,
        deliveryAddress: hasAddress ? supplier!.address!.trim() : ''
      },
      { emitEvent: false }
    );
    this.updateDeliveryAddressState();
  }

  private updateDeliveryAddressState(): void {
    const useClient = !!this.oilSaleForm.get('useClientAddress')?.value;
    const supplier = this.getSelectedSupplier();
    const addressCtrl = this.oilSaleForm.get('deliveryAddress')!;

    if (useClient) {
      const clientAddress = supplier?.address?.trim() ?? '';
      addressCtrl.setValue(clientAddress, { emitEvent: false });
      addressCtrl.disable({ emitEvent: false });
    } else {
      addressCtrl.enable({ emitEvent: false });
    }
  }

  private resolveDeliveryAddress(): string | undefined {
    const raw = this.oilSaleForm.getRawValue();
    if (raw.useClientAddress) {
      return raw.supplier?.address?.trim() || undefined;
    }
    return raw.deliveryAddress?.trim() || undefined;
  }

  private distributeCounts(): void {
    const qty = this.oilSaleForm.get('quantity')!.value || 0;
    let remaining = qty;
    const ctrls = this.containerSelections.controls;

    if (ctrls.length === 0) return;

    // Sort by capacity descending (largest first)
    const sorted = [...ctrls].sort((a, b) => {
      const capA = a.get('container')!.value.capacityInLiters as number;
      const capB = b.get('container')!.value.capacityInLiters as number;
      return capB - capA;
    });

    sorted.forEach((ctrl, i) => {
      const cap = ctrl.get('container')!.value.capacityInLiters as number;
      let count: number;

      if (i < sorted.length - 1) {
        // Not the last container: use floor
        count = Math.floor(remaining / cap);
      } else {
        // Last container: use ceil to get all remaining
        count = cap > 0 ? Math.ceil(remaining / cap) : 0;
      }

      ctrl.get('count')!.setValue(count, { emitEvent: false });
      remaining -= count * cap;
    });
  }

  private setupSupplierAutocomplete(): void {
    const supplierCtrl = this.oilSaleForm.get('supplier')!;
    this.filteredSuppliers$ = supplierCtrl.valueChanges.pipe(
      startWith(''),
      map((val) => (typeof val === 'string' ? val : this.displaySupplierFn(val))),
      map((text) => {
        const q = (text ?? '').trim().toLowerCase();
        if (!q) return this.suppliers;
        return this.suppliers.filter((s) => this.containsSupplier(s, q));
      })
    );
  }

  private containsSupplier(s: SupplierType, q: string): boolean {
    const n = (s.name ?? '').toLowerCase();
    const l = (s.lastname ?? '').toLowerCase();
    return n.includes(q) || l.includes(q);
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
    const sub = this.oilSaleService.getOilSale(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const oilSale = response.data[0];
          const matchedSupplier = this.suppliers.find((s) => s.id === oilSale.supplier?.id) || null;

          const containerSelections = this.fb.array(
            (oilSale.containerSales || []).map((c: any) =>
              this.fb.group({
                container: [this.containerList.find((container) => container.id === c.id) || null],
                count: [c.count || 0, [Validators.min(0)]]
              })
            )
          );

          this.oilSaleForm.patchValue({
            supplier: matchedSupplier,
            storageUnit: this.storageUnits.find((u) => u.id === oilSale.storageUnit?.id) || null,
            quantity: oilSale.quantity,
            unitPrice: oilSale.unitPrice,
            qualityGrade: oilSale.qualityGrade,
            saleDate: oilSale.saleDate ? new Date(oilSale.saleDate) : new Date(),
            currency: oilSale.currency || 'TND',
            paymentMethod: oilSale.paymentMethod || 'CASH',
            description: oilSale.description,
            useClientAddress: !oilSale.deliveryAddress && !!matchedSupplier?.address,
            deliveryAddress: oilSale.deliveryAddress || matchedSupplier?.address || '',
            selectedContainers: (oilSale.containerSales || []).map((c: any) =>
              this.containerList.find((container) => container.id === c.id)
            )
          });

          this.updateDeliveryAddressState();

          this.oilSaleForm.setControl('containerSelections', containerSelections);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading oil sale:', error);
        this.toast.error('OIL_SALES.MESSAGES.ERROR.LOAD');
        this.loading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  private loadStorageUnits(): void {
    const sub = this.storageUnitsService.getAllStorageUnit().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.storageUnits = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading storage units:', error);
        this.toast.error('CONTROLE_QUALITE.STORAGE_UNIT.MESSAGES.SELECTION_ERROR');
      }
    });
    this.subscriptions.push(sub);
  }

  private loadSuppliers(): void {
    this.loading = true;
    const sub = this.supplierService.getAllSuppliers().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.suppliers = Array.isArray(response.data) ? response.data : [response.data];
          this.setupSupplierAutocomplete();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
        this.toast.error('OIL_SALES.MESSAGES.ERROR.SUPPLIERS');
        this.loading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  private calculateTotalAmount(): void {
    const quantity = this.oilSaleForm.get('quantity')?.value;
    const unitPrice = this.oilSaleForm.get('unitPrice')?.value;

    if (quantity && unitPrice) {
      const totalAmount = quantity * unitPrice + this.totalContainerCost();
      console.log('Total amount:', totalAmount);
    }
  }

  private requireSupplierSelection() {
    return (ctrl: AbstractControl): ValidationErrors | null => {
      const v = ctrl.value;
      const isObjectSelected = v && typeof v === 'object';
      return isObjectSelected ? null : { selectionRequired: true };
    };
  }
}
