import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

export enum ToastType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export interface ToastConfig {
  type?: ToastType;
  duration?: number;
  message: string;
  action?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly defaultConfig: MatSnackBarConfig = {
    horizontalPosition: 'center',
    verticalPosition: 'bottom',
    panelClass: []
  };

  private readonly toastConfigs = {
    [ToastType.SUCCESS]: {
      duration: 4000,
      panelClass: ['toast-success'],
      action: 'STANDARD.BTNS.CLOSE'
    },
    [ToastType.ERROR]: {
      duration: 6000,
      panelClass: ['toast-error'],
      action: 'STANDARD.BTNS.CLOSE'
    },
    [ToastType.WARNING]: {
      duration: 5000,
      panelClass: ['toast-warning'],
      action: 'STANDARD.BTNS.CLOSE'
    },
    [ToastType.INFO]: {
      duration: 4000,
      panelClass: ['toast-info'],
      action: 'STANDARD.BTNS.CLOSE'
    }
  };

  constructor(
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {}

  /**
   * Show a success toast message
   */
  success(message: string, duration?: number): void {
    this.show({
      type: ToastType.SUCCESS,
      message,
      duration
    });
  }

  /**
   * Show an error toast message
   */
  error(message: string, duration?: number): void {
    this.show({
      type: ToastType.ERROR,
      message,
      duration
    });
  }

  /**
   * Show a warning toast message
   */
  warning(message: string, duration?: number): void {
    this.show({
      type: ToastType.WARNING,
      message,
      duration
    });
  }

  /**
   * Show an info toast message
   */
  info(message: string, duration?: number): void {
    this.show({
      type: ToastType.INFO,
      message,
      duration
    });
  }

  /**
   * Show a custom toast message
   */
  show(config: ToastConfig): void {
    const toastType = config.type || ToastType.INFO;
    const typeConfig = this.toastConfigs[toastType];

    const snackBarConfig: MatSnackBarConfig = {
      ...this.defaultConfig,
      duration: config.duration || typeConfig.duration,
      panelClass: typeConfig.panelClass
    };

    const action = config.action || this.translate.instant(typeConfig.action);

    this.snackBar.open(
      this.translate.instant(config.message),
      action,
      snackBarConfig
    );
  }

  /**
   * Show a toast based on operation result
   */
  showOperationResult(success: boolean, successMessage: string, errorMessage: string): void {
    if (success) {
      this.success(successMessage);
    } else {
      this.error(errorMessage);
    }
  }

  /**
   * Show a toast for form validation errors
   */
  showValidationError(message?: string): void {
    const defaultMessage = 'FORM.VALIDATION.ERROR';
    this.error(message || defaultMessage);
  }

  /**
   * Show a toast for network/server errors
   */
  showNetworkError(message?: string): void {
    const defaultMessage = 'NETWORK.ERROR';
    this.error(message || defaultMessage);
  }

  /**
   * Show a toast for save operations
   */
  showSaveResult(success: boolean, isEdit: boolean = false): void {
    if (success) {
      const message = isEdit ? 'FORM.MESSAGES.UPDATE_SUCCESS' : 'FORM.MESSAGES.SAVE_SUCCESS';
      this.success(message);
    } else {
      const message = isEdit ? 'FORM.MESSAGES.UPDATE_ERROR' : 'FORM.MESSAGES.SAVE_ERROR';
      this.error(message);
    }
  }

  /**
   * Show a toast for delete operations
   */
  showDeleteResult(success: boolean): void {
    if (success) {
      this.success('FORM.MESSAGES.DELETE_SUCCESS');
    } else {
      this.error('FORM.MESSAGES.DELETE_ERROR');
    }
  }

  /**
   * Show a toast for loading errors
   */
  showLoadError(message?: string): void {
    const defaultMessage = 'FORM.MESSAGES.LOAD_ERROR';
    this.error(message || defaultMessage);
  }
}
