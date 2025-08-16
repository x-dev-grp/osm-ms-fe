import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private snackBar = inject(MatSnackBar);
  translateService=inject(TranslateService)
  private baseConfig: MatSnackBarConfig = {
    duration: 3500,
    horizontalPosition: 'right', // toujours à gauche
    verticalPosition: 'top',    // toujours en haut
    panelClass: ['app-toast'],  // classe CSS globale
  };

  open(message: string, action?: string  , config?: MatSnackBarConfig) {
    return this.snackBar.open(message, action, {
      ...this.baseConfig,
      ...config,
    });
  }

  success(message: string) {
    return this.open(message,  "", { panelClass: ['app-toast', 'app-toast-success'] });
  }

  error(message: string) {
    return this.open(message,  "", { panelClass: ['app-toast', 'app-toast-error'] });
  }

/**
 * Display an information toast message with custom styling
 * @param message The message content to display in the toast
 * @returns The result of the open method call
 */
  info(message: string) {
    return this.open(message,  "", { panelClass: ['app-toast', 'app-toast-info'] });
  }

  warning(message: string) {
    return this.open(message,  "", { panelClass: ['app-toast', 'app-toast-warning'] });
  }
}
