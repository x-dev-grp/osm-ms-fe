import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OilTransaction, TransactionState, TransactionType } from '../../../shared/models/OilTransaction';
import { OilTransactionService, ExchangeCompletionPayload } from '../../../shared/services/OilTransactionService';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { StorageUnitDto } from '../../../shared/models/StorageUnitDto';
import { StorageUnitDtoService } from '../../../shared/services/storage.service';
import { ApiResponse } from '../../../shared/models/api-response';

@Component({
  selector: 'app-view-oil-transaction',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    TranslateModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './view-oil-transaction.component.html',
  styleUrls: ['./view-oil-transaction.component.scss']
})
export class ViewOilTransactionComponent implements OnInit {
  oilTransaction: OilTransaction | null = null;
  loading = true;
  error = false;

  // Exchange completion form
  exchangeForm: FormGroup;
  showExchangeForm = false;
  availableStorageUnits: StorageUnitDto[] = [];
  exchangeCalculation: {
    oliveQuantity: number;
    oliveUnitPrice: number;
    oliveTotalValue: number;
    oilUnitPrice: number;
    calculatedOilQuantity: number;
    selectedStorageUnitName: string;
  } | null = null;

  // Enum references for template
  TransactionType = TransactionType;
  TransactionState = TransactionState;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private oilTransactionService: OilTransactionService,
    private storageService: StorageUnitDtoService,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private fb: FormBuilder
  ) {
    this.exchangeForm = this.fb.group({
      storageUnitDestinationId: ['', Validators.required],
      oilQuantity: ['', [Validators.required, Validators.min(0.01)]],
      oilUnitPrice: ['', [Validators.required, Validators.min(0)]],
      qualityGrade: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadOilTransaction();
    this.loadStorageUnits();
    this.setupFormListeners();
  }

  private setupFormListeners(): void {
    // Listen to storage unit changes to recalculate exchange values
    this.exchangeForm.get('storageUnitDestinationId')?.valueChanges.subscribe((storageUnitId) => {
      if (storageUnitId && this.showExchangeForm) {
        this.recalculateExchangeValues(storageUnitId);
      }
    });
  }

  private loadOilTransaction(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = true;
      this.loading = false;
      return;
    }

    this.oilTransactionService.getOilTransaction(id).subscribe({
      next: (response: ApiResponse<OilTransaction>) => {
        if (response.success && response.data) {
          this.oilTransaction = Array.isArray(response.data) ? response.data[0] : response.data;
          this.checkExchangeCompletion();
        } else {
          this.error = true;
          this.snackBar.open(
            this.translate.instant('OIL_TRANSACTIONS.VIEW.MESSAGES.ERROR'),
            this.translate.instant('STANDARD.BTNS.CANCEL'),
            { duration: 3000 }
          );
        }
        this.loading = false;
      },
      error: (error: Error) => {
        console.error('Error loading oil transaction:', error);
        this.error = true;
        this.loading = false;
        this.snackBar.open(
          this.translate.instant('OIL_TRANSACTIONS.VIEW.MESSAGES.ERROR'),
          this.translate.instant('STANDARD.BTNS.CANCEL'),
          { duration: 3000 }
        );
      }
    });
  }

  private loadStorageUnits(): void {
    this.storageService.getAllStorageUnit().subscribe({
      next: (response) => {
        if (response.success) {
          // Filter for available storage units that can receive oil
          this.availableStorageUnits = response.data.filter(unit =>
            unit.status === 'AVAILABLE' && unit.currentVolume < unit.maxCapacity
          );
        }
      },
      error: (error: Error) => {
        console.error('Error loading storage units:', error);
      }
    });
  }

  private checkExchangeCompletion(): void {
    if (this.oilTransaction &&
        this.oilTransaction.transactionType === TransactionType.EXCHANGE &&
        this.oilTransaction.transactionState === TransactionState.PENDING &&
        this.oilTransaction.reception) {

      this.showExchangeForm = true;
      // Don't calculate here, wait for storage unit selection
    }
  }

  private recalculateExchangeValues(storageUnitId: string): void {
    if (!this.oilTransaction?.reception) return;

    const reception = this.oilTransaction.reception;
    const oliveQuantity = reception.oliveQuantity || reception.poidsNet || 0;
    const oliveUnitPrice = reception.unitPrice || 0;
    const oliveTotalValue = oliveQuantity * oliveUnitPrice;

    // Get the selected storage unit and its average cost
    const selectedStorageUnit = this.availableStorageUnits.find(unit => unit.id === storageUnitId);

    let oilUnitPrice: number;
    let calculatedOilQuantity: number;

    if (selectedStorageUnit && selectedStorageUnit.avgCost > 0) {
      // Use the average cost from storage unit
      oilUnitPrice = selectedStorageUnit.avgCost;
      calculatedOilQuantity = oliveTotalValue / oilUnitPrice;
    } else {
      // Fallback to default calculation if no average cost available
      oilUnitPrice = oliveUnitPrice * 1.5; // 50% markup as fallback
      calculatedOilQuantity = oliveTotalValue / oilUnitPrice;
    }

    this.exchangeCalculation = {
      oliveQuantity,
      oliveUnitPrice,
      oliveTotalValue,
      oilUnitPrice,
      calculatedOilQuantity,
      selectedStorageUnitName: selectedStorageUnit?.name || 'Unknown'
    };

    // Pre-fill the form
    this.exchangeForm.patchValue({
      oilQuantity: calculatedOilQuantity,
      oilUnitPrice: oilUnitPrice,
      qualityGrade: 'EXTRA_VIRGIN' // Default quality grade
    }, { emitEvent: false }); // Prevent infinite loop
  }

  onEdit(): void {
    if (this.oilTransaction) {
      this.router.navigate(['/storage/oil-transactions', this.oilTransaction.id, 'edit']);
    }
  }

  onBack(): void {
    this.router.navigate(['/storage/oil-transactions']);
  }

  onDelete(): void {
    if (this.oilTransaction && confirm(this.translate.instant('OIL_TRANSACTIONS.VIEW.MESSAGES.DELETE_CONFIRM'))) {
      this.oilTransactionService.deleteOilTransaction(this.oilTransaction.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open(
              this.translate.instant('OIL_TRANSACTIONS.VIEW.MESSAGES.DELETE_SUCCESS'),
              this.translate.instant('STANDARD.BTNS.CANCEL'),
              { duration: 3000 }
            );
            this.router.navigate(['/storage/oil-transactions']);
          } else {
            this.snackBar.open(
              this.translate.instant('OIL_TRANSACTIONS.VIEW.MESSAGES.DELETE_ERROR'),
              this.translate.instant('STANDARD.BTNS.CANCEL'),
              { duration: 3000 }
            );
          }
        },
        error: (error: Error) => {
          console.error('Error deleting oil transaction:', error);
          this.snackBar.open(
            this.translate.instant('OIL_TRANSACTIONS.VIEW.MESSAGES.DELETE_ERROR'),
            this.translate.instant('STANDARD.BTNS.CANCEL'),
            { duration: 3000 }
          );
        }
      });
    }
  }

  onCompleteExchange(): void {
    if (this.exchangeForm.invalid) {
      this.snackBar.open(
        this.translate.instant('OIL_TRANSACTIONS.VIEW.MESSAGES.FORM_INVALID'),
        this.translate.instant('STANDARD.BTNS.CANCEL'),
        { duration: 3000 }
      );
      return;
    }

    const formValue = this.exchangeForm.value;
    const selectedStorageUnit = this.availableStorageUnits.find(
      unit => unit.id === formValue.storageUnitDestinationId
    );

    if (!selectedStorageUnit) {
      this.snackBar.open(
        this.translate.instant('OIL_TRANSACTIONS.VIEW.MESSAGES.INVALID_STORAGE_UNIT'),
        this.translate.instant('STANDARD.BTNS.CANCEL'),
        { duration: 3000 }
      );
      return;
    }

    // Check storage capacity
    const availableCapacity = selectedStorageUnit.maxCapacity - selectedStorageUnit.currentVolume;
    if (formValue.oilQuantity > availableCapacity) {
      this.snackBar.open(
        this.translate.instant('OIL_TRANSACTIONS.VIEW.MESSAGES.INSUFFICIENT_CAPACITY'),
        this.translate.instant('STANDARD.BTNS.CANCEL'),
        { duration: 3000 }
      );
      return;
    }

    // Prepare completion payload
    const completionPayload: ExchangeCompletionPayload = {
      id: this.oilTransaction!.id,
      storageUnitDestinationId: formValue.storageUnitDestinationId,
      oilQuantity: formValue.oilQuantity,
      oilUnitPrice: formValue.oilUnitPrice,
      qualityGrade: formValue.qualityGrade,
      notes: formValue.notes,
      transactionState: TransactionState.COMPLETED
    };

    // Call service to complete exchange
    this.oilTransactionService.completeExchange(completionPayload).subscribe({
      next: (response: ApiResponse<OilTransaction>) => {
        if (response.success) {
          this.snackBar.open(
            this.translate.instant('OIL_TRANSACTIONS.VIEW.MESSAGES.EXCHANGE_COMPLETED'),
            this.translate.instant('STANDARD.BTNS.CANCEL'),
            { duration: 3000 }
          );
          // Reload the transaction to show updated state
          this.loadOilTransaction();
          this.showExchangeForm = false;
        } else {
          this.snackBar.open(
            response.message || this.translate.instant('OIL_TRANSACTIONS.VIEW.MESSAGES.EXCHANGE_ERROR'),
            this.translate.instant('STANDARD.BTNS.CANCEL'),
            { duration: 3000 }
          );
        }
      },
      error: (error: Error) => {
        console.error('Error completing exchange:', error);
        this.snackBar.open(
          this.translate.instant('OIL_TRANSACTIONS.VIEW.MESSAGES.EXCHANGE_ERROR'),
          this.translate.instant('STANDARD.BTNS.CANCEL'),
          { duration: 3000 }
        );
      }
    });
  }

  onCancelExchange(): void {
    this.showExchangeForm = false;
    this.exchangeForm.reset();
  }

  // Helper method to get transaction type label
  getTransactionTypeLabel(type: TransactionType): string {
    return this.translate.instant(`OIL_TRANSACTIONS.DASHBOARD.TYPES.${type}`);
  }

  // Helper method to get transaction state label
  getTransactionStateLabel(state: TransactionState): string {
    return this.translate.instant(`OIL_TRANSACTIONS.DASHBOARD.STATUS.${state}`);
  }

  // Helper method to get storage unit name
  getStorageUnitName(unitId: string): string {
    const unit = this.availableStorageUnits.find(u => u.id === unitId);
    return unit ? unit.name : 'Unknown';
  }

  // Helper method to get available capacity for a storage unit
  getAvailableCapacity(unitId: string): number {
    const unit = this.availableStorageUnits.find(u => u.id === unitId);
    return unit ? unit.maxCapacity - unit.currentVolume : 0;
  }

  // Helper method to get storage unit info for display
  getStorageUnitInfo(unitId: string): string {
    const unit = this.availableStorageUnits.find(u => u.id === unitId);
    if (!unit) return 'Unknown';

    let info = `${unit.name} (${this.getAvailableCapacity(unitId).toFixed(2)} kg available)`;
    if (unit.avgCost > 0) {
      info += ` - Avg: ${unit.avgCost.toFixed(2)} TND/kg`;
    }

    return info;
  }
}
