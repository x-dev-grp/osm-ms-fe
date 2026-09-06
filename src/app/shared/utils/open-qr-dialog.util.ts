import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { QrDialogComponent } from '../components/qr-dialog/qr-dialog.component';
import { QrCodeResponse } from '../models/qr-models';

export interface OpenQrDialogInput {
  code: string;
  qrImageBase64: string;
  payloadType: string;
  encrypted?: boolean;
}

export function toQrDialogData(input: OpenQrDialogInput): QrCodeResponse {
  return {
    qrText: input.code,
    qrImageBase64: input.qrImageBase64,
    encrypted: input.encrypted ?? true,
    payloadType: input.payloadType,
    payloadMode: 'PUBLIC_CODE'
  };
}

export function openQrDialog(
  dialog: MatDialog,
  input: OpenQrDialogInput
): MatDialogRef<QrDialogComponent> {
  return dialog.open(QrDialogComponent, {
    width: '380px',
    maxWidth: '92vw',
    autoFocus: false,
    restoreFocus: true,
    panelClass: 'qr-center-dialog',
    enterAnimationDuration: '160ms',
    exitAnimationDuration: '120ms',
    data: toQrDialogData(input)
  });
}
