import { Component, OnInit } from '@angular/core';
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
import { OilTransaction, TransactionState, TransactionType } from '../../../../shared/models/OilTransaction';
import { StorageUnitDto } from '../../../../shared/models/StorageUnitDto';
import { OilTransactionService } from '../../../../shared/services/OilTransactionService';
import { StorageUnitDtoService } from '../../../../shared/services/storage.service';
import { ApiResponse } from '../../../../shared/models/api-response';


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
export class OilTransactionAddComponent implements OnInit {
  oilTransactionForm!: FormGroup;
  isEditMode = false;
  transactionId: string | null = null;
  loading = false;
  submitting = false;
  storageUnits: StorageUnitDto[] = [];

  // Form options - Using enum values
  transactionTypes = [
    { value: TransactionType.RECEPTION_IN, label: 'OIL_TRANSACTIONS.DASHBOARD.TYPES.RECEPTION_IN' },
    { value: TransactionType.TRANSFER_IN, label: 'OIL_TRANSACTIONS.DASHBOARD.TYPES.TRANSFER_IN' },
    { value: TransactionType.LOAN, label: 'OIL_TRANSACTIONS.DASHBOARD.TYPES.LOAN' },
    { value: TransactionType.SALE, label: 'OIL_TRANSACTIONS.DASHBOARD.TYPES.SALE' }
  ];

  transactionStates = [
    { value: TransactionState.PENDING, label: 'OIL_TRANSACTIONS.DASHBOARD.STATUS.PENDING' },
    { value: TransactionState.COMPLETED, label: 'OIL_TRANSACTIONS.DASHBOARD.STATUS.COMPLETED' }
  ];

  qualityGrades = [
    { value: 'EXTRA_VIRGIN', label: 'OIL_TRANSACTIONS.QUALITY_GRADES.EXTRA_VIRGIN' },
    { value: 'VIRGIN', label: 'OIL_TRANSACTIONS.QUALITY_GRADES.VIRGIN' },
    { value: 'REFINED', label: 'OIL_TRANSACTIONS.QUALITY_GRADES.REFINED' },
    { value: 'LAMPANTE', label: 'OIL_TRANSACTIONS.QUALITY_GRADES.LAMPANTE' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private oilTransactionService: OilTransactionService,
    private storageUnitService: StorageUnitDtoService,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadStorageUnits();
    this.checkEditMode();
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
    this.oilTransactionForm.get('quantityKg')?.valueChanges.subscribe(() => {
      this.calculateTotalPrice();
    });

    this.oilTransactionForm.get('unitPrice')?.valueChanges.subscribe(() => {
      this.calculateTotalPrice();
    });
  }

  private loadStorageUnits(): void {
    this.storageUnitService.getAllStorageUnit().subscribe({
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
    this.oilTransactionService.getOilTransaction(this.transactionId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.populateForm(response.data);
        } else {
          this.snackBar.open(
            this.translate.instant('OIL_TRANSACTIONS.FORM.MESSAGES.ERROR.LOAD'),
            this.translate.instant('STANDARD.BTNS.CANCEL'),
            { duration: 3000 }
          );
          this.router.navigate(['/settings/storage/oil-transactions']);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading transaction:', error);
        this.snackBar.open(
          this.translate.instant('OIL_TRANSACTIONS.FORM.MESSAGES.ERROR.LOAD'),
          this.translate.instant('STANDARD.BTNS.CANCEL'),
          { duration: 3000 }
        );
        this.router.navigate(['/settings/storage/oil-transactions']);
        this.loading = false;
      }
    });
  }

  private populateForm(transaction: OilTransaction): void {
    this.oilTransactionForm.patchValue({
      transactionType: transaction.transactionType,
      transactionState: transaction.transactionState,
      storageUnitDestinationId: transaction.storageUnitDestination?.id || '',
      storageUnitSourceId: transaction.storageUnitSource?.id || '',
      qualityGrade: transaction.qualityGrade,
      quantityKg: transaction.quantityKg,
      unitPrice: transaction.unitPrice,
      totalPrice: transaction.totalPrice
    });
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
    if (this.oilTransactionForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.submitting = true;
    const formValue = this.oilTransactionForm.getRawValue();

    // Create OilTransaction object with minimal data for API
    // Using partial objects since the backend will handle the relationships by ID
    const transactionRequest = {
      id: this.transactionId || '',
      transactionType: formValue.transactionType,
      transactionState: formValue.transactionState,
      storageUnitDestination: { id: formValue.storageUnitDestinationId },
      storageUnitSource: formValue.storageUnitSourceId ? { id: formValue.storageUnitSourceId } : undefined,
      qualityGrade: formValue.qualityGrade,
      quantityKg: formValue.quantityKg,
      unitPrice: formValue.unitPrice,
      totalPrice: formValue.totalPrice
    } as OilTransaction;

    const operation = this.isEditMode
      ? this.oilTransactionService.updateOilTransaction(transactionRequest)
      : this.oilTransactionService.createOilTransaction(transactionRequest);

    operation.subscribe({
      next: (response) => {
        if (response.success) {
          const messageKey = this.isEditMode
            ? 'OIL_TRANSACTIONS.FORM.MESSAGES.SUCCESS.UPDATE'
            : 'OIL_TRANSACTIONS.FORM.MESSAGES.SUCCESS.CREATE';
          this.snackBar.open(
            this.translate.instant(messageKey),
            this.translate.instant('STANDARD.BTNS.CANCEL'),
            { duration: 3000 }
          );
          this.router.navigate(['/finance/oil-transactions']);
        } else {
          this.snackBar.open(
            this.translate.instant('OIL_TRANSACTIONS.FORM.MESSAGES.ERROR.UPDATE'),
            this.translate.instant('STANDARD.BTNS.CANCEL'),
            { duration: 3000 }
          );
        }
        this.submitting = false;
      },
      error: (error) => {
        console.error('Error saving transaction:', error);
        this.snackBar.open(
          this.translate.instant('OIL_TRANSACTIONS.FORM.MESSAGES.ERROR.UPDATE'),
          this.translate.instant('STANDARD.BTNS.CANCEL'),
          { duration: 3000 }
        );
        this.submitting = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/settings/storage/oil-transactions']);
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
}
