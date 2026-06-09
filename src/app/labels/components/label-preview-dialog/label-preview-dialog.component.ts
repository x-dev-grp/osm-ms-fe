import { CommonModule } from '@angular/common';
import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { LabelPreviewViewModel } from '../../models/label-preview.model';
import { LabelPreviewCardComponent } from '../label-preview-card/label-preview-card.component';

export interface LabelPreviewDialogData {
  viewModel: LabelPreviewViewModel;
  payloadJson: string;
}

@Component({
  selector: 'app-label-preview-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, LabelPreviewCardComponent],
  templateUrl: './label-preview-dialog.component.html',
  styleUrls: ['./label-preview-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LabelPreviewDialogComponent {
  showJson = false;

  constructor(
    private readonly dialogRef: MatDialogRef<LabelPreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) readonly data: LabelPreviewDialogData
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  toggleJson(): void {
    this.showJson = !this.showJson;
  }
}
