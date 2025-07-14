import { Component, OnDestroy, OnInit } from '@angular/core';
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

  // Form and state
  form!: FormGroup;
  loading = false;
  submitting = false;
  isEditMode = false;
  transactionId: string | null = null;

  // Data
  storageUnits: StorageUnitDto[] = [];

  // Options
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
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Form initialization
  private initializeForm(): void {
    this.form = this.fb.group({
      transactionType: [TransactionType.TRANSFER_IN, Validators.required],
      transactionState: [TransactionState.PENDING, Validators.required],
      storageUnitSourceId: [null],
      storageUnitDestinationId: [null],
      qualityGrade: [null, Validators.required],
      quantityKg: [null, [Validators.required, Validators.min(0.01)]],
      unitPrice: [null],
      totalPrice: [{ value: null, disabled: true }]
    });
  }

  private setupFormSubscriptions(): void {
    // Watch transaction type changes
    this.form.get('transactionType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(type => {
        this.updateFieldRequirements(type);
        this.updatePricingFields(type);
      });

    // Auto-calculate total price
    this.form.get('quantityKg')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculateTotalPrice());

    this.form.get('unitPrice')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculateTotalPrice());
  }

  // Field requirement management
  private updateFieldRequirements(transactionType: TransactionType): void {
    const controls = this.form.controls;

    // Reset all storage unit requirements
    controls['storageUnitSourceId'].clearValidators();
    controls['storageUnitDestinationId'].clearValidators();

    // Set requirements based on transaction type
    switch (transactionType) {
      case TransactionType.TRANSFER_IN:
        controls['storageUnitSourceId'].setValidators(Validators.required);
        controls['storageUnitDestinationId'].setValidators(Validators.required);
        break;
      case TransactionType.RECEPTION_IN:
        controls['storageUnitDestinationId'].setValidators(Validators.required);
        break;
      case TransactionType.EXCHANGE:
        controls['storageUnitSourceId'].setValidators(Validators.required);
        break;
      case TransactionType.SALE:
      case TransactionType.LOAN:
        controls['storageUnitSourceId'].setValidators(Validators.required);
        controls['storageUnitDestinationId'].setValidators(Validators.required);
        break;
    }

    controls['storageUnitSourceId'].updateValueAndValidity();
    controls['storageUnitDestinationId'].updateValueAndValidity();
  }

  private updatePricingFields(transactionType: TransactionType): void {
    const unitPriceControl = this.form.get('unitPrice');
    const totalPriceControl = this.form.get('totalPrice');

    if (transactionType === TransactionType.TRANSFER_IN || transactionType === TransactionType.EXCHANGE) {
      // No pricing for internal transfers
      unitPriceControl?.clearValidators();
      unitPriceControl?.disable();
      totalPriceControl?.disable();
      unitPriceControl?.setValue(null);
      totalPriceControl?.setValue(null);
    } else {
      // Pricing required for external transactions
      unitPriceControl?.setValidators([Validators.required, Validators.min(0)]);
      unitPriceControl?.enable();
      totalPriceControl?.enable();
    }

    unitPriceControl?.updateValueAndValidity();
    totalPriceControl?.updateValueAndValidity();
  }

  private calculateTotalPrice(): void {
    const quantity = this.form.get('quantityKg')?.value;
    const unitPrice = this.form.get('unitPrice')?.value;

    if (quantity && unitPrice) {
      const total = quantity * unitPrice;
      this.form.get('totalPrice')?.setValue(total.toFixed(2));
    } else {
      this.form.get('totalPrice')?.setValue(null);
    }
  }

  // Data loading
  private loadStorageUnits(): void {
    this.storageUnitService.getAllStorageUnit()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ApiResponse<StorageUnitDto>) => {
          this.storageUnits = response.data.sort((a, b) => a.name.localeCompare(b.name));
        },
        error: (error: unknown) => {
          console.error('Error loading storage units:', error);
          this.showError('OIL_TRANSACTIONS.FORM.MESSAGES.ERROR.LOAD_STORAGE_UNITS');
        }
      });
  }

  private checkEditMode(): void {
    this.transactionId = this.route.snapshot.paramMap.get('id');
    if (this.transactionId) {
      this.isEditMode = true;
      this.loadTransactionForEdit();
    } else {
      // In add mode, only allow TRANSFER_IN
      this.transactionTypes = [
        { value: TransactionType.TRANSFER_IN, label: 'OIL_TRANSACTIONS.DASHBOARD.TYPES.TRANSFER_IN' }
      ];
    }
  }

  private loadTransactionForEdit(): void {
    if (!this.transactionId) return;

    this.loading = true;
    this.oilTransactionService.getOilTransaction(this.transactionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const transaction = Array.isArray(response.data) ? response.data[0] : response.data;
            if (transaction && transaction.id) {
              this.populateForm(transaction);
            } else {
              this.showError('OIL_TRANSACTIONS.FORM.MESSAGES.ERROR.LOAD');
            }
          } else {
            this.showError('OIL_TRANSACTIONS.FORM.MESSAGES.ERROR.LOAD');
          }
          this.loading = false;
        },
        error: () => {
          this.showError('OIL_TRANSACTIONS.FORM.MESSAGES.ERROR.LOAD');
          this.loading = false;
        }
      });
  }

  private populateForm(transaction: OilTransaction): void {
    // Determine quality grade value
    let qualityGradeValue = '';
    const possibleGrade = transaction.qualityGrade || (transaction.reception?.categoryOliveOil || '');
    if (possibleGrade) {
      const match = this.qualityGrades.find(q =>
        (q.value && q.value.toLowerCase() === possibleGrade.toLowerCase()) ||
        (q.label && q.label.toLowerCase() === possibleGrade.toLowerCase())
      );
      if (match) {
        qualityGradeValue = match.value;
      }
    }

    const formValues = {
      transactionType: transaction.transactionType || TransactionType.TRANSFER_IN,
      transactionState: transaction.transactionState || TransactionState.PENDING,
      storageUnitDestinationId: transaction.storageUnitDestination?.id || null,
      storageUnitSourceId: transaction.storageUnitSource?.id || null,
      qualityGrade: qualityGradeValue,
      quantityKg: transaction.quantityKg || null,
      unitPrice: transaction.unitPrice || null,
      totalPrice: transaction.totalPrice || null
    };

    this.form.patchValue(formValues);

    // Update field requirements after populating
    this.updateFieldRequirements(transaction.transactionType);
    this.updatePricingFields(transaction.transactionType);
  }

  // Form submission
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showError('OIL_TRANSACTIONS.FORM.MESSAGES.INCOMPLETE_FORM');
      return;
    }

    if (this.isEditMode) {
      this.showUpdateConfirmation();
    } else {
      this.saveTransaction();
    }
  }

  // Approval submission
  onApprove(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showError('OIL_TRANSACTIONS.FORM.MESSAGES.INCOMPLETE_FORM');
      return;
    }

    if (!this.isEditMode || !this.transactionId) {
      this.showError('OIL_TRANSACTIONS.FORM.MESSAGES.ERROR.APPROVAL_NOT_AVAILABLE');
      return;
    }

    this.showApprovalConfirmation();
  }

  private showApprovalConfirmation(): void {
    this.confirmationDialog.confirm({
      title: this.translate.instant('OIL_TRANSACTIONS.FORM.CONFIRMATION.APPROVE.TITLE'),
      message: this.translate.instant('OIL_TRANSACTIONS.FORM.CONFIRMATION.APPROVE.MESSAGE'),
      type: ConfirmationType.WARNING,
      confirmText: this.translate.instant('OIL_TRANSACTIONS.FORM.CONFIRMATION.APPROVE.CONFIRM'),
      cancelText: this.translate.instant('OIL_TRANSACTIONS.FORM.CONFIRMATION.APPROVE.CANCEL'),
      showIcon: true
    }).subscribe(result => {
      if (result?.confirmed) {
        this.approveTransaction();
      }
    });
  }

  private approveTransaction(): void {
    if (!this.transactionId) return;

    this.submitting = true;
    const formValue = this.form.getRawValue();

    const transactionRequest = {
      id: this.transactionId,
      transactionType: formValue.transactionType,
      transactionState: formValue.transactionState,
      storageUnitDestination: formValue.storageUnitDestinationId ? { id: formValue.storageUnitDestinationId } : undefined,
      storageUnitSource: formValue.storageUnitSourceId ? { id: formValue.storageUnitSourceId } : undefined,
      qualityGrade: formValue.qualityGrade,
      quantityKg: formValue.quantityKg,
      unitPrice: formValue.unitPrice,
      totalPrice: formValue.totalPrice
    } as OilTransaction;

    this.oilTransactionService.approveOilTransaction(transactionRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.submitting = false;
          if (response.success) {
            this.showSuccess('OIL_TRANSACTIONS.FORM.MESSAGES.SUCCESS.APPROVE');
            this.router.navigate(['/storage/oil-transactions']);
          } else {
            this.showError('OIL_TRANSACTIONS.FORM.MESSAGES.ERROR.APPROVE');
          }
        },
        error: () => {
          this.submitting = false;
          this.showError('OIL_TRANSACTIONS.FORM.MESSAGES.ERROR.APPROVE');
        }
      });
  }

  private showUpdateConfirmation(): void {
    this.confirmationDialog.confirm({
      title: this.translate.instant('STANDARD.CONFIRMATION.UPDATE.TITLE'),
      message: this.translate.instant('STANDARD.CONFIRMATION.UPDATE.MESSAGE'),
      type: ConfirmationType.WARNING,
      confirmText: this.translate.instant('STANDARD.CONFIRMATION.UPDATE.CONFIRM'),
      cancelText: this.translate.instant('STANDARD.CONFIRMATION.UPDATE.CANCEL'),
      showIcon: true
    }).subscribe(result => {
      if (result?.confirmed) {
        this.saveTransaction();
      }
    });
  }

  private saveTransaction(): void {
    this.submitting = true;
    const formValue = this.form.getRawValue();

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

    operation.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.submitting = false;
        if (response.success) {
          this.showSuccess(
            this.isEditMode
              ? 'OIL_TRANSACTIONS.FORM.MESSAGES.SUCCESS.UPDATE'
              : 'OIL_TRANSACTIONS.FORM.MESSAGES.SUCCESS.CREATE'
          );
          this.router.navigate(['/storage/oil-transactions']);
        } else {
          this.showError('OIL_TRANSACTIONS.FORM.MESSAGES.ERROR.UPDATE');
        }
      },
      error: () => {
        this.submitting = false;
        this.showError('OIL_TRANSACTIONS.FORM.MESSAGES.ERROR.UPDATE');
      }
    });
  }

  // Navigation
  onCancel(): void {
    this.router.navigate(['/storage/oil-transactions']);
  }

  // Utility methods
  getErrorMessage(controlName: string): string {
    const control = this.form.get(controlName);
    if (control?.hasError('required')) {
      return this.translate.instant('OIL_TRANSACTIONS.FORM.VALIDATION.REQUIRED');
    }
    if (control?.hasError('min')) {
      return this.translate.instant('OIL_TRANSACTIONS.FORM.VALIDATION.MIN_VALUE');
    }
    return '';
  }

  getStorageUnitInfo(unit: StorageUnitDto): string {
    const availableCapacity = unit.maxCapacity - unit.currentVolume;
    return `${unit.name} (${availableCapacity.toFixed(2)}L available)`;
  }

  // Field visibility helpers
  shouldShowSourceUnit(): boolean {
    const type = this.form.get('transactionType')?.value;
    return type === TransactionType.TRANSFER_IN ||
           type === TransactionType.SALE ||
           type === TransactionType.LOAN ||
           type === TransactionType.EXCHANGE;
  }

  shouldShowDestinationUnit(): boolean {
    const type = this.form.get('transactionType')?.value;
    return type === TransactionType.TRANSFER_IN ||
           type === TransactionType.RECEPTION_IN ||
           type === TransactionType.SALE ||
           type === TransactionType.LOAN;
  }

  shouldShowPricingFields(): boolean {
    const type = this.form.get('transactionType')?.value;
    return type !== TransactionType.TRANSFER_IN && type !== TransactionType.EXCHANGE;
  }

  // Notification helpers
  private showSuccess(messageKey: string): void {
    this.snackBar.open(
      this.translate.instant(messageKey),
      undefined,
      { duration: 3000 }
    );
  }

  private showError(messageKey: string): void {
    this.snackBar.open(
      this.translate.instant(messageKey),
      this.translate.instant('STANDARD.BTNS.CANCEL'),
      { duration: 3000 }
    );
  }
}
