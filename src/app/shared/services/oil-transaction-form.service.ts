import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Observable } from 'rxjs';
import { ExchangeCalculation } from './oil-transaction-view.service';

export interface ExchangeFormData {
  storageUnitDestinationId: string;
  oilQuantity: number;
  oilUnitPrice: number;
  qualityGrade: string;
  notes: string;
}

@Injectable({
  providedIn: 'root'
})
export class OilTransactionFormService {
  private exchangeFormSubject = new BehaviorSubject<FormGroup | null>(null);
  private calculationSubject = new BehaviorSubject<ExchangeCalculation | null>(null);

  constructor(private fb: FormBuilder) {
    this.initializeExchangeForm();
  }

  /**
   * Get the exchange form as an observable
   */
  getExchangeForm(): Observable<FormGroup | null> {
    return this.exchangeFormSubject.asObservable();
  }

  /**
   * Get the current exchange form
   */
  getCurrentExchangeForm(): FormGroup | null {
    return this.exchangeFormSubject.value;
  }

  /**
   * Get exchange calculation as observable
   */
  getExchangeCalculation(): Observable<ExchangeCalculation | null> {
    return this.calculationSubject.asObservable();
  }

  /**
   * Update exchange calculation
   */
  updateExchangeCalculation(calculation: ExchangeCalculation | null): void {
    this.calculationSubject.next(calculation);
  }

  /**
   * Initialize the exchange form
   */
  private initializeExchangeForm(): void {
    const form = this.fb.group({
      storageUnitDestinationId: ['', Validators.required],
      oilQuantity: ['', [Validators.required, Validators.min(0.01)]],
      oilUnitPrice: ['', [Validators.required, Validators.min(0)]],
      qualityGrade: ['', Validators.required],
      notes: ['']
    });

    this.exchangeFormSubject.next(form);
  }

  /**
   * Reset the exchange form
   */
  resetExchangeForm(): void {
    const form = this.getCurrentExchangeForm();
    if (form) {
      form.reset();
    }
    this.updateExchangeCalculation(null);
  }

  /**
   * Pre-fill the exchange form with calculated values
   */
  prefillExchangeForm(calculation: ExchangeCalculation, qualityGrade: string): void {
    const form = this.getCurrentExchangeForm();
    if (form) {
      form.patchValue(
        {
          oilQuantity: calculation.calculatedOilQuantity,
          oilUnitPrice: calculation.oilUnitPrice,
          qualityGrade: qualityGrade
        },
        { emitEvent: false }
      );
    }
  }

  /**
   * Get form data for submission
   */
  getFormData(): ExchangeFormData | null {
    const form = this.getCurrentExchangeForm();
    if (form && form.valid) {
      return form.value as ExchangeFormData;
    }
    return null;
  }

  /**
   * Validate form and return errors
   */
  validateForm(): { isValid: boolean; errors: string[] } {
    const form = this.getCurrentExchangeForm();
    if (!form) {
      return { isValid: false, errors: ['Form not initialized'] };
    }

    const errors: string[] = [];

    if (form.invalid) {
      Object.keys(form.controls).forEach((key) => {
        const control = form.get(key);
        if (control?.errors) {
          if (control.errors['required']) {
            errors.push(`${key} is required`);
          }
          if (control.errors['min']) {
            errors.push(`${key} must be greater than ${control.errors['min'].min}`);
          }
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Set form errors
   */
  setFormErrors(errors: { [key: string]: string }): void {
    const form = this.getCurrentExchangeForm();
    if (form) {
      Object.keys(errors).forEach((key) => {
        const control = form.get(key);
        if (control) {
          control.setErrors({ custom: errors[key] });
        }
      });
    }
  }

  /**
   * Clear form errors
   */
  clearFormErrors(): void {
    const form = this.getCurrentExchangeForm();
    if (form) {
      Object.keys(form.controls).forEach((key) => {
        const control = form.get(key);
        if (control) {
          control.setErrors(null);
        }
      });
    }
  }
}
