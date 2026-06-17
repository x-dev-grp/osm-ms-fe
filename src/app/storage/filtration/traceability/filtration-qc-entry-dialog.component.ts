import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';

import { QcEntryStudioComponent } from '../../../shared/qc/components/qc-entry-studio/qc-entry-studio.component';

interface FiltrationQcDialogData {
  filtrationOperationId: string;
  traceabilityLotId?: string | null;
}

@Component({
  selector: 'app-filtration-qc-entry-dialog',
  standalone: true,
  templateUrl: './filtration-qc-entry-dialog.component.html',
  styleUrls: ['./filtration-qc-entry-dialog.component.scss'],
  imports: [
    TranslateModule,
    CommonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    QcEntryStudioComponent
  ]
})
export class FiltrationQcEntryDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public readonly data: FiltrationQcDialogData,
    private readonly dialogRef: MatDialogRef<FiltrationQcEntryDialogComponent>
  ) {}

  cancel(): void {
    this.dialogRef.close(false);
  }

  onSaved(): void {
    this.dialogRef.close(true);
  }
}
