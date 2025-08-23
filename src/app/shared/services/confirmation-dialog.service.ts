import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmationDialogComponent } from '../components/confirmation-dialog/confirmation-dialog.component';

export enum ConfirmationType {
  DELETE = 'delete',
  WARNING = 'warning',
  INFO = 'info',
  SUCCESS = 'success',
  DANGER = 'danger'
}

export interface ConfirmationDialogData {
  title: string;
  message: string;
  type: ConfirmationType;
  confirmText?: string;
  cancelText?: string;
  showIcon?: boolean;
  itemName?: string;
  destructive?: boolean;
}

export interface ConfirmationDialogResult {
  confirmed: boolean;
  data?: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationDialogService {
  private readonly defaultConfig: MatDialogConfig = {
    width: '400px',
    maxWidth: '90vw',
    disableClose: true,
    autoFocus: false,
    panelClass: 'enhanced-confirmation-dialog'
  };

  constructor(private dialog: MatDialog) {}

  /**
   * Show a delete confirmation dialog
   */
  confirmDelete(itemName?: string, customMessage?: string): Observable<ConfirmationDialogResult> {
    const data: ConfirmationDialogData = {
      title: 'STANDARD.CONFIRMATION.DELETE.TITLE',
      message: customMessage || 'STANDARD.CONFIRMATION.DELETE.MESSAGE',
      type: ConfirmationType.DELETE,
      confirmText: 'STANDARD.CONFIRMATION.DELETE.CONFIRM',
      cancelText: 'STANDARD.CONFIRMATION.DELETE.CANCEL',
      showIcon: true,
      itemName,
      destructive: true
    };

    return this.showConfirmation(data);
  }

  /**
   * Show a warning confirmation dialog
   */
  confirmWarning(): Observable<ConfirmationDialogResult> {
    const data: ConfirmationDialogData = {
      title: 'STANDARD.CONFIRMATION.WARNING.TITLE',
      message: 'STANDARD.CONFIRMATION.WARNING.MESSAGE',
      type: ConfirmationType.WARNING,
      confirmText: 'STANDARD.CONFIRMATION.WARNING.CONFIRM',
      cancelText: 'STANDARD.CONFIRMATION.WARNING.CANCEL',
      showIcon: true,
      destructive: false
    };

    return this.showConfirmation(data);
  }

  /**
   * Show a custom confirmation dialog
   */
  confirm(data: ConfirmationDialogData): Observable<ConfirmationDialogResult> {
    return this.showConfirmation(data);
  }

  /**
   * Show a simple confirmation dialog
   */
  confirmSimple(type: ConfirmationType = ConfirmationType.INFO): Observable<ConfirmationDialogResult> {
    const data: ConfirmationDialogData = {
      title: 'STANDARD.CONFIRMATION.SIMPLE.TITLE',
      message: 'STANDARD.CONFIRMATION.SIMPLE.MESSAGE',
      type,
      confirmText: 'STANDARD.CONFIRMATION.SIMPLE.CONFIRM',
      cancelText: 'STANDARD.CONFIRMATION.SIMPLE.CANCEL',
      showIcon: true,
      destructive: type === ConfirmationType.DELETE || type === ConfirmationType.DANGER
    };

    return this.showConfirmation(data);
  }

  /**
   * Show a confirmation dialog for bulk operations
   */
  confirmBulkDelete(itemCount: number, itemType: string): Observable<ConfirmationDialogResult> {
    const data: ConfirmationDialogData = {
      title: 'STANDARD.CONFIRMATION.BULK_DELETE.TITLE',
      message: 'STANDARD.CONFIRMATION.BULK_DELETE.MESSAGE',
      type: ConfirmationType.DANGER,
      confirmText: 'STANDARD.CONFIRMATION.BULK_DELETE.CONFIRM',
      cancelText: 'STANDARD.CONFIRMATION.BULK_DELETE.CANCEL',
      showIcon: true,
      itemName: `${itemCount} ${itemType}`,
      destructive: true
    };

    return this.showConfirmation(data);
  }

  /**
   * Show a confirmation dialog for data loss
   */
  confirmDataLoss(message?: string): Observable<ConfirmationDialogResult> {
    const data: ConfirmationDialogData = {
      title: 'STANDARD.CONFIRMATION.DATA_LOSS.TITLE',
      message: message || 'STANDARD.CONFIRMATION.DATA_LOSS.MESSAGE',
      type: ConfirmationType.WARNING,
      confirmText: 'STANDARD.CONFIRMATION.DATA_LOSS.CONFIRM',
      cancelText: 'STANDARD.CONFIRMATION.DATA_LOSS.CANCEL',
      showIcon: true,
      destructive: true
    };

    return this.showConfirmation(data);
  }

  /**
   * Show a confirmation dialog for unsaved changes
   */
  confirmUnsavedChanges(): Observable<ConfirmationDialogResult> {
    const data: ConfirmationDialogData = {
      title: 'STANDARD.CONFIRMATION.UNSAVED_CHANGES.TITLE',
      message: 'STANDARD.CONFIRMATION.UNSAVED_CHANGES.MESSAGE',
      type: ConfirmationType.WARNING,
      confirmText: 'STANDARD.CONFIRMATION.UNSAVED_CHANGES.CONFIRM',
      cancelText: 'STANDARD.CONFIRMATION.UNSAVED_CHANGES.CANCEL',
      showIcon: true,
      destructive: false
    };

    return this.showConfirmation(data);
  }

  /**
   * Internal method to show the confirmation dialog
   */
  private showConfirmation(data: ConfirmationDialogData): Observable<ConfirmationDialogResult> {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      ...this.defaultConfig,
      data
    });

    return dialogRef.afterClosed();
  }
}
