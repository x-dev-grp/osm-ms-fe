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
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ],
  template: `
    <h2 mat-dialog-title>{{ 'QR.TITLE' | translate }}</h2>
    <mat-dialog-content class="qr-content">
      <div class="qr-image-container">
        <img [src]="'data:image/png;base64,' + data.qrImageBase64" alt="QR Code" />
      </div>
      <div class="qr-details">
        <p><strong>{{ 'QR.TYPE' | translate }}:</strong> {{ data.payloadType }}</p>
        <p><strong>{{ 'QR.ENCRYPTED' | translate }}:</strong> {{ (data.encrypted ? 'COMMON.YES' : 'COMMON.NO') | translate }}</p>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onClose()">{{ 'COMMON.CLOSE' | translate }}</button>
      <button mat-raised-button color="primary" (click)="onPrint()">
        <mat-icon>print</mat-icon>
        {{ 'COMMON.PRINT' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .qr-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    }
    .qr-image-container {
      margin-bottom: 20px;
      padding: 10px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
    }
    .qr-image-container img {
      max-width: 250px;
      height: auto;
    }
    .qr-details {
      text-align: center;
      color: #666;
    }
  `]
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
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Code</title>
            <style>
              body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
              img { width: 300px; }
              .details { margin-top: 20px; text-align: center; }
            </style>
          </head>
          <body onload="window.print();window.close()">
            <img src="data:image/png;base64,${this.data.qrImageBase64}" />
            <div class="details">
              <p>Type: ${this.data.payloadType}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }
}
