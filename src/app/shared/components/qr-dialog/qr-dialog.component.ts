import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { QrCodeResponse } from '../../models/qr-models';

@Component({
  selector: 'app-qr-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, TranslateModule],
  template: `
    <div class="qr-dialog">
      <header class="qr-dialog__header">
        <div class="qr-dialog__title-block">
          <mat-icon class="qr-dialog__title-icon">qr_code_2</mat-icon>
          <div>
            <h2 mat-dialog-title class="qr-dialog__title">{{ 'QR.TITLE' | translate }}</h2>
            <p class="qr-dialog__subtitle" *ngIf="data.payloadType">{{ data.payloadType }}</p>
          </div>
        </div>
        <button mat-icon-button type="button" (click)="onClose()" [attr.aria-label]="'COMMON.CLOSE' | translate">
          <mat-icon>close</mat-icon>
        </button>
      </header>

      <mat-dialog-content class="qr-dialog__content">
        <div class="qr-dialog__image-wrap">
          <img [src]="'data:image/png;base64,' + data.qrImageBase64" alt="QR Code" />
        </div>

        <div class="qr-dialog__code" *ngIf="data.qrText">
          <span class="qr-dialog__code-label">{{ 'AUTO.QR' | translate }}</span>
          <code>{{ data.qrText }}</code>
        </div>

        <div class="qr-dialog__meta">
          <div class="qr-dialog__meta-row">
            <span>{{ 'QR.TYPE' | translate }}</span>
            <strong>{{ data.payloadType }}</strong>
          </div>
          <div class="qr-dialog__meta-row">
            <span>{{ 'QR.ENCRYPTED' | translate }}</span>
            <strong>{{ (data.encrypted ? 'COMMON.YES' : 'COMMON.NO') | translate }}</strong>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions class="qr-dialog__actions">
        <button mat-stroked-button type="button" (click)="onClose()">
          {{ 'COMMON.CLOSE' | translate }}
        </button>
        <button mat-flat-button color="primary" type="button" (click)="onPrint()">
          <mat-icon>print</mat-icon>
          {{ 'COMMON.PRINT' | translate }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .qr-dialog {
        display: flex;
        flex-direction: column;
        background: #f7f8f6;
        border-radius: 12px;
        overflow: hidden;
      }

      .qr-dialog__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        padding: 16px 16px 10px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        background: #fff;
      }

      .qr-dialog__title-block {
        display: flex;
        align-items: flex-start;
        gap: 10px;
      }

      .qr-dialog__title-icon {
        margin-top: 2px;
        color: #3d5a2c;
      }

      .qr-dialog__title {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 600;
        line-height: 1.3;
        color: #1c2416;
      }

      .qr-dialog__subtitle {
        margin: 2px 0 0;
        font-size: 0.7rem;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #6b7a62;
      }

      .qr-dialog__content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 14px;
        padding: 18px 16px !important;
        margin: 0;
        max-height: none !important;
        overflow: visible !important;
      }

      .qr-dialog__image-wrap {
        padding: 12px;
        background: #fff;
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 10px;
      }

      .qr-dialog__image-wrap img {
        display: block;
        width: 200px;
        height: 200px;
        object-fit: contain;
      }

      .qr-dialog__code {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 10px 12px;
        background: #fff;
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 8px;
      }

      .qr-dialog__code-label {
        font-size: 0.68rem;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #6b7a62;
      }

      .qr-dialog__code code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 1rem;
        letter-spacing: 0.05em;
        color: #1c2416;
        word-break: break-all;
      }

      .qr-dialog__meta {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .qr-dialog__meta-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        font-size: 0.85rem;
        color: #5c6b52;
      }

      .qr-dialog__meta-row strong {
        color: #1c2416;
        font-weight: 600;
        text-align: right;
      }

      .qr-dialog__actions {
        display: flex;
        justify-content: stretch;
        gap: 10px;
        margin: 0;
        padding: 12px 16px 16px;
        border-top: 1px solid rgba(0, 0, 0, 0.08);
        background: #fff;
      }

      .qr-dialog__actions button {
        flex: 1;
      }

      .qr-dialog__actions mat-icon {
        margin-right: 4px;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    `
  ]
})
export class QrDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<QrDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: QrCodeResponse
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: system-ui, sans-serif; color: #111; }
            img { width: 280px; height: 280px; }
            .code { margin-top: 12px; font-family: ui-monospace, monospace; font-size: 18px; letter-spacing: 0.04em; }
            .details { margin-top: 8px; color: #555; font-size: 14px; }
          </style>
        </head>
        <body onload="window.print();window.close()">
          <img src="data:image/png;base64,${this.data.qrImageBase64}" alt="QR Code" />
          ${this.data.qrText ? `<div class="code">${this.data.qrText}</div>` : ''}
          <div class="details">Type: ${this.data.payloadType || ''}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
}
