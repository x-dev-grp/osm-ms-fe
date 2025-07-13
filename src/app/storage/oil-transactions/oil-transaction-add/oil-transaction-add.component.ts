import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { OilTransaction, TransactionState, TransactionType } from '../../../shared/models/OilTransaction';
import { StorageUnitDto } from '../../../shared/models/StorageUnitDto';
import { OilTransactionService } from '../../../shared/services/OilTransactionService';
import { StorageUnitDtoService } from '../../../shared/services/storage.service';
import { ApiResponse } from '../../../shared/models/api-response';
import { ConfirmationDialogService, ConfirmationType } from '../../../shared/services/confirmation-dialog.service';


@Component({
  selector: 'app-oil-transaction-add',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './oil-transaction-add.component.html',
  styleUrls: ['./oil-transaction-add.component.scss']
})
export class OilTransactionAddComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  oilTransactionForm!: FormGroup;
  isEditMode = false;
  transactionId: string | null = null;
  loading = false;
  submitting = false;
  storageUnits: StorageUnitDto[] = [];

  // Form options - Using enum values
  transactionTypes = [
    { value: TransactionType.TRANSFER_IN, label: 'OIL_TRANSACTIONS.DASHBOARD.TYPES.TRANSFER_IN' },
    { value: TransactionType.RECEPTION_IN, label: 'OIL_TRANSACTIONS.DASHBOARD.TYPES.RECEPTION_IN' },
    { value: TransactionType.LOAN, label: 'OIL_TRANSACTIONS.DASHBOARD.TYPES.LOAN' },
    { value: TransactionType.SALE, label: 'OIL_TRANSACTIONS.DASHBOARD.TYPES.SALE' },
    { value: TransactionType.EXCHANGE, label: 'OIL_TRANSACTIONS.DASHBOARD.TYPES.EXCHANGE' }
  ];

  transactionStates = [
    { value: TransactionState.PENDING, label: 'OIL_TRANSACTIONS.DASHBOARD.STATUS.PENDING' },
    { value: TransactionState.COMPLETED, label: 'OIL_TRANSACTIONS.DASHBOARD.STATUS.COMPLETED' }
  ];

  qualityGrades = [
    { value: 'vierge_extra', label: 'Vierge Extra' },
    { value: 'vierge', label: 'Vierge' },
    { value: 'lampante', label: 'Lampante' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private oilTransactionService: OilTransactionService,
    private storageUnitService: StorageUnitDtoService,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private confirmationDialog: ConfirmationDialogService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadStorageUnits();
    this.checkEditMode();
    if (!this.isEditMode) {
      // Only allow TRANSFER_IN in add mode
      this.transactionTypes = [
        { value: TransactionType.TRANSFER_IN, label: 'OIL_TRANSACTIONS.DASHBOARD.TYPES.TRANSFER_IN' }
      ];
      this.oilTransactionForm.get('transactionType')?.setValue(TransactionType.TRANSFER_IN);
    }
    // Watch transactionType to update pricing field validators
    this.oilTransactionForm.get('transactionType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((type) => {
        this.updatePricingValidators(type);
      });
    // Initial validator setup
    this.updatePricingValidators(this.oilTransactionForm.get('transactionType')?.value);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.oilTransactionForm = this.fb.group({
      transactionType: ['', Validators.required],
      transactionState: [TransactionState.PENDING, Validators.required],
      storageUnitDestinationId: ['', Validators.required],
      storageUnitSourceId: [''],
      qualityGrade: ['', Validators.required],
      quantityKg: ['', [Validators.required, Validators.min(0.01)]],
      unitPrice: ['', [Validators.required, Validators.min(0)]],
      totalPrice: [{ value: '', disabled: true }]
    });

    // Auto-calculate total price
    this.oilTransactionForm.get('quantityKg')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.calculateTotalPrice();
      });

    this.oilTransactionForm.get('unitPrice')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.calculateTotalPrice();
      });
  }

  private loadStorageUnits(): void {
    this.storageUnitService.getAllStorageUnit()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ApiResponse<StorageUnitDto>) => {
          this.storageUnits = response.data.sort((a, b) => a.name.localeCompare(b.name));
        },
        error: (error: unknown) => {
          console.error('Error loading storage units:', error);
          this.snackBar.open(
            this.translate.instant('OIL_TRANSACTIONS.FORM.MESSAGES.ERROR.LOAD_STORAGE_UNITS'),
            this.translate.instant('STANDARD.BTNS.CANCEL'),
            { duration: 3000 }
          );
        }
      });
  }

  getVolumeClass(currentVolume: number, maxCapacity: number): string {
    if (!maxCapacity || maxCapacity <= 0) return 'volume-low';
    const percentage = (currentVolume / maxCapacity) * 100;
    if (percentage >= 75) return 'volume-high';
    if (percentage >= 25) return 'volume-medium';
    return 'volume-low';
  }

  private checkEditMode(): void {
    this.transactionId = this.route.snapshot.paramMap.get('id');
    if (this.transactionId) {
      this.isEditMode = true;
      this.loadTransactionForEdit();
    }
  }

  private loadTransactionForEdit(): void {
    if (!this.transactionId) return;

    this.loading = true;
    this.oilTransactionService.getOilTransaction(this.transactionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('API Response:', response); // Debug log
          if (response.success && response.data) {
            const transaction = Array.isArray(response.data) ? response.data[0] : response.data;
            if (transaction && transaction.id) {
              console.log('Transaction to populate:', transaction); // Debug log
              // Wait for storage units to be loaded before populating form
              if (this.storageUnits.length > 0) {
                this.populateForm(transaction);
              } else {
                // If storage units not loaded yet, wait a bit and try again
                setTimeout(() => {
                  if (this.storageUnits.length > 0) {
                    this.populateForm(transaction);
                  } else {
                    console.error('Storage units not loaded, cannot populate form');
                    this.handleLoadError();
                  }
                }, 1000);
              }
            } else {
              console.error('Invalid transaction data received:', response.data);
              this.handleLoadError();
            }
          } else {
            console.error('No transaction data found in response:', response);
            this.handleLoadError();
          }
          this.loading = false;
        },
        error: () => {
          this.handleLoadError();
          this.loading = false;
        }
      });
  }

  private handleLoadError(): void {
    this.snackBar.open(
      this.translate.instant('OIL_TRANSACTIONS.FORM.MESSAGES.ERROR.LOAD'),
      this.translate.instant('STANDARD.BTNS.CANCEL'),
      { duration: 3000 }
    );
    this.router.navigate(['/storage/oil-transactions']);
  }

  private populateForm(transaction: OilTransaction): void {
    if (!transaction) {
      console.error('Transaction data is undefined or null');
      return;
    }

    console.log('Populating form with transaction:', transaction); // Debug log
    console.log('Transaction ID:', transaction.id); // Debug log
    console.log('Storage unit destination object:', transaction.storageUnitDestination); // Debug log
    console.log('Storage unit source object:', transaction.storageUnitSource); // Debug log

    // Temporarily enable all controls for population
    this.oilTransactionForm.get('unitPrice')?.enable();
    this.oilTransactionForm.get('totalPrice')?.enable();

    const formValues = {
      transactionType: transaction.transactionType || '',
      transactionState: transaction.transactionState || TransactionState.PENDING,
      storageUnitDestinationId: transaction.storageUnitDestination?.id || '',
      storageUnitSourceId: transaction.storageUnitSource?.id || '',
      qualityGrade: transaction.qualityGrade || '',
      quantityKg: transaction.quantityKg || 0,
      unitPrice: transaction.unitPrice || 0,
      totalPrice: transaction.totalPrice || 0
    };

    console.log('Form values to patch:', formValues); // Debug log
    console.log('Storage unit destination ID:', formValues.storageUnitDestinationId); // Debug log
    console.log('Storage units loaded:', this.storageUnits.length); // Debug log
    console.log('Storage unit destination exists:', this.isStorageUnitLoaded(formValues.storageUnitDestinationId)); // Debug log

    // Check if storage units exist before patching
    if (formValues.storageUnitDestinationId && !this.isStorageUnitLoaded(formValues.storageUnitDestinationId)) {
      console.error('Storage unit destination not found in loaded units:', formValues.storageUnitDestinationId);
      console.log('Available storage units:', this.storageUnits.map(u => ({ id: u.id, name: u.name })));
    }

    this.oilTransactionForm.patchValue(formValues);

    // Update pricing validators after populating form
    this.updatePricingValidators(transaction.transactionType);

    console.log('Form values after population:', this.oilTransactionForm.value); // Debug log
    console.log('Form validity after population:', this.oilTransactionForm.valid); // Debug log
  }

  private calculateTotalPrice(): void {
    const quantity = this.oilTransactionForm.get('quantityKg')?.value;
    const unitPrice = this.oilTransactionForm.get('unitPrice')?.value;

    if (quantity && unitPrice) {
      const total = quantity * unitPrice;
      this.oilTransactionForm.get('totalPrice')?.setValue(total.toFixed(2));
    } else {
      this.oilTransactionForm.get('totalPrice')?.setValue('');
    }
  }

  onSubmit(): void {
    console.log('Form validity:', this.oilTransactionForm.valid); // Debug log
    console.log('Form errors:', this.oilTransactionForm.errors); // Debug log
    console.log('Form value:', this.oilTransactionForm.value); // Debug log

    // Check if form is valid, excluding disabled controls
    if (!this.isFormValidForSubmission()) {
      this.markFormGroupTouched();
      this.snackBar.open(this.translate.instant('OIL_TRANSACTIONS.FORM.MESSAGES.INCOMPLETE_FORM'), undefined, { duration: 3000 });
      return;
    }

    const doUpdate = () => {
      this.submitting = true;
      const formValue = this.oilTransactionForm.getRawValue();
      // Create OilTransaction object with minimal data for API
      // Using partial objects since the backend will handle the relationships by ID
      const transactionRequest = {
        id: this.transactionId || '',
        transactionType: formValue.transactionType,
        transactionState: formValue.transactionState,
        storageUnitDestination: formValue.storageUnitDestinationId ? { id: formValue.storageUnitDestinationId } : undefined,
        storageUnitSource: formValue.storageUnitSourceId ? { id: formValue.storageUnitSourceId } : undefined,
        qualityGrade: formValue.qualityGrade,
        quantityKg: formValue.quantityKg,
        unitPrice: formValue.unitPrice,
        totalPrice: formValue.totalPrice
      } as OilTransaction;
      const operation = this.isEditMode
        ? this.oilTransactionService.updateOilTransaction(transactionRequest)
        : this.oilTransactionService.createOilTransaction(transactionRequest);
      operation
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.submitting = false;
            if (response.success) {
              this.snackBar.open(
                this.translate.instant(
                  this.isEditMode
                    ? 'OIL_TRANSACTIONS.FORM.MESSAGES.SUCCESS.UPDATE'
                    : 'OIL_TRANSACTIONS.FORM.MESSAGES.SUCCESS.CREATE'
                ),
                undefined,
                { duration: 3000 }
              );
              this.router.navigate(['/storage/oil-transactions']);
            } else {
              this.snackBar.open(
                this.translate.instant('OIL_TRANSACTIONS.FORM.MESSAGES.ERROR.UPDATE'),
                undefined,
                { duration: 3000 }
              );
            }
          },
          error: () => {
            this.submitting = false;
            this.snackBar.open(
              this.translate.instant('OIL_TRANSACTIONS.FORM.MESSAGES.ERROR.UPDATE'),
              undefined,
              { duration: 3000 }
            );
          }
        });
    };

    if (this.isEditMode) {
      this.confirmationDialog.confirm({
        title: this.translate.instant('STANDARD.CONFIRMATION.UPDATE.TITLE'),
        message: this.translate.instant('STANDARD.CONFIRMATION.UPDATE.MESSAGE'),
        type: ConfirmationType.WARNING,
        confirmText: this.translate.instant('STANDARD.CONFIRMATION.UPDATE.CONFIRM'),
        cancelText: this.translate.instant('STANDARD.CONFIRMATION.UPDATE.CANCEL'),
        showIcon: true
      }).subscribe(result => {
        if (result && result.confirmed) {
          doUpdate();
        }
      });
    } else {
      doUpdate();
    }
  }

  onCancel(): void {
    this.router.navigate(['/storage/oil-transactions']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.oilTransactionForm.controls).forEach(key => {
      const control = this.oilTransactionForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.oilTransactionForm.get(controlName);
    if (control?.hasError('required')) {
      return this.translate.instant('OIL_TRANSACTIONS.FORM.VALIDATION.REQUIRED');
    }
    if (control?.hasError('min')) {
      return this.translate.instant('OIL_TRANSACTIONS.FORM.VALIDATION.MIN_VALUE');
    }
    return '';
  }

  isSourceStorageUnitRequired(): boolean {
    const transactionType = this.oilTransactionForm.get('transactionType')?.value;
    return transactionType === TransactionType.TRANSFER_IN ||
           transactionType === TransactionType.LOAN ||
           transactionType === TransactionType.SALE;
  }

  isExchangeTransaction(): boolean {
    return this.oilTransactionForm.get('transactionType')?.value === TransactionType.EXCHANGE;
  }

  shouldShowPricingFields(): boolean {
    const transactionType = this.oilTransactionForm.get('transactionType')?.value;
    return transactionType !== TransactionType.TRANSFER_IN && transactionType !== TransactionType.EXCHANGE;
  }

  getStorageUnitInfo(unit: StorageUnitDto): string {
    const availableCapacity = unit.maxCapacity - unit.currentVolume;
    return `${unit.name} (${availableCapacity.toFixed(2)}L available)`;
  }

  isStorageUnitLoaded(storageUnitId: string): boolean {
    return this.storageUnits.some(unit => unit.id === storageUnitId);
  }

  private updatePricingValidators(type: TransactionType) {
    const unitPriceCtrl = this.oilTransactionForm.get('unitPrice');
    const totalPriceCtrl = this.oilTransactionForm.get('totalPrice');
    if (type === TransactionType.TRANSFER_IN || type === TransactionType.EXCHANGE) {
      unitPriceCtrl?.clearValidators();
      totalPriceCtrl?.clearValidators();
      unitPriceCtrl?.setValue('');
      totalPriceCtrl?.setValue('');
      unitPriceCtrl?.disable();
      totalPriceCtrl?.disable();
    } else {
      unitPriceCtrl?.setValidators([Validators.required, Validators.min(0)]);
      totalPriceCtrl?.setValidators([]);
      unitPriceCtrl?.enable();
      totalPriceCtrl?.enable();
    }
    unitPriceCtrl?.updateValueAndValidity();
    totalPriceCtrl?.updateValueAndValidity();
  }

  isTransferIn(): boolean {
    return this.oilTransactionForm.get('transactionType')?.value === TransactionType.TRANSFER_IN;
  }

    private isFormValidForSubmission(): boolean {
    console.log('Checking form validity for submission...'); // Debug log

    const transactionType = this.oilTransactionForm.get('transactionType')?.value;
    console.log('Transaction type:', transactionType); // Debug log

    // Define required fields based on transaction type
    const baseFields = ['transactionType', 'transactionState', 'qualityGrade', 'quantityKg'];

    // For EXCHANGE, require source; for others, require destination
    const storageFields = transactionType === TransactionType.EXCHANGE
      ? ['storageUnitSourceId']
      : ['storageUnitDestinationId'];

    // Add pricing fields for non-TRANSFER_IN and non-EXCHANGE transactions
    const pricingFields = (transactionType !== TransactionType.TRANSFER_IN && transactionType !== TransactionType.EXCHANGE) ? ['unitPrice'] : [];

    // Add source storage unit if required (but not for EXCHANGE, since already handled)
    const sourceFields = this.isSourceStorageUnitRequired() && transactionType !== TransactionType.EXCHANGE ? ['storageUnitSourceId'] : [];

    const requiredFields = [...baseFields, ...storageFields, ...pricingFields, ...sourceFields];

    console.log('Required fields for validation:', requiredFields); // Debug log

    const isValid = requiredFields.every(field => {
      const control = this.oilTransactionForm.get(field);
      const isFieldValid = control && control.valid;
      console.log(`Field ${field}: valid = ${isFieldValid}, value = ${control?.value}, errors =`, control?.errors); // Debug log
      return isFieldValid;
    });

    console.log('Validation result:', isValid); // Debug log
    return isValid;
  }
}
