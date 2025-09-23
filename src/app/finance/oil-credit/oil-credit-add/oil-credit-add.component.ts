import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { ApiResponse } from '../../../shared/models/api-response';
import { OilCredit, CreditState, UnitType } from '../../models/OilCredit';
import { OilCreditService } from '../../service/oil-credit.service';
import { BaseType } from '../../../shared/models/base-type';
import { GenericTypeService } from '../../../shared/services/generic-type.service';
import { SupplierType } from '../../../shared/models/supplier-type';
import { SupplierTypeService } from '../../../shared/services/supplier.service';
import { TypeCategory } from '../../../shared/models/type-category.enum';
import { StorageUnitDtoService } from '../../../shared/services/storage.service';
import { StorageUnitDto } from '../../../shared/models/StorageUnitDto';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-oil-credit-add',
  templateUrl: './oil-credit-add.component.html',
  styleUrls: ['./oil-credit-add.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    TranslateModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    SharedModule
  ]
})
export class OilCreditAddComponent implements OnInit, OnDestroy {
  form: FormGroup;
  editing = false;
  submitted = false;
  loading = false;
  oilTypes: BaseType[] = [];
  suppliers: SupplierType[] = [];
  storageUnits: StorageUnitDto[] = [];
  selectedStorageUnit: StorageUnitDto | null = null;
  private data: OilCredit[] = [];
  private destroy$ = new Subject<void>();

  // Autocomplete filtered options
  filteredOilTypes: Observable<BaseType[]>;
  filteredSuppliers: Observable<SupplierType[]>;
  filteredStorageUnits: Observable<StorageUnitDto[]>;

  constructor(
    private fb: FormBuilder,
    private oilCreditService: OilCreditService,
    private genericTypeService: GenericTypeService,
    private supplierService: SupplierTypeService,
    private storageUnitService: StorageUnitDtoService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService
  ) {
    this.form = this.fb.group({
      id: [null],
      emballage: ['', Validators.required],
      quantity: [null, [Validators.required, Validators.min(0.01)]],
      unit: [UnitType.L, Validators.required],
      oil_type: [null, Validators.required],
      destinataire: [null, Validators.required],
      // citerne_pile: [null, Validators.required], // [DISABLED: will be set in oil transaction]
      creditState: [CreditState.PENDING, Validators.required]
    });

    // Initialize filtered observables
    this.filteredOilTypes = new Observable<BaseType[]>();
    this.filteredSuppliers = new Observable<SupplierType[]>();
    this.filteredStorageUnits = new Observable<StorageUnitDto[]>();
  }

