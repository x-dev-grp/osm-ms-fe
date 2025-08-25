import { Injectable } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';
import { OilTransaction, TransactionState, TransactionType } from '../models/OilTransaction';
import { StorageUnitDto } from '../models/StorageUnitDto';
import { OilTransactionService, ExchangeCompletionPayload } from './OilTransactionService';
import { StorageUnitDtoService } from './storage.service';
import { ApiResponse } from '../models/api-response';

export interface ExchangeCalculation {
  oliveQuantity: number;
  oliveUnitPrice: number;
  oliveTotalValue: number;
  oilUnitPrice: number;
  calculatedOilQuantity: number;
  selectedStorageUnitName: string;
}

export interface StorageUnitInfo {
  unit: StorageUnitDto;
  availableCapacity: number;
  displayInfo: string;
}

export interface TransactionViewData {
  transaction: OilTransaction;
  availableStorageUnits: StorageUnitInfo[];
  exchangeCalculation?: ExchangeCalculation;
  canCompleteExchange: boolean;
  showExchangeForm: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OilTransactionViewService {

  constructor(
    private oilTransactionService: OilTransactionService,
    private storageService: StorageUnitDtoService
  ) {}

  /**
   * Load complete transaction view data including storage units and calculations
   */
  loadTransactionViewData(transactionId: string): Observable<TransactionViewData> {
    return combineLatest({
      transaction: this.oilTransactionService.getOilTransaction(transactionId),
      storageUnits: this.storageService.getAllStorageUnit()
    }).pipe(
      map(({ transaction, storageUnits }) => {
        const oilTransaction = Array.isArray(transaction.data) ? transaction.data[0] : transaction.data;

        if (!oilTransaction) {
          throw new Error('Transaction not found');
        }

        const availableStorageUnits = this.filterAndEnrichStorageUnits(
          storageUnits.data || [],
          oilTransaction
        );

        const canCompleteExchange = this.canCompleteExchange(oilTransaction);
        const showExchangeForm = canCompleteExchange;

        return {
          transaction: oilTransaction,
          availableStorageUnits,
          canCompleteExchange,
          showExchangeForm
        };
      })
    );
  }

  /**
   * Calculate exchange values based on olive reception and storage unit
   */
  calculateExchangeValues(
    transaction: OilTransaction,
    storageUnitId: string,
    availableStorageUnits: StorageUnitInfo[]
  ): ExchangeCalculation | null {
    if (!transaction.reception) {
      return null;
    }

    const reception = transaction.reception;
    const oliveQuantity = reception.oliveQuantity || reception.poidsNet || 0;
    const oliveUnitPrice = reception.unitPrice || 0;
    const oliveTotalValue = oliveQuantity * oliveUnitPrice;

    const selectedStorageUnit = availableStorageUnits.find(
      unit => unit.unit.id === storageUnitId
    );

    if (!selectedStorageUnit) {
      return null;
    }

    let oilUnitPrice: number;
    let calculatedOilQuantity: number;

    if (selectedStorageUnit.unit.avgCost > 0) {
      // Use the average cost from storage unit
      oilUnitPrice = selectedStorageUnit.unit.avgCost;
      calculatedOilQuantity = oliveTotalValue / oilUnitPrice;
    } else {
      // Fallback to default calculation if no average cost available
      oilUnitPrice = oliveUnitPrice * 1.5; // 50% markup as fallback
      calculatedOilQuantity = oliveTotalValue / oilUnitPrice;
    }

    return {
      oliveQuantity,
      oliveUnitPrice,
      oliveTotalValue,
      oilUnitPrice,
      calculatedOilQuantity,
      selectedStorageUnitName: selectedStorageUnit.unit.name || 'Unknown'
    };
  }

  /**
   * Validate exchange completion data
   */
    validateExchangeCompletion(
    formData: { storageUnitDestinationId: string; oilQuantity: number; oilUnitPrice: number; qualityGrade: string },
    availableStorageUnits: StorageUnitInfo[]
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!formData.storageUnitDestinationId) {
      errors.push('Storage unit is required');
    }

    if (!formData.oilQuantity || formData.oilQuantity <= 0) {
      errors.push('Oil quantity must be greater than 0');
    }

    if (!formData.oilUnitPrice || formData.oilUnitPrice < 0) {
      errors.push('Oil unit price must be non-negative');
    }

    if (!formData.qualityGrade) {
      errors.push('Quality grade is required');
    }

    // Check storage capacity
    const selectedStorageUnit = availableStorageUnits.find(
      unit => unit.unit.id === formData.storageUnitDestinationId
    );

    if (selectedStorageUnit && formData.oilQuantity > selectedStorageUnit.availableCapacity) {
      errors.push(`Insufficient storage capacity. Available: ${selectedStorageUnit.availableCapacity.toFixed(2)} kg`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Complete exchange transaction
   */
  completeExchange(payload: ExchangeCompletionPayload): Observable<ApiResponse<OilTransaction>> {
    return this.oilTransactionService.completeExchange(payload);
  }

  /**
   * Delete oil transaction
   */
  deleteTransaction(transactionId: string): Observable<{ success: boolean; message: string; data: void }> {
    return this.oilTransactionService.deleteOilTransaction(transactionId);
  }

  /**
   * Check if exchange can be completed
   */
  private canCompleteExchange(transaction: OilTransaction): boolean {
    return transaction.transactionType === TransactionType.EXCHANGE &&
           transaction.transactionState === TransactionState.PENDING &&
           !!transaction.reception;
  }

  /**
   * Filter and enrich storage units with additional information
   */
  private filterAndEnrichStorageUnits(
    units: StorageUnitDto[],
    transaction: OilTransaction
  ): StorageUnitInfo[] {
    // Filter for available storage units that can receive oil
    let filteredUnits = units.filter(unit =>
      unit.status === 'AVAILABLE' && unit.currentVolume < unit.maxCapacity
    );

    // For exchange transactions, filter by quality grade if available
    if (transaction.transactionType === TransactionType.EXCHANGE &&
        transaction.qualityGrade) {
      const targetQualityGrade = transaction.qualityGrade;
      filteredUnits = filteredUnits.filter(unit => {
        // If storage unit has a specific oil type, it must match the quality grade
        if (unit.oilVariety) {
          return unit.oilVariety.name.toLowerCase().includes(targetQualityGrade.toLowerCase()) ||
                 (unit.oilVariety.id && unit.oilVariety.id.toString() === targetQualityGrade);
        }
        // If no specific oil type, allow any storage unit (general purpose)
        return true;
      });
    }

    // Enrich with additional information
    return filteredUnits.map(unit => ({
      unit,
      availableCapacity: unit.maxCapacity - unit.currentVolume,
      displayInfo: this.createStorageUnitDisplayInfo(unit)
    }));
  }

  /**
   * Create display information for storage unit
   */
  private createStorageUnitDisplayInfo(unit: StorageUnitDto): string {
    const availableCapacity = unit.maxCapacity - unit.currentVolume;
    let info = `${unit.name} (${availableCapacity.toFixed(2)} kg available)`;

    if (unit.avgCost > 0) {
      info += ` - Avg: ${unit.avgCost.toFixed(2)} TND/kg`;
    }

    return info;
  }
}
