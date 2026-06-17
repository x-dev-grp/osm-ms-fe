import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatDividerModule} from '@angular/material/divider';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {catchError, of, Subject, takeUntil} from 'rxjs';
import {OilTransaction, TransactionState, TransactionType} from '../../../shared/models/OilTransaction';
import {FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {ApiResponse} from '../../../shared/models/api-response';
import {
  ExchangeCalculation,
  OilTransactionViewService,
  StorageUnitInfo,
  TransactionViewData
} from '../../../shared/services/oil-transaction-view.service';
import {OilTransactionFormService} from '../../../shared/services/oil-transaction-form.service';
import { ToastService } from '../../../shared/services/toast.service';
import { MatTooltip } from '@angular/material/tooltip';

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
    MatSelectModule,
    MatTooltip
  ],
  templateUrl: './view-oil-transaction.component.html',
  styleUrls: ['./view-oil-transaction.component.scss']
})
export class ViewOilTransactionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Component state
  loading = true;
  error = false;
  errorMessage = '';

  // Data
  viewData: TransactionViewData | null = null;
  exchangeForm: FormGroup | null = null;
  exchangeCalculation: ExchangeCalculation | null = null;

  // UI state
  showExchangeForm = false;
  submitting = false;

  // Enum references for template
  TransactionType = TransactionType;
  TransactionState = TransactionState;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private viewService: OilTransactionViewService,
    private formService: OilTransactionFormService,
    private toast: ToastService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize component data and subscriptions
   */
  private initializeComponent(): void {
    const transactionId = this.route.snapshot.paramMap.get('id');

    if (!transactionId) {
      this.handleError('Transaction ID not provided');
      return;
    }
    console.log('🔍 Chargement des données pour la transaction ID :', transactionId);

    // Load transaction data
    this.loadTransactionData(transactionId);

    // Setup form subscriptions
    this.setupFormSubscriptions();
  }

  /**
   * Load transaction data using the view service
   */
  private loadTransactionData(transactionId: string): void {
    this.loading = true;
    this.error = false;
    console.log('🔄 Envoi de la requête pour charger les données de la transaction:', transactionId);

    this.viewService
      .loadTransactionViewData(transactionId)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Error loading transaction data:', error);
          this.handleError('Failed to load transaction data');
          return of(null);
        })
      )
      .subscribe((data) => {
        if (data) {
          console.log('✅ Données chargées avec succès pour la transaction:', transactionId, data);
          this.viewData = data;
          console.log('transactipn', this.viewData);
          this.showExchangeForm = data.showExchangeForm;
          this.setupExchangeForm();
        }
        this.loading = false;
      });
  }

  /**
   * Setup form subscriptions
   */
  private setupFormSubscriptions(): void {
    // Subscribe to exchange form
    this.formService
      .getExchangeForm()
      .pipe(takeUntil(this.destroy$))
      .subscribe((form) => {
        this.exchangeForm = form;
      });

    // Subscribe to exchange calculation
    this.formService
      .getExchangeCalculation()
      .pipe(takeUntil(this.destroy$))
      .subscribe((calculation) => {
        this.exchangeCalculation = calculation;
      });
  }

  /**
   * Setup exchange form if needed
   */
  private setupExchangeForm(): void {
    if (this.showExchangeForm && this.viewData) {
      // Listen to storage unit changes for recalculation
      this.exchangeForm
        ?.get('storageUnitDestinationId')
        ?.valueChanges.pipe(takeUntil(this.destroy$))
        .subscribe((storageUnitId) => {
          if (storageUnitId && this.viewData) {
            this.recalculateExchangeValues(storageUnitId);
          }
        });
    }
  }

  /**
   * Recalculate exchange values when storage unit changes
   */
  private recalculateExchangeValues(storageUnitId: string): void {
    if (!this.viewData) return;

    const calculation = this.viewService.calculateExchangeValues(
      this.viewData.transaction,
      storageUnitId,
      this.viewData.availableStorageUnits
    );

    if (calculation) {
      this.formService.updateExchangeCalculation(calculation);
      this.formService.prefillExchangeForm(calculation, this.viewData.transaction.qualityGrade || 'vierge_extra');
    }
  }

  /**
   * Handle errors
   */
  private handleError(message: string): void {
    this.error = true;
    this.errorMessage = message;
    this.loading = false;
    this.toast.error(this.translate.instant('OIL_TRANSACTIONS.VIEW.MESSAGES.ERROR'));
  }

  /**
   * Handle successful operations
   */
  private handleSuccess(message: string): void {
    this.toast.success(this.translate.instant(message));
  }

  // Public methods for template

  /**
   * Navigate to edit page
   */
  onEdit(): void {
    if (this.viewData?.transaction) {
      this.router.navigate(['/storage/oil-transactions', this.viewData.transaction.id, 'edit']);
    }
  }

  /**
   * Navigate back to list
   */
  onBack(): void {
    this.router.navigate(['/storage/oil-transactions']);
  }

  /**
   * Delete transaction
   */
  onDelete(): void {
    if (!this.viewData?.transaction) return;

    const confirmMessage = this.translate.instant('OIL_TRANSACTIONS.VIEW.MESSAGES.DELETE_CONFIRM');
    if (!confirm(confirmMessage)) return;

    this.viewService
      .deleteTransaction(this.viewData.transaction.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { success: boolean; message: string; data: void }) => {
          if (response.success) {
            this.handleSuccess('OIL_TRANSACTIONS.VIEW.MESSAGES.DELETE_SUCCESS');
            this.router.navigate(['/storage/oil-transactions']);
          } else {
            this.handleError('OIL_TRANSACTIONS.VIEW.MESSAGES.DELETE_ERROR');
          }
        },
        error: (error: Error) => {
          console.error('Error deleting transaction:', error);
          this.handleError('OIL_TRANSACTIONS.VIEW.MESSAGES.DELETE_ERROR');
        }
      });
  }

  /**
   *
   *
   * Complete exchange transaction
   *
   *
   **/
  onCompleteExchange(): void {
    if (!this.exchangeForm || !this.viewData) return;

    // Validate form
    const validation = this.formService.validateForm();
    if (!validation.isValid) {
      this.toast.warning(validation.errors.join('AUTO.MESSAGE'));
      return;
    }

    // Get form data
    const formData = this.formService.getFormData();
    if (!formData) {
      this.handleError('Invalid form data');
      return;
    }

    // Validate with business rules
    const businessValidation = this.viewService.validateExchangeCompletion(formData, this.viewData.availableStorageUnits);

    if (!businessValidation.isValid) {
      this.toast.warning(businessValidation.errors.join('AUTO.MESSAGE'));
      return;
    }

    // Submit
    this.submitting = true;
    const payload = {
      id: this.viewData.transaction.id,
      storageUnitDestinationId: formData.storageUnitDestinationId,
      oilQuantity: formData.oilQuantity,
      oilUnitPrice: formData.oilUnitPrice,
      qualityGrade: formData.qualityGrade,
      notes: formData.notes,
      transactionState: TransactionState.COMPLETED
    };

    this.viewService
      .completeExchange(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ApiResponse<OilTransaction>) => {
          this.submitting = false;
          if (response.success) {
            this.handleSuccess('OIL_TRANSACTIONS.VIEW.MESSAGES.EXCHANGE_COMPLETED');
            // Reload transaction data
            this.loadTransactionData(this.viewData!.transaction.id);
            this.showExchangeForm = false;
          } else {
            this.handleError(response.message || 'OIL_TRANSACTIONS.VIEW.MESSAGES.EXCHANGE_ERROR');
          }
        },
        error: (error: Error) => {
          this.submitting = false;
          console.error('Error completing exchange:', error);
          this.handleError('OIL_TRANSACTIONS.VIEW.MESSAGES.EXCHANGE_ERROR');
        }
      });
  }

  /**
   * Cancel exchange form
   */
  onCancelExchange(): void {
    this.showExchangeForm = false;
    this.formService.resetExchangeForm();
  }

  // Helper methods for template

  /**
   * Get transaction type label
   */
  getTransactionTypeLabel(type: TransactionType): string {
    return this.translate.instant(`OIL_TRANSACTIONS.DASHBOARD.TYPES.${type}`);
  }

  /**
   * Get transaction state label
   */
  getTransactionStateLabel(state: TransactionState): string {
    return this.translate.instant(`OIL_TRANSACTIONS.DASHBOARD.STATUS.${state}`);
  }

  /**
   * Get storage unit name
   */
  getStorageUnitName(unitId: string): string {
    const unit = this.viewData?.availableStorageUnits.find((u) => u.unit.id === unitId);
    return unit ? unit.unit.name : 'Unknown';
  }

  /**
   * Get available capacity for storage unit
   */
  getAvailableCapacity(unitId: string): number {
    const unit = this.viewData?.availableStorageUnits.find((u) => u.unit.id === unitId);
    return unit ? unit.availableCapacity : 0;
  }

  /**
   * Get storage unit display info
   */
  getStorageUnitInfo(unitId: string): string {
    const unit = this.viewData?.availableStorageUnits.find((u) => u.unit.id === unitId);
    return unit ? unit.displayInfo : 'Unknown';
  }

  // Getters for template

  get oilTransaction(): OilTransaction | null {
    return this.viewData?.transaction || null;
  }

  get availableStorageUnits(): StorageUnitInfo[] {
    return this.viewData?.availableStorageUnits || [];
  }

  get canCompleteExchange(): boolean {
    return this.viewData?.canCompleteExchange || false;
  }
}
