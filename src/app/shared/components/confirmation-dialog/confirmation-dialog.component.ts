import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfirmationDialogData, ConfirmationDialogResult, ConfirmationType } from '../../services/confirmation-dialog.service';
import { Subscription, forkJoin } from 'rxjs';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss']
})
export class ConfirmationDialogComponent implements OnInit, OnDestroy {
  resolvedTitle = '';
  resolvedMessage = '';
  resolvedConfirmText = '';
  resolvedCancelText = '';
  resolvedDestructiveWarning = '';
  private langSub?: Subscription;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData,
    private dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.resolveTranslations();
    this.langSub = this.translate.onLangChange.subscribe(() => {
      this.resolveTranslations();
    });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  private resolveTranslations(): void {
    forkJoin({
      title: this.translate.get(this.data.title),
      message: this.translate.get(this.data.message),
      confirmText: this.translate.get(this.data.confirmText || 'STANDARD.CONFIRMATION.DEFAULT.CONFIRM'),
      cancelText: this.translate.get(this.data.cancelText || 'STANDARD.CONFIRMATION.DEFAULT.CANCEL'),
      destructiveWarning: this.translate.get('STANDARD.CONFIRMATION.DESTRUCTIVE_WARNING')
    }).subscribe(res => {
      this.resolvedTitle = res.title;
      this.resolvedMessage = res.message;
      this.resolvedConfirmText = res.confirmText;
      this.resolvedCancelText = res.cancelText;
      this.resolvedDestructiveWarning = res.destructiveWarning;
    });
  }

  getIcon(): string {
    switch (this.data.type) {
      case ConfirmationType.DELETE:
      case ConfirmationType.DANGER:
        return 'delete_forever';
      case ConfirmationType.WARNING:
        return 'warning';
      case ConfirmationType.INFO:
        return 'info';
      case ConfirmationType.SUCCESS:
        return 'check_circle';
      default:
        return 'help';
    }
  }

  getIconClass(): string {
    return `icon-${this.data.type}`;
  }

  getConfirmButtonClass(): string {
    if (this.data.destructive) {
      return 'confirm-button destructive';
    }
    return `confirm-button ${this.data.type}`;
  }

  onConfirm(): void {
    const result: ConfirmationDialogResult = {
      confirmed: true,
      data: this.data
    };
    this.dialogRef.close(result);
  }

  onCancel(): void {
    const result: ConfirmationDialogResult = {
      confirmed: false
    };
    this.dialogRef.close(result);
  }
}