  ngOnInit(): void {
    this.genericTypeService.getAllTypes(TypeCategory.OIL_TYPE).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res) => {
        this.oilTypes = res.data || [];
        this.setupAutocompleteFilters();
      },
      error: () => {
        this.toast.error(
          this.translate.instant('OIL_CREDIT.FORM.MESSAGES.LOAD_ERROR')
        );
      }
    });

    this.supplierService.getAllSuppliers().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res) => {
        this.suppliers = res.data || [];
        this.setupAutocompleteFilters();
      },
      error: () => {
        this.toast.error(
          this.translate.instant('OIL_CREDIT.FORM.MESSAGES.LOAD_ERROR')
        );
      }
    });

    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadOilCredit(id);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupAutocompleteFilters(): void {
    // Oil type filter
    this.filteredOilTypes = this.form.get('oil_type')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(this.oilTypes, value, 'name'))
    );

    // Supplier filter
    this.filteredSuppliers = this.form.get('destinataire')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(this.suppliers, value, 'name'))
    );

    // Storage unit filter [DISABLED: will be set in oil transaction]
    // this.filteredStorageUnits = this.form.get('citerne_pile')!.valueChanges.pipe(
    //   startWith(''),
    //   map(value => this._filter(this.storageUnits, value, 'name'))
    // );
  }

  private _filter<T extends { name?: string; supplierInfo?: { name: string } }>(
    items: T[],
    value: string | T,
    displayField: string
  ): T[] {
    if (!value || typeof value === 'object') {
      return items;
    }
    const filterValue = value.toLowerCase();
    return items.filter(item => {
      const fieldValue = this._getNestedValue(item, displayField);
      return fieldValue.toLowerCase().includes(filterValue);
    });
  }

  private _getNestedValue<T extends Record<string, unknown>>(obj: T, path: string): string {
    return path.split('.').reduce((acc, part) => {
      if (acc && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[part];
      }
      return '';
    }, obj as unknown) as string;
  }

  displayFn<T extends {  name: string } >(item: T): string {
    if (!item) return '';
      return item.name;

  }

  // onStorageUnitSelected and validateQuantity methods [DISABLED: will be set in oil transaction]
  // onStorageUnitSelected(unit: StorageUnitDto): void {
  //   if (unit) {
  //     this.selectedStorageUnit = unit;
  //     this.validateQuantity(this.form.get('quantity')?.value);
  //   }
  // }
  //
  // validateQuantity(quantity: number): void {
  //   if (!this.selectedStorageUnit || !quantity) {
  //     return;
  //   }
  //   const unit = this.form.get('unit')?.value;
  //   const availableVolume = this.selectedStorageUnit.currentVolume;
  //   const quantityControl = this.form.get('quantity');
  //   if (quantityControl?.hasError('insufficientVolume') || quantityControl?.hasError('unitMismatch')) {
  //     quantityControl.setErrors(null);
  //   }
  //   if (unit === 'KG') {
  //     quantityControl?.setErrors({ unitMismatch: true });
  //     this.snackBar.open(
  //       this.translate.instant('OIL_CREDIT.FORM.MESSAGES.QUANTITY_UNIT_MISMATCH_SNACK'),
  //       this.translate.instant('OIL_CREDIT.FORM.BUTTONS.CANCEL'),
  //       { duration: 3000 }
  //     );
  //     return;
  //   }
  //   if (quantity > availableVolume) {
  //     quantityControl?.setErrors({ insufficientVolume: true });
  //     this.snackBar.open(
  //       this.translate.instant('OIL_CREDIT.FORM.MESSAGES.QUANTITY_INSUFFICIENT_SNACK', { quantity, available: availableVolume }),
  //       this.translate.instant('OIL_CREDIT.FORM.BUTTONS.CANCEL'),
  //       { duration: 3000 }
  //     );
  //   }
  // }

  getVolumeClass(currentVolume: number, maxCapacity: number): string {
    if (!maxCapacity || maxCapacity <= 0) return 'volume-low';
    const percentage = (currentVolume / maxCapacity) * 100;
    if (percentage >= 75) return 'volume-high';
    if (percentage >= 25) return 'volume-medium';
    return 'volume-low';
  }

  save(): void {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error(
        this.translate.instant('OIL_CREDIT.FORM.MESSAGES.FORM_INVALID')
      );
      return;
    }

    this.loading = true;
    const formValue = this.form.value;
    const dto = {
      ...formValue,
      oil_type: formValue.oil_type||null,
      destinataire: formValue.destinataire?.id || formValue.destinataire
      // citerne_pile: formValue.citerne_pile?.id || formValue.citerne_pile // [DISABLED: will be set in oil transaction]
    };

    if (!dto.creditState) {
      dto.creditState = CreditState.PENDING;
    }

    const creditObs = this.editing ? this.oilCreditService.updateOilCredit(dto) : this.oilCreditService.createOilCredit(dto);
    creditObs.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.toast.success(
          this.translate.instant(this.editing ? 'OIL_CREDIT.FORM.MESSAGES.UPDATE_SUCCESS' : 'OIL_CREDIT.FORM.MESSAGES.SAVE_SUCCESS')
        );
        this.router.navigate(['/finance/oil-credit']);
      }, error: (error: unknown) => {
        console.error('Error saving oil credit:', error);
        this.toast.error(
          this.translate.instant('OIL_CREDIT.FORM.MESSAGES.SAVE_ERROR')
        );
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/finance/oil-credit']);
  }

  private loadOilCredit(id: string): void {
    this.loading = true;
    this.oilCreditService.getOilCredit(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: ApiResponse<OilCredit>) => {
        if (response.data && response.data.length > 0) {
          const credit = response.data[0];
          const oilType = this.oilTypes.find(type => type.id === credit.oil_type);
          const supplier = this.suppliers.find(sup => sup.id === credit.destinataire.id);
          // const storageUnit = this.storageUnits.find(unit => unit.id === credit.transaction_id_in); // [DISABLED]
          this.form.patchValue({
            ...credit,
            oil_type: oilType || credit.oil_type,
            destinataire: supplier || credit.destinataire
            // citerne_pile: storageUnit || credit.transaction_id_in // [DISABLED]
          });
          this.editing = true;
        }
        this.loading = false;
      },
      error: (error: unknown) => {
        console.error('Error loading oil credit:', error);
        this.toast.error(
          this.translate.instant('OIL_CREDIT.FORM.MESSAGES.LOAD_ERROR') );
        this.loading = false;
      }
    });
  }

  getCreditStateLabel(state: CreditState): string {
    const key = `OIL_CREDIT.FORM.CREDIT_STATES.${state}`;
    return this.translate.instant(key);
  }

  getUnitLabel(unit: UnitType): string {
    const key = unit === UnitType.L ? 'OIL_CREDIT.FORM.UNITS.LITRE' : 'OIL_CREDIT.FORM.UNITS.KILOGRAM';
    return this.translate.instant(key);
  }
}
